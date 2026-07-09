"""
Tests for the content seeding system: idempotency, dry-run, parity, branching
resolution, forward/cyclic rejection, reverse scoring, and feedback isolation.
"""
from __future__ import annotations

import copy
import json
from decimal import Decimal
from pathlib import Path

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from assessments.models import Assessment, Question
from assessments.services import score_item, verify_instrument_parity
from content.models import Module, Scenario, ScenarioOption
from content.seeding import (
    ContentSeeder,
    SeedError,
    SEED_DIR,
    load_seed_files,
    flush_content,
)

pytestmark = pytest.mark.django_db


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def real_seed_data() -> dict:
    """The actual authored content, parsed from seed_data/."""
    return load_seed_files(SEED_DIR)


@pytest.fixture
def seeded(db, real_seed_data) -> None:
    """Seed the real content into the test DB."""
    from django.db import transaction

    with transaction.atomic():
        ContentSeeder(real_seed_data).run()


def _counts() -> dict:
    return {
        "modules": Module.objects.count(),
        "pages": sum(m.pages.count() for m in Module.objects.all()),
        "scenarios": Scenario.objects.count(),
        "options": ScenarioOption.objects.count(),
        "assessments": Assessment.objects.count(),
        "questions": Question.objects.count(),
    }


# ---------------------------------------------------------------------------
# Real-content structural checks
# ---------------------------------------------------------------------------
def test_seed_produces_expected_counts(seeded):
    c = _counts()
    assert c["modules"] == 6
    # 24 EAILT items x2 (pre+post) + 20 usability + 24 quiz (6 modules x 4)
    assert Question.objects.filter(
        assessment__assessment_type="pretest"
    ).count() == 24
    assert Question.objects.filter(
        assessment__assessment_type="posttest"
    ).count() == 24
    assert Question.objects.filter(
        assessment__assessment_type="usability"
    ).count() == 20


def test_seeding_twice_without_flush_is_idempotent(seeded):
    """Running the seeder again without --flush must not change row counts."""
    before = _counts()
    from django.db import transaction

    with transaction.atomic():
        ContentSeeder(load_seed_files(SEED_DIR)).run()
    assert _counts() == before


def test_missing_file_fails_clearly(tmp_path):
    with pytest.raises(SeedError, match="Required seed file not found"):
        load_seed_files(tmp_path)


def test_dry_run_writes_nothing(db):
    """--dry-run validates but leaves the database empty."""
    call_command("seed_content", "--flush", "--dry-run")
    assert Module.objects.count() == 0
    assert Assessment.objects.count() == 0


# ---------------------------------------------------------------------------
# Parity
# ---------------------------------------------------------------------------
def test_pretest_posttest_identical(seeded):
    assert verify_instrument_parity() == []
    pre = list(
        Assessment.objects.get(assessment_type="pretest")
        .questions.order_by("question_order")
        .values_list("question_text", "dimension", "correct_answer")
    )
    post = list(
        Assessment.objects.get(assessment_type="posttest")
        .questions.order_by("question_order")
        .values_list("question_text", "dimension", "correct_answer")
    )
    assert pre == post


def test_editing_one_instrument_fails_parity(seeded):
    """Edit a posttest question and verify_instrument_parity fails (non-zero)."""
    q = (
        Assessment.objects.get(assessment_type="posttest")
        .questions.order_by("question_order")
        .first()
    )
    q.question_text = "Tampered question text"
    q.save()

    assert verify_instrument_parity()  # non-empty
    with pytest.raises(CommandError):
        call_command("verify_instrument_parity")


# ---------------------------------------------------------------------------
# Branching resolution
# ---------------------------------------------------------------------------
def test_branching_fk_resolves_to_correct_option(seeded):
    """
    M6.S2 depends on M2.S1 option index 0 → its depends_on_choice must BE that
    exact option (the JSON edge: {"module": 2, "scenario_order": 1, "index": 0}).
    """
    m2s1 = Scenario.objects.get(module__sequence_no=2, scenario_order=1)
    expected_option = m2s1.options.order_by("id")[0]

    m6s2 = Scenario.objects.get(module__sequence_no=6, scenario_order=2)
    assert m6s2.depends_on_choice_id == expected_option.id


def test_dependent_scenario_has_backward_dependency_only(seeded):
    """Every resolved dependency points at an equal-or-earlier module."""
    for sc in Scenario.objects.filter(depends_on_choice__isnull=False):
        src_module_seq = sc.depends_on_choice.scenario.module.sequence_no
        assert src_module_seq <= sc.module.sequence_no


