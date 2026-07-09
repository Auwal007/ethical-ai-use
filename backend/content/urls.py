"""
Content URLs (mounted at /api/). Module-scoped reflection POST lives here so all
/api/modules/<id>/... routes are co-located, delegating to the progress view.
"""
from __future__ import annotations

from django.urls import path

from progress.views import ReflectionCreateView

from .views import (
    ModuleCompleteView,
    ModuleDetailView,
    ModuleListView,
    ScenarioChooseView,
)

urlpatterns = [
    path("modules/", ModuleListView.as_view(), name="module-list"),
    path("modules/<int:module_id>/", ModuleDetailView.as_view(), name="module-detail"),
    path(
        "modules/<int:module_id>/complete/",
        ModuleCompleteView.as_view(),
        name="module-complete",
    ),
    path(
        "modules/<int:module_id>/reflection/",
        ReflectionCreateView.as_view(),
        name="module-reflection",
    ),
    path(
        "scenarios/<int:scenario_id>/choose/",
        ScenarioChooseView.as_view(),
        name="scenario-choose",
    ),
]
