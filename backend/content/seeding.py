"""
Content seeding engine.

Loads the authored course content (four JSON files under ``seed_data/``) into the
database. The logic lives here — separate from the thin management command — so
it can be unit-tested and pointed at alternative fixture directories.

Design notes worth reading:

* **Idempotency.** Every row is matched on a *natural key* (Module.sequence_no,
  Assessment.assessment_type+module, Question.assessment+question_order,
  ContentPage.module+page_order, Scenario.module+scenario_order) via
  ``update_or_create``. Running the seeder twice without ``--flush`` therefore
  updates rows in place instead of duplicating them.

* **Pass 3 is separate from pass 2 on purpose.** A scenario's ``depends_on``
  points at a *specific option of another scenario* (by module → scenario_order →
  option_index). That target option may belong to a scenario in a later-created
  module, and even within one module the option rows do not exist until their
  scenario is created. So we must create *every* scenario and option first
  (pass 2) and only then resolve the ``depends_on`` foreign keys (pass 3) —
  otherwise we would be referencing options that have not been inserted yet.

* **Instrument parity aborts the transaction.** After seeding, the pretest and
  posttest are compared item-by-item. A divergence would confound the
  paired-samples t-test that answers Research Question 4, so on any mismatch the
  seeder raises and the surrounding ``transaction.atomic`` block rolls back —
  the database is never left holding a broken instrument.
"""
from __future__ import annotations

import json
from decimal import Decimal
from pathlib import Path
from typing import Any, Callable

from django.conf import settings

from assessments.models import Assessment, Question
from assessments.services import verify_instrument_parity
from content.models import ContentPage, Module, Scenario, ScenarioOption

# Default location of the authored content.
SEED_DIR = Path(settings.BASE_DIR) / "seed_data"

REQUIRED_FILES = {
    "eailt": "eailt_instrument.json",
    "modules_1_3": "modules_1_3.json",
    "modules_4_6": "modules_4_6.json",
    "usability": "usability_questionnaire.json",
}


class SeedError(Exception):
    """Raised for any validation or integrity problem during seeding."""


# ---------------------------------------------------------------------------
# File loading
# ---------------------------------------------------------------------------
def load_seed_files(seed_dir: Path = SEED_DIR) -> dict[str, Any]:
    """Read and JSON-parse the four required files, failing clearly if missing."""
    data: dict[str, Any] = {}
    for key, filename in REQUIRED_FILES.items():
        path = seed_dir / filename
        if not path.exists():
            raise SeedError(
                f"Required seed file not found: {path}. "
                f"Place all four files in {seed_dir}/ before seeding."
            )
        try:
            data[key] = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise SeedError(f"{filename} is not valid JSON: {exc}") from exc
    return data


