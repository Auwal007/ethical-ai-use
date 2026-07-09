"""
Admin for learning content. This is the researcher's content-management tool:
modules inline their pages and scenarios; scenarios inline their options.
"""
from __future__ import annotations

from django.contrib import admin

from .models import ContentPage, Module, Scenario, ScenarioOption


class ContentPageInline(admin.TabularInline):
    model = ContentPage
    extra = 1
    ordering = ["page_order"]


class ScenarioInline(admin.TabularInline):
    model = Scenario
    extra = 1
    ordering = ["scenario_order"]
    # Only the FK back to this module; depends_on_choice is edited on the
    # Scenario page where the option dropdown is meaningful.
    fields = ("scenario_order", "situation_text", "depends_on_choice")


class ScenarioOptionInline(admin.TabularInline):
    model = ScenarioOption
    extra = 2


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ("sequence_no", "title", "is_published")
    list_filter = ("is_published",)
    search_fields = ("title", "summary")
    ordering = ["sequence_no"]
    inlines = [ContentPageInline, ScenarioInline]


@admin.register(ContentPage)
class ContentPageAdmin(admin.ModelAdmin):
    list_display = ("module", "page_order", "title")
    list_filter = ("module",)
    search_fields = ("title", "body")
    ordering = ["module", "page_order"]


@admin.register(Scenario)
class ScenarioAdmin(admin.ModelAdmin):
    list_display = ("module", "scenario_order", "short_situation", "depends_on_choice")
    list_filter = ("module",)
    search_fields = ("situation_text",)
    ordering = ["module", "scenario_order"]
    inlines = [ScenarioOptionInline]
    autocomplete_fields = ("depends_on_choice",)

    @admin.display(description="Situation")
    def short_situation(self, obj: Scenario) -> str:
        return obj.situation_text[:60]


@admin.register(ScenarioOption)
class ScenarioOptionAdmin(admin.ModelAdmin):
    list_display = ("scenario", "short_text", "dimension", "ethical_principle", "weight")
    list_filter = ("dimension", "scenario__module")
    search_fields = ("option_text", "ethical_principle", "consequence_text")

    @admin.display(description="Option")
    def short_text(self, obj: ScenarioOption) -> str:
        return obj.option_text[:50]
