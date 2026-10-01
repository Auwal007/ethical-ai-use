"""
Admin for per-student progress and reflections.

ScenarioChoice and DimensionScore are intentionally NOT registered as top-level
admin entries — they are machine-written analysis data the researcher reads via
the frontend dashboard / CSV export, not something edited by hand here. Progress
and Reflection remain, as those are the useful participant-level records.
"""
from __future__ import annotations

from django.contrib import admin

from .models import Progress, Reflection


@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "module", "status", "completed_at")
    list_filter = ("status", "module")
    search_fields = ("user__email", "user__full_name", "module__title")
    autocomplete_fields = ("user", "module")


@admin.register(Reflection)
class ReflectionAdmin(admin.ModelAdmin):
    list_display = ("user", "module", "short_response", "created_at")
    list_filter = ("module", "created_at")
    search_fields = ("user__email", "user__full_name", "response_text")
    readonly_fields = ("created_at",)
    autocomplete_fields = ("user", "module")

    @admin.display(description="Response")
    def short_response(self, obj: Reflection) -> str:
        return obj.response_text[:60]
