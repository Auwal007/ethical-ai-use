"""Researcher/admin API + security tests: role gating and anonymised export."""
from __future__ import annotations

import pytest

from conftest import auth_client, complete_module_fully, submit_pretest

pytestmark = pytest.mark.django_db


ADMIN_ENDPOINTS = [
    "/api/admin/participants/",
    "/api/admin/stats/",
    "/api/admin/export/?dataset=scores",
]


@pytest.mark.parametrize("url", ADMIN_ENDPOINTS)
def test_student_cannot_access_admin_endpoints(client_student, url):
    """A student cannot call any /api/admin/ endpoint (403)."""
    assert client_student.get(url).status_code == 403


@pytest.mark.parametrize("url", ADMIN_ENDPOINTS)
def test_admin_can_access_admin_endpoints(client_admin, url, modules):
    assert client_admin.get(url).status_code == 200


def test_unauthenticated_gets_401(client_student):
    from rest_framework.test import APIClient

    anon = APIClient()
    assert anon.get("/api/admin/stats/").status_code == 401
    assert anon.get("/api/modules/").status_code == 401


def _read_stream(resp) -> str:
    return b"".join(resp.streaming_content).decode()


def test_scores_export_has_no_names_or_emails(
    client_admin, student, modules, pretest, posttest
):
    """CSV export contains no names or emails — only pseudonymous ids."""
    submit_pretest(student, pretest)
    for m in modules:
        complete_module_fully(student, m)

    resp = client_admin.get("/api/admin/export/?dataset=scores")
    assert resp.status_code == 200
    content = _read_stream(resp)
    assert student.full_name not in content
    assert student.email not in content
    # The pseudonymous id is present.
    assert "P001" in content


def test_reflections_export_anonymous(client_admin, student, modules, pretest):
    submit_pretest(student, pretest)
    complete_module_fully(student, modules[0])
    resp = client_admin.get("/api/admin/export/?dataset=reflections")
    content = _read_stream(resp)
    assert student.email not in content
    assert student.full_name not in content
    assert "P001" in content


def test_responses_export_anonymous(client_admin, student, pretest):
    submit_pretest(student, pretest)
    resp = client_admin.get("/api/admin/export/?dataset=responses")
    content = _read_stream(resp)
    assert student.email not in content
    assert "participant_id" in content


def test_export_rejects_unknown_dataset(client_admin):
    assert client_admin.get("/api/admin/export/?dataset=bogus").status_code == 400


def test_participants_lists_students(client_admin, student, modules, pretest):
    submit_pretest(student, pretest)
    data = client_admin.get("/api/admin/participants/").json()
    assert len(data) == 1
    assert data[0]["pretest_completed"] is True
    assert data[0]["has_consent"] is True
