"""Auth (register/login/me), consent precondition, role safety, streak, profile."""
from __future__ import annotations

import datetime

import pytest
from rest_framework.test import APIClient

from accounts.models import ConsentRecord, User
from conftest import complete_module_fully, submit_pretest

pytestmark = pytest.mark.django_db


def _register(payload) -> "APIClient":
    return APIClient().post("/api/auth/register/", payload, format="json")


BASE = {
    "full_name": "New Student",
    "email": "new@atbu.edu.ng",
    "password": "pass1234",
    "consent_version": "1.0",
}


def test_register_requires_consent():
    resp = _register({**BASE, "consent_agreed": False})
    assert resp.status_code == 400
    assert not User.objects.filter(email="new@atbu.edu.ng").exists()


def test_register_success_creates_user_and_consent_and_tokens():
    resp = _register({**BASE, "consent_agreed": True})
    assert resp.status_code == 201
    body = resp.json()
    assert "access" in body and "refresh" in body
    user = User.objects.get(email="new@atbu.edu.ng")
    assert ConsentRecord.objects.filter(user=user).exists()
    assert user.role == "student"


def test_client_cannot_self_assign_admin_role():
    """Role is server-side only; a client-supplied role is ignored."""
    resp = _register({**BASE, "consent_agreed": True, "role": "admin"})
    assert resp.status_code == 201
    assert User.objects.get(email="new@atbu.edu.ng").role == "student"


def test_login_returns_tokens(student):
    resp = APIClient().post(
        "/api/auth/login/",
        {"email": "student@atbu.edu.ng", "password": "pass1234"},
        format="json",
    )
    assert resp.status_code == 200
    assert "access" in resp.json()


def test_me_reports_computed_fields(client_student, student, modules, pretest):
    submit_pretest(student, pretest)
    resp = client_student.get("/api/auth/me/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["pretest_completed"] is True
    assert body["modules_completed"] == 0
    assert body["posttest_available"] is False


def test_streak_increments_across_days_but_not_same_day(student):
    from progress.services import touch_activity

    day1 = datetime.date(2026, 1, 1)
    touch_activity(student, today=day1)
    assert student.current_streak == 1
    # Same day again -> no increment.
    touch_activity(student, today=day1)
    assert student.current_streak == 1
    # Next day -> +1.
    touch_activity(student, today=day1 + datetime.timedelta(days=1))
    assert student.current_streak == 2
    # Gap -> reset to 1.
    touch_activity(student, today=day1 + datetime.timedelta(days=5))
    assert student.current_streak == 1


def test_profile_growth_409_before_posttest(client_student, student, pretest):
    submit_pretest(student, pretest)
    assert client_student.get("/api/profile/growth/").status_code == 409


def test_profile_shape(client_student, student, pretest):
    submit_pretest(student, pretest)
    body = client_student.get("/api/profile/").json()
    assert body["has_pretest"] is True
    assert body["has_posttest"] is False
    assert len(body["dimensions"]) == 6
    assert body["dimensions"][0]["posttest"] is None


def test_students_only_see_their_own_reflections(
    client_student, student, other_student, modules, pretest
):
    submit_pretest(student, pretest)
    complete_module_fully(student, modules[0])
    # other_student authenticates and should see zero reflections.
    from conftest import auth_client

    resp = auth_client(other_student).get("/api/reflections/")
    assert resp.status_code == 200
    assert resp.json() == []


def test_reflection_min_length_enforced(client_student, student, modules, pretest):
    submit_pretest(student, pretest)
    resp = client_student.post(
        f"/api/modules/{modules[0].id}/reflection/",
        {"response_text": "too short"},
        format="json",
    )
    assert resp.status_code == 400
