"""Assessment URLs, mounted under /api/assessments/."""
from __future__ import annotations

from django.urls import path

from .views import (
    PosttestView,
    PretestView,
    QuizView,
    SubmitView,
    UsabilityView,
)

urlpatterns = [
    path("pretest/", PretestView.as_view(), name="assessment-pretest"),
    path("posttest/", PosttestView.as_view(), name="assessment-posttest"),
    path("quiz/<int:module_id>/", QuizView.as_view(), name="assessment-quiz"),
    path("usability/", UsabilityView.as_view(), name="assessment-usability"),
    path(
        "<int:assessment_id>/submit/",
        SubmitView.as_view(),
        name="assessment-submit",
    ),
]