# ---------------------------------------------------------------------------
# Forward + cyclic rejection (synthetic fixtures)
# ---------------------------------------------------------------------------
def _minimal_modules_payload(scenarios_by_module: dict[int, list]) -> dict:
    """Build a modules JSON payload with given scenarios per module sequence_no."""
    modules = []
    for seq in sorted(scenarios_by_module):
        modules.append(
            {
                "sequence_no": seq,
                "title": f"Module {seq}",
                "summary": "s",
                "reflection_prompt": "Reflect on this module in some detail please.",
                "pages": [{"page_order": 1, "title": "P", "body": "b"}],
                "scenarios": scenarios_by_module[seq],
                "quiz": [
                    {
                        "question_order": 1,
                        "question_type": "mcq",
                        "dimension": "ethical_awareness",
                        "question_text": "q",
                        "options": ["a", "b"],
                        "correct_answer": "a",
                        "feedback_correct": "c",
                        "feedback_incorrect": "i",
                    }
                ],
            }
        )
    return {"modules": modules}


def _scenario(order: int, depends_on=None) -> dict:
    return {
        "scenario_order": order,
        "depends_on": depends_on,
        "situation_text": "sit",
        "options": [
            {
                "option_text": f"opt{i}",
                "consequence_text": "c",
                "ethical_principle": "p",
                "dimension": "responsible_use",
                "weight": 50,
            }
            for i in range(3)
        ],
    }


def _data_with(module_payload_13: dict, module_payload_46: dict, real_seed_data) -> dict:
    """Assemble a full seed-data dict reusing real EAILT + usability."""
    return {
        "modules_1_3": module_payload_13,
        "modules_4_6": module_payload_46,
        "eailt": real_seed_data["eailt"],
        "usability": real_seed_data["usability"],
    }


def test_forward_dependency_rejected(db, real_seed_data):
    """A scenario in module 3 depending on module 5 must be rejected."""
    payload_13 = _minimal_modules_payload(
        {
            1: [_scenario(1)],
            2: [_scenario(1)],
            3: [_scenario(1, depends_on={"module": 5, "scenario_order": 1, "option_index": 0})],
        }
    )
    payload_46 = _minimal_modules_payload({4: [_scenario(1)], 5: [_scenario(1)], 6: [_scenario(1)]})
    data = _data_with(payload_13, payload_46, real_seed_data)

    from django.db import transaction

    with pytest.raises(SeedError, match="Forward dependency rejected"):
        with transaction.atomic():
            ContentSeeder(data).run()


def test_cyclic_dependency_rejected(db, real_seed_data):
    """A → B and B → A within the same module must be rejected as a cycle."""
    # Two scenarios in module 1 that depend on each other's option.
    payload_13 = _minimal_modules_payload(
        {
            1: [
                _scenario(1, depends_on={"module": 1, "scenario_order": 2, "option_index": 0}),
                _scenario(2, depends_on={"module": 1, "scenario_order": 1, "option_index": 0}),
            ],
            2: [_scenario(1)],
            3: [_scenario(1)],
        }
    )
    payload_46 = _minimal_modules_payload({4: [_scenario(1)], 5: [_scenario(1)], 6: [_scenario(1)]})
    data = _data_with(payload_13, payload_46, real_seed_data)

    from django.db import transaction

    with pytest.raises(SeedError, match="Cyclic scenario dependency"):
        with transaction.atomic():
            ContentSeeder(data).run()


# ---------------------------------------------------------------------------
# Reverse scoring + feedback isolation
# ---------------------------------------------------------------------------
def test_reverse_scored_usability_item(seeded):
    """
    Usability item 7 is reverse-scored: a raw selection of 2 must score 6-2=4,
    while the stored raw answer stays '2'.
    """
    item7 = Question.objects.get(
        assessment__assessment_type="usability", question_order=7
    )
    assert item7.reverse_scored is True
    assert score_item(item7, "2") == Decimal("4")

    # Non-reverse item scores the raw value.
    item1 = Question.objects.get(
        assessment__assessment_type="usability", question_order=1
    )
    assert item1.reverse_scored is False
    assert score_item(item1, "2") == Decimal("2")


def test_no_pretest_question_carries_feedback(seeded):
    leaking = Question.objects.filter(
        assessment__assessment_type__in=["pretest", "posttest"]
    ).exclude(feedback_correct__isnull=True, feedback_incorrect__isnull=True)
    assert not leaking.exists()


def test_quiz_questions_carry_feedback(seeded):
    """Quiz questions DO have feedback text loaded from the JSON."""
    q = Question.objects.filter(assessment__assessment_type="quiz").first()
    assert q.feedback_correct
    assert q.feedback_incorrect