# ---------------------------------------------------------------------------
# The seeder
# ---------------------------------------------------------------------------
class ContentSeeder:
    """
    Orchestrates the five seeding passes. Call ``run()`` inside a
    ``transaction.atomic`` block; on any failure it raises SeedError and the
    caller's transaction rolls back.
    """

    def __init__(
        self,
        data: dict[str, Any],
        *,
        log: Callable[[str], None] = lambda _msg: None,
    ) -> None:
        self.data = data
        self.log = log
        # Track created rows for the final report.
        self.counts: dict[str, int] = {
            "modules": 0,
            "pages": 0,
            "scenarios": 0,
            "options": 0,
            "quiz_questions": 0,
            "eailt_questions": 0,
            "usability_questions": 0,
        }

    # -- Pass 1 -------------------------------------------------------------
    def _pass1_modules(self) -> list[dict]:
        """Create/update modules, pages, quizzes. Returns the raw module dicts."""
        module_dicts = (
            self.data["modules_1_3"]["modules"]
            + self.data["modules_4_6"]["modules"]
        )
        for m in module_dicts:
            module, _ = Module.objects.update_or_create(
                sequence_no=m["sequence_no"],
                defaults={
                    "title": m["title"],
                    "summary": m.get("summary", ""),
                    "is_published": True,
                    "reflection_prompt": m.get("reflection_prompt", ""),
                },
            )
            self.counts["modules"] += 1

            for page in m["pages"]:
                ContentPage.objects.update_or_create(
                    module=module,
                    page_order=page["page_order"],
                    defaults={"title": page["title"], "body": page["body"]},
                )
                self.counts["pages"] += 1

            quiz, _ = Assessment.objects.update_or_create(
                assessment_type="quiz",
                module=module,
                defaults={"title": f"{module.title} — Quiz"},
            )
            for q in m["quiz"]:
                Question.objects.update_or_create(
                    assessment=quiz,
                    question_order=q["question_order"],
                    defaults={
                        "question_text": q["question_text"],
                        "question_type": "mcq",
                        "options": q["options"],
                        "correct_answer": q["correct_answer"],
                        "dimension": q["dimension"],
                        "max_score": Decimal("1"),
                        "feedback_correct": q.get("feedback_correct"),
                        "feedback_incorrect": q.get("feedback_incorrect"),
                        "reverse_scored": False,
                    },
                )
                self.counts["quiz_questions"] += 1
        return module_dicts

    # -- Pass 2 -------------------------------------------------------------
    def _pass2_scenarios(self, module_dicts: list[dict]) -> None:
        """Create scenarios and their options (order preserved). No branching yet."""
        for m in module_dicts:
            module = Module.objects.get(sequence_no=m["sequence_no"])
            for s in m["scenarios"]:
                scenario, _ = Scenario.objects.update_or_create(
                    module=module,
                    scenario_order=s["scenario_order"],
                    defaults={
                        "situation_text": s["situation_text"],
                        # depends_on_choice resolved in pass 3.
                        "depends_on_choice": None,
                    },
                )
                self.counts["scenarios"] += 1

                # Rebuild options deterministically so option_index is stable and
                # re-seeding does not accumulate stale rows.
                scenario.options.all().delete()
                for opt in s["options"]:
                    ScenarioOption.objects.create(
                        scenario=scenario,
                        option_text=opt["option_text"],
                        consequence_text=opt["consequence_text"],
                        ethical_principle=opt["ethical_principle"],
                        dimension=opt["dimension"],
                        weight=opt["weight"],
                    )
                    self.counts["options"] += 1

    # -- Pass 3 -------------------------------------------------------------
    def _pass3_branching(self, module_dicts: list[dict]) -> list[tuple]:
        """
        Resolve ``depends_on`` references into ``depends_on_choice`` FKs.

        Validates existence, the no-forward-dependency rule, and acyclicity
        before persisting anything. Returns the edge list (for cycle reporting).
        """
        edges: list[tuple[int, int]] = []  # (dependent_scenario_id, source_scenario_id)

        for m in module_dicts:
            depending_module_seq = m["sequence_no"]
            module = Module.objects.get(sequence_no=depending_module_seq)
            for s in m["scenarios"]:
                dep = s.get("depends_on")
                if dep is None:
                    continue

                scenario = Scenario.objects.get(
                    module=module, scenario_order=s["scenario_order"]
                )
                target_option = self._resolve_dependency(scenario, dep)

                # No branch may depend on a *future* module.
                if dep["module"] > depending_module_seq:
                    raise SeedError(
                        f"Forward dependency rejected: module {depending_module_seq} "
                        f"scenario {s['scenario_order']} depends on module "
                        f"{dep['module']} (a later module)."
                    )

                scenario.depends_on_choice = target_option
                scenario.save(update_fields=["depends_on_choice"])
                edges.append((scenario.id, target_option.scenario_id))

        self._assert_acyclic(edges)
        return edges

    def _resolve_dependency(self, scenario: Scenario, dep: dict) -> ScenarioOption:
        """Find the ScenarioOption referenced by a ``depends_on`` dict, or fail."""
        try:
            src_module = Module.objects.get(sequence_no=dep["module"])
        except Module.DoesNotExist:
            raise SeedError(
                f"depends_on for module {scenario.module.sequence_no} scenario "
                f"{scenario.scenario_order} references missing module {dep['module']}."
            )
        try:
            src_scenario = Scenario.objects.get(
                module=src_module, scenario_order=dep["scenario_order"]
            )
        except Scenario.DoesNotExist:
            raise SeedError(
                f"depends_on for module {scenario.module.sequence_no} scenario "
                f"{scenario.scenario_order} references missing scenario "
                f"M{dep['module']}.S{dep['scenario_order']}."
            )
        options = list(src_scenario.options.order_by("id"))
        idx = dep["option_index"]
        if idx < 0 or idx >= len(options):
            raise SeedError(
                f"depends_on for module {scenario.module.sequence_no} scenario "
                f"{scenario.scenario_order} references option_index {idx}, but "
                f"M{dep['module']}.S{dep['scenario_order']} has {len(options)} options."
            )
        return options[idx]

    @staticmethod
    def _assert_acyclic(edges: list[tuple[int, int]]) -> None:
        """
        DFS cycle check over the scenario-dependency graph.

        Edge (a, b) means 'scenario a depends on an option of scenario b', i.e.
        b must be reachable before a. A cycle would make a scenario transitively
        depend on itself and could never unlock, so we reject it.
        """
        from collections import defaultdict

        graph: dict[int, list[int]] = defaultdict(list)
        nodes: set[int] = set()
        for a, b in edges:
            graph[a].append(b)
            nodes.add(a)
            nodes.add(b)

        WHITE, GREY, BLACK = 0, 1, 2
        colour = {n: WHITE for n in nodes}

        def visit(node: int, path: list[int]) -> None:
            colour[node] = GREY
            for nxt in graph[node]:
                if colour[nxt] == GREY:
                    cycle = " -> ".join(str(x) for x in (path + [node, nxt]))
                    raise SeedError(f"Cyclic scenario dependency detected: {cycle}")
                if colour[nxt] == WHITE:
                    visit(nxt, path + [node])
            colour[node] = BLACK

        for n in nodes:
            if colour[n] == WHITE:
                visit(n, [])

    # -- Pass 4 -------------------------------------------------------------
    def _pass4_eailt(self) -> None:
        """
        Create the pretest and posttest from the SAME items[] array.

        Iterating one source array for both assessments is what makes drift
        structurally impossible: there is a single source of truth for the item
        set, administered twice.
        """
        items = self.data["eailt"]["items"]
        specs = [
            ("pretest", "Ethical AI Literacy Test (Pre-test)"),
            ("posttest", "Ethical AI Literacy Test (Post-test)"),
        ]
        for assessment_type, title in specs:
            assessment, _ = Assessment.objects.update_or_create(
                assessment_type=assessment_type,
                module=None,
                defaults={"title": title},
            )
            for item in items:  # same array both times -> cannot diverge
                is_likert = item["question_type"] == "likert"
                Question.objects.update_or_create(
                    assessment=assessment,
                    question_order=item["question_order"],
                    defaults={
                        "question_text": item["question_text"],
                        "question_type": item["question_type"],
                        "options": item["options"],
                        "correct_answer": item.get("correct_answer"),
                        "dimension": item["dimension"],
                        "max_score": Decimal("5") if is_likert else Decimal("1"),
                        # EAILT never returns feedback.
                        "feedback_correct": None,
                        "feedback_incorrect": None,
                        "reverse_scored": False,
                    },
                )
                self.counts["eailt_questions"] += 1

    # -- Pass 5 -------------------------------------------------------------
    def _pass5_usability(self) -> None:
        """Create the 20-item usability questionnaire (all Likert)."""
        payload = self.data["usability"]
        anchors = payload["scale"]["anchors"]
        assessment, _ = Assessment.objects.update_or_create(
            assessment_type="usability",
            module=None,
            defaults={"title": "System Usability Questionnaire"},
        )
        for item in payload["items"]:
            Question.objects.update_or_create(
                assessment=assessment,
                question_order=item["question_order"],
                defaults={
                    "question_text": item["question_text"],
                    "question_type": "likert",
                    "options": anchors,
                    "correct_answer": None,
                    "dimension": item["dimension"],
                    "max_score": Decimal("5"),
                    "feedback_correct": None,
                    "feedback_incorrect": None,
                    "reverse_scored": bool(item.get("reverse_scored", False)),
                },
            )
            self.counts["usability_questions"] += 1

    # -- Orchestration ------------------------------------------------------
    def run(self) -> dict[str, int]:
        """Run all five passes, then verify instrument parity (which may abort)."""
        self.log("Pass 1: modules, pages, quizzes …")
        module_dicts = self._pass1_modules()
        self.log("Pass 2: scenarios and options …")
        self._pass2_scenarios(module_dicts)
        self.log("Pass 3: wiring branching dependencies …")
        self._pass3_branching(module_dicts)
        self.log("Pass 4: pre-test and post-test (EAILT) …")
        self._pass4_eailt()
        self.log("Pass 5: usability questionnaire …")
        self._pass5_usability()

        self.log("Verifying instrument parity …")
        problems = verify_instrument_parity()
        if problems:
            raise SeedError(
                "Instrument parity FAILED after seeding — aborting (transaction "
                "will roll back):\n  - " + "\n  - ".join(problems)
            )
        return self.counts


def flush_content() -> None:
    """
    Delete all seeded content. Ordered to respect FKs: options before scenarios,
    questions before assessments, etc. Participant data (users, attempts,
    progress) is deliberately NOT touched — only authored content.
    """
    ScenarioOption.objects.all().delete()
    Scenario.objects.all().delete()
    ContentPage.objects.all().delete()
    Question.objects.all().delete()
    Assessment.objects.all().delete()
    Module.objects.all().delete()
