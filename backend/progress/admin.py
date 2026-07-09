"""Admin for per-student progress, choices, dimension scores, and reflections."""
from __future__ import annotations

from django.contrib import admin

from .models import DimensionScore, Progress, Reflection, ScenarioChoice


@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "module", "status", "completed_at")
    list_filter = ("status", "module")
    search_fields = ("user__email", "user__full_name", "module__title")
    autocomplete_fields = ("user", "module")


@admin.register(ScenarioChoice)
class ScenarioChoiceAdmin(admin.ModelAdmin):
    list_display = ("user", "scenario", "selected_option", "chosen_at")
    list_filter = ("scenario__module", "chosen_at")
    search_fields = ("user__email", "user__full_name")
    readonly_fields = ("chosen_at",)
    autocomplete_fields = ("user", "scenario", "selected_option")


@admin.register(DimensionScore)
class DimensionScoreAdmin(admin.ModelAdmin):
    list_display = ("user", "dimension", "source", "score", "max_possible", "updated_at")
    list_filter = ("dimension", "source")
    search_fields = ("user__email", "user__full_name")
    readonly_fields = ("updated_at",)
    autocomplete_fields = ("user",)


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
