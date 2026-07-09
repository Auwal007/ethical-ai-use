"""Gating tests — the research-critical access rules."""
from __future__ import annotations

import pytest

from assessments.models import Attempt
from conftest import complete_module_fully, submit_pretest

pytestmark = pytest.mark.django_db


def test_cannot_fetch_module_before_pretest(client_student, student, modules):
    """A student cannot fetch a module before the pre-test (403)."""
    resp = client_student.get(f"/api/modules/{modules[0].id}/")
    assert resp.status_code == 403


def test_cannot_complete_module_before_pretest(client_student, student, modules):
    resp = client_student.post(f"/api/modules/{modules[0].id}/complete/")
    assert resp.status_code == 403


def test_module_list_marks_all_locked_before_pretest(client_student, student, modules):
    resp = client_student.get("/api/modules/")
    assert resp.status_code == 200
    assert all(m["is_accessible"] is False for m in resp.json())
    assert all(m["status"] == "locked" for m in resp.json())


def test_module1_accessible_after_pretest(client_student, student, modules, pretest):
    submit_pretest(student, pretest)
    resp = client_student.get(f"/api/modules/{modules[0].id}/")
    assert resp.status_code == 200
    # But module 2 is still locked.
    resp2 = client_student.get(f"/api/modules/{modules[1].id}/")
    assert resp2.status_code == 403


def test_cannot_fetch_module3_before_module2(
    client_student, student, modules, pretest
):
    """A student cannot fetch module 3 before completing module 2 (403)."""
    submit_pretest(student, pretest)
    complete_module_fully(student, modules[0])  # module 1 done
    # module 2 now accessible, module 3 not.
    assert client_student.get(f"/api/modules/{modules[1].id}/").status_code == 200
    assert client_student.get(f"/api/modules/{modules[2].id}/").status_code == 403

    complete_module_fully(student, modules[1])  # module 2 done
    assert client_student.get(f"/api/modules/{modules[2].id}/").status_code == 200


def test_posttest_locked_until_all_modules_complete(
    client_student, student, modules, pretest, posttest
):
    """The post-test is inaccessible until all six modules are complete (403)."""
    submit_pretest(student, pretest)
    for m in modules[:5]:
        complete_module_fully(student, m)
    # Five of six done -> still forbidden.
    assert client_student.get("/api/assessments/posttest/").status_code == 403
    complete_module_fully(student, modules[5])
    assert client_student.get("/api/assessments/posttest/").status_code == 200


def test_usability_locked_until_posttest(
    client_student, student, modules, pretest, posttest, usability
):
    submit_pretest(student, pretest)
    for m in modules:
        complete_module_fully(student, m)
    # Post-test available but not yet submitted -> usability forbidden.
    assert client_student.get("/api/assessments/usability/").status_code == 403
    client_student.post(
        f"/api/assessments/{posttest.id}/submit/",
        {"responses": [
            {"question_id": q.id, "answer": q.correct_answer}
            for q in posttest.questions.all()
        ]},
        format="json",
    )
    assert client_student.get("/api/assessments/usability/").status_code == 200


def test_cannot_submit_module_quiz_before_pretest(
    client_student, student, modules
):
    """Direct POST to a quiz submit must also be gated, not just the fetch."""
    from assessments.models import Assessment

    quiz = Assessment.objects.get(assessment_type="quiz", module=modules[0])
    resp = client_student.post(
        f"/api/assessments/{quiz.id}/submit/",
        {"responses": []},
        format="json",
    )
    assert resp.status_code == 403
