"""Instrument-parity tests."""
from __future__ import annotations

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from assessments.services import verify_instrument_parity

pytestmark = pytest.mark.django_db


def test_parity_holds_for_matched_instruments(pretest, posttest):
    assert verify_instrument_parity() == []
    # Command should succeed (no exception).
    call_command("verify_instrument_parity")


def test_parity_fails_when_question_edited(pretest, posttest):
    """Editing a question on only one instrument must fail the check."""
    q = posttest.questions.order_by("question_order").first()
    q.question_text = "A completely different question"
    q.save()

    problems = verify_instrument_parity()
    assert problems  # non-empty
    assert any("Text mismatch" in p for p in problems)

    with pytest.raises(CommandError):
        call_command("verify_instrument_parity")


def test_parity_fails_on_dimension_change(pretest, posttest):
    q = posttest.questions.order_by("question_order").first()
    q.dimension = "ai_social_good"
    q.save()
    assert any("Dimension mismatch" in p for p in verify_instrument_parity())


def test_parity_fails_on_count_mismatch(pretest, posttest):
    posttest.questions.order_by("question_order").first().delete()
    assert any("count differs" in p for p in verify_instrument_parity())
