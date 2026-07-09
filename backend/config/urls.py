"""
Root URL configuration.

The full REST API is mounted under /api/. The Django admin remains the
researcher's content-management tool at /admin/.
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    # Authentication
    path("api/auth/", include("accounts.urls")),
    # Researcher / admin API (IsAdminRole)
    path("api/admin/", include("accounts.admin_urls")),
    # Learning content (modules, scenarios, reflections POST)
    path("api/", include("content.urls")),
    # Profile + reflections list
    path("api/", include("progress.urls")),
    # Assessments
    path("api/assessments/", include("assessments.urls")),
]
