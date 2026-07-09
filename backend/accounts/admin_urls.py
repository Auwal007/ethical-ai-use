"""Researcher/admin URLs, mounted under /api/admin/."""
from __future__ import annotations

from django.urls import path

from .admin_views import ExportView, ParticipantsView, StatsView

urlpatterns = [
    path("participants/", ParticipantsView.as_view(), name="admin-participants"),
    path("stats/", StatsView.as_view(), name="admin-stats"),
    path("export/", ExportView.as_view(), name="admin-export"),
]
