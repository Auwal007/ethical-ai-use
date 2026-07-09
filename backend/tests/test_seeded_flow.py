"""
End-to-end tests over the REAL seeded content: a participant walks the full
gated flow, and we assert reverse-scored usability persistence and that the
EAILT never leaks feedback through the API.
"""
from __future__ import annotations

from decimal import Decimal

import pytest
from django.db import transaction

from assessments.models import Assessment, Attempt, Question, Response
from content.models import Module
from content.seeding import ContentSeeder, load_seed_files, SEED_DIR
from content.services import choose_scenario_option, visible_scenarios
from progress.services import create_reflection

pytestmark = pytest.mark.django_db


@pytest.fixture
def seeded(db):
    with transaction.atomic():
        ContentSeeder(load_seed_files(SEED_DIR)).run()


@pytest.fixture
def student(db):
    from accounts.models import ConsentRecord, User

    u = User.objects.create_user(
        email="flow@atbu.edu.ng", password="pass1234", full_name="Flow Student"
    )
    ConsentRecord.objects.create(user=u, consent_version="1.0")
    return u


def _client(user):
    from rest_framework.test import APIClient
    from rest_framework_simplejwt.tokens import RefreshToken

    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}")
    return c


def _submit(client, assessment, answer_fn):
    return client.post(
        f"/api/assessments/{assessment.id}/submit/",
        {"responses": [
            {"question_id": q.id, "answer": answer_fn(q)}
            for q in assessment.questions.order_by("question_order")
        ]},
        format="json",
    )


def _walk_to_posttest(user, client):
    """Pre-test, then complete all six modules so the post-test unlocks."""
    pretest = Assessment.objects.get(assessment_type="pretest")
    _submit(client, pretest, lambda q: q.correct_answer or "3")

    for module in Module.objects.order_by("sequence_no"):
        quiz = Assessment.objects.get(assessment_type="quiz", module=module)
        _submit(client, quiz, lambda q: q.correct_answer or "3")
        # Answer every visible scenario (choosing first option), re-checking
        # visibility after each choice since choices can unlock siblings.
        answered = set()
        while True:
            visible = [s for s in visible_scenarios(user, module) if s.id not in answered]
            if not visible:
                break
            for scenario in visible:
                choose_scenario_option(
                    user, scenario=scenario, option_id=scenario.options.first().id
                )
                answered.add(scenario.id)
        create_reflection(
            user, module=module,
            response_text="A reflection long enough to satisfy the fifty character minimum rule.",
        )
        resp = client.post(f"/api/modules/{module.id}/complete/")
        assert resp.status_code == 200, resp.content


def test_eailt_pretest_api_never_exposes_feedback(seeded, student):
    client = _client(student)
    resp = client.get("/api/assessments/pretest/")
    assert resp.status_code == 200
    body = resp.json()
    assert "feedback_correct" not in str(body)
    assert "feedback_incorrect" not in str(body)
    assert "correct_answer" not in str(body)


def test_reverse_scored_item_persists_raw_answer_and_inverted_score(seeded, student):
    """Usability item 7 answered '2' → Response.answer='2', item_score=4."""
    client = _client(student)
    _walk_to_posttest(student, client)

    posttest = Assessment.objects.get(assessment_type="posttest")
    _submit(client, posttest, lambda q: q.correct_answer or "3")

    usability = Assessment.objects.get(assessment_type="usability")
    resp = _submit(client, usability, lambda q: "2")
    assert resp.status_code == 200

    item7 = Question.objects.get(assessment=usability, question_order=7)
    r7 = Response.objects.get(attempt__user=student, question=item7)
    assert r7.answer == "2"          # raw selection preserved
    assert r7.item_score == Decimal("4")  # 6 - 2, reverse scored

    # A non-reverse item stores the raw value as its score.
    item1 = Question.objects.get(assessment=usability, question_order=1)
    r1 = Response.objects.get(attempt__user=student, question=item1)
    assert r1.item_score == Decimal("2")


def test_quiz_feedback_served_from_db(seeded, student):
    """Quiz submit returns the DB-authored explanation text."""
    client = _client(student)
    pretest = Assessment.objects.get(assessment_type="pretest")
    _submit(client, pretest, lambda q: q.correct_answer or "3")

    module1 = Module.objects.get(sequence_no=1)
    quiz = Assessment.objects.get(assessment_type="quiz", module=module1)
    resp = client.post(
        f"/api/assessments/{quiz.id}/submit/",
        {"responses": [
            {"question_id": q.id, "answer": q.correct_answer}
            for q in quiz.questions.all()
        ]},
        format="json",
    )
    assert resp.status_code == 200
    feedback = resp.json()["feedback"]
    assert all(f["explanation"] for f in feedback)  # every item has DB text


def test_reflection_endpoint_serves_module_prompt(seeded, student):
    client = _client(student)
    pretest = Assessment.objects.get(assessment_type="pretest")
    _submit(client, pretest, lambda q: q.correct_answer or "3")

    module1 = Module.objects.get(sequence_no=1)
    resp = client.get(f"/api/modules/{module1.id}/reflection/")
    assert resp.status_code == 200
    assert resp.json()["prompt_text"] == module1.reflection_prompt
    assert module1.reflection_prompt  # non-empty from JSON
