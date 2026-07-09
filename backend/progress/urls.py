"""Profile and reflection URLs (mounted at /api/)."""
from __future__ import annotations

from django.urls import path

from .views import (
    ProfileGrowthView,
    ProfileView,
    ReflectionListView,
)

urlpatterns = [
    path("profile/", ProfileView.as_view(), name="profile"),
    path("profile/growth/", ProfileGrowthView.as_view(), name="profile-growth"),
    path("reflections/", ReflectionListView.as_view(), name="reflection-list"),
]
