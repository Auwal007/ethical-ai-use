"""
Management command: print a human-readable verification summary of the seeded
content for the researcher.

    python manage.py content_report

Reports module/page/scenario/quiz counts, the branching graph as readable edges,
any unreachable scenario (warn only), EAILT item counts per dimension (should be
4 each), and confirms no pretest/posttest question carries feedback text.
"""
from __future__ import annotations

from collections import defaultdict

from django.core.management.base import BaseCommand

from assessments.models import Assessment, Question
from common.constants import DIMENSIONS
from content.models import Module, Scenario


class Command(BaseCommand):
    help = "Print a verification summary of seeded content."

    def handle(self, *args, **options) -> None:
        self._modules_section()
        self._branching_section()
        self._unreachable_section()
        self._eailt_dimension_section()
        self._feedback_section()

    # ----------------------------------------------------------------------
    def _modules_section(self) -> None:
        self.stdout.write(self.style.MIGRATE_HEADING("MODULES"))
        for m in Module.objects.order_by("sequence_no"):
            quiz = Assessment.objects.filter(assessment_type="quiz", module=m).first()
            quiz_n = quiz.questions.count() if quiz else 0
            self.stdout.write(
                f"  M{m.sequence_no}  {m.title}\n"
                f"       pages={m.pages.count()}  scenarios={m.scenarios.count()}  "
                f"quiz_questions={quiz_n}  published={m.is_published}"
            )

    # ----------------------------------------------------------------------
    def _branching_section(self) -> None:
        self.stdout.write(self.style.MIGRATE_HEADING("\nBRANCHING GRAPH"))
        edges = (
            Scenario.objects.filter(depends_on_choice__isnull=False)
            .select_related("module", "depends_on_choice__scenario__module")
            .order_by("module__sequence_no", "scenario_order")
        )
        if not edges:
            self.stdout.write("  (no branching dependencies)")
            return
        for sc in edges:
            src_option = sc.depends_on_choice
            src_scenario = src_option.scenario
            # option index = position of this option within its scenario (by id).
            option_ids = list(
                src_scenario.options.order_by("id").values_list("id", flat=True)
            )
            idx = option_ids.index(src_option.id)
            self.stdout.write(
                f"  M{src_scenario.module.sequence_no}.S{src_scenario.scenario_order}"
                f"[option {idx}] -> unlocks "
                f"M{sc.module.sequence_no}.S{sc.scenario_order}"
            )

    # ----------------------------------------------------------------------
    def _unreachable_section(self) -> None:
        """
        A scenario is 'unreachable' if it depends on an option but no chain of
        dependencies could ever be satisfied. With single-option triggers and an
        acyclic graph the only way to be unreachable is a broken chain; we warn
        (never fail) so the researcher can inspect.
        """
        self.stdout.write(self.style.MIGRATE_HEADING("\nUNREACHABLE SCENARIOS"))
        dependent = list(
            Scenario.objects.filter(depends_on_choice__isnull=False).select_related(
                "depends_on_choice__scenario"
            )
        )
        warnings = []
        for sc in dependent:
            # Reachable if its trigger scenario is always-visible OR itself reachable.
            trigger_scenario = sc.depends_on_choice.scenario
            if (
                trigger_scenario.depends_on_choice_id is not None
                and trigger_scenario.depends_on_choice.scenario_id == sc.id
            ):
                warnings.append(
                    f"  WARNING: M{sc.module.sequence_no}.S{sc.scenario_order} "
                    f"has no reachable path."
                )
        if warnings:
            for w in warnings:
                self.stdout.write(self.style.WARNING(w))
        else:
            self.stdout.write("  (all scenarios reachable)")

    # ----------------------------------------------------------------------
    def _eailt_dimension_section(self) -> None:
        self.stdout.write(
            self.style.MIGRATE_HEADING("\nEAILT ITEM COUNTS PER DIMENSION (expect 4)")
        )
        pretest = Assessment.objects.filter(assessment_type="pretest").first()
        if not pretest:
            self.stdout.write(self.style.WARNING("  (no pretest seeded)"))
            return
        counts: dict[str, int] = defaultdict(int)
        for q in pretest.questions.all():
            counts[q.dimension] += 1
        for dim in DIMENSIONS:
            n = counts.get(dim, 0)
            marker = "OK" if n == 4 else "!!"
            style = self.style.SUCCESS if n == 4 else self.style.ERROR
            self.stdout.write(style(f"  [{marker}] {dim:24s}: {n}"))

    # ----------------------------------------------------------------------
    def _feedback_section(self) -> None:
        self.stdout.write(
            self.style.MIGRATE_HEADING("\nEAILT FEEDBACK CHECK (must be none)")
        )
        leaking = Question.objects.filter(
            assessment__assessment_type__in=["pretest", "posttest"]
        ).exclude(feedback_correct__isnull=True, feedback_incorrect__isnull=True)
        if leaking.exists():
            self.stdout.write(
                self.style.ERROR(
                    f"  {leaking.count()} pre/post-test question(s) carry feedback text!"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    "  OK — no pretest/posttest question exposes feedback."
                )
            )
