"""Assessment engine tests: one-attempt enforcement, scoring, no key leakage."""
from __future__ import annotations

from decimal import Decimal

import pytest

from assessments.models import Attempt, Question
from assessments.services import score_item, submit_assessment
from conftest import complete_module_fully, submit_pretest

pytestmark = pytest.mark.django_db


def _submit(client, assessment):
    return client.post(
        f"/api/assessments/{assessment.id}/submit/",
        {"responses": [
            {"question_id": q.id, "answer": q.correct_answer}
            for q in assessment.questions.all()
        ]},
        format="json",
    )


def test_pretest_submitted_twice_returns_409_and_one_attempt(
    client_student, student, pretest
):
    """Submitting the pre-test twice returns 409 and the DB holds one Attempt."""
    first = _submit(client_student, pretest)
    assert first.status_code == 200
    second = _submit(client_student, pretest)
    assert second.status_code == 409
    assert Attempt.objects.filter(user=student, assessment=pretest).count() == 1


def test_correct_answer_never_in_pretest_payload(client_student, student, pretest):
    """correct_answer must never appear in any student-facing payload."""
    resp = client_student.get("/api/assessments/pretest/")
    assert resp.status_code == 200
    body = resp.json()
    assert "correct_answer" not in str(body)
    for q in body["questions"]:
        assert "correct_answer" not in q


def test_correct_answer_not_in_quiz_payload(
    client_student, student, modules, pretest
):
    submit_pretest(student, pretest)
    resp = client_student.get(f"/api/assessments/quiz/{modules[0].id}/")
    assert resp.status_code == 200
    assert "correct_answer" not in str(resp.json())


def test_mcq_scoring():
    """MCQ: full marks for the right answer, zero otherwise."""
    q = Question(
        question_type="mcq", correct_answer="Training data", max_score=Decimal("2")
    )
    assert score_item(q, "Training data") == Decimal("2")
    assert score_item(q, "CPU") == Decimal("0")


def test_likert_scoring():
    """Likert: the item score is the Likert value itself."""
    q = Question(question_type="likert", correct_answer=None, max_score=Decimal("5"))
    assert score_item(q, "4") == Decimal("4")
    assert score_item(q, "1") == Decimal("1")
    assert score_item(q, "not-a-number") == Decimal("0")


def test_total_score_and_dimension_rollup(client_student, student, pretest):
    """total_score sums item scores; dimension rows are created for the pretest."""
    from progress.models import DimensionScore

    resp = _submit(client_student, pretest)
    assert resp.status_code == 200
    body = resp.json()
    # Two correct MCQs, 1 point each.
    assert Decimal(str(body["total_score"])) == Decimal("2")
    assert Decimal(str(body["max_possible"])) == Decimal("2")
    # Pretest dimension scores recorded.
    assert DimensionScore.objects.filter(user=student, source="pretest").exists()


def test_pretest_feedback_not_returned(client_student, student, pretest):
    """Pre/post-test submissions must not return per-question feedback."""
    body = _submit(client_student, pretest).json()
    assert "feedback" not in body


def test_quiz_feedback_returned(client_student, student, modules, pretest):
    """Quiz submissions DO return feedback."""
    submit_pretest(student, pretest)
    from assessments.models import Assessment

    quiz = Assessment.objects.get(assessment_type="quiz", module=modules[0])
    resp = client_student.post(
        f"/api/assessments/{quiz.id}/submit/",
        {"responses": [
            {"question_id": q.id, "answer": q.correct_answer}
            for q in quiz.questions.all()
        ]},
        format="json",
    )
    assert resp.status_code == 200
    assert "feedback" in resp.json()
