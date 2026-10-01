"""Admin registration for account models."""
from __future__ import annotations

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.models import Group

from assessments.admin import AttemptInline

from .models import ConsentRecord, User

# The researcher does not use Django's permission Groups — hide them.
try:
    admin.site.unregister(Group)
except admin.sites.NotRegistered:
    pass


class ConsentInline(admin.StackedInline):
    """The participant's consent record, shown inline on their profile."""

    model = ConsentRecord
    extra = 0
    can_delete = False
    readonly_fields = ("consent_version", "agreed_at")

    def has_add_permission(self, request, obj=None) -> bool:
        return False


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    """Email-based user admin (no username field)."""

    inlines = [ConsentInline, AttemptInline]
    ordering = ["-created_at"]
    list_display = (
        "email",
        "full_name",
        "role",
        "faculty",
        "level_of_study",
        "prior_ai_exposure",
        "current_streak",
        "is_staff",
        "created_at",
    )
    list_filter = ("role", "prior_ai_exposure", "is_staff", "is_active", "faculty")
    search_fields = ("email", "full_name", "faculty")
    readonly_fields = ("created_at", "last_login")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal", {"fields": ("full_name", "faculty", "level_of_study", "prior_ai_exposure")}),
        ("Engagement", {"fields": ("current_streak", "last_active_date")}),
        ("Roles & permissions", {"fields": ("role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "created_at")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "full_name", "role", "password1", "password2"),
            },
        ),
    )


@admin.register(ConsentRecord)
class ConsentRecordAdmin(admin.ModelAdmin):
    list_display = ("user", "consent_version", "agreed_at")
    list_filter = ("consent_version", "agreed_at")
    search_fields = ("user__email", "user__full_name")
    readonly_fields = ("agreed_at",)
