"""Serializers for learning content. All read-only for students."""
from __future__ import annotations

from rest_framework import serializers

from .models import ContentPage, Module, Scenario, ScenarioOption


class ModuleListSerializer(serializers.ModelSerializer):
    """Module summary + per-user status/accessibility (annotated by the view)."""

    status = serializers.CharField(read_only=True)
    is_accessible = serializers.BooleanField(read_only=True)

    class Meta:
        model = Module
        fields = (
            "id",
            "sequence_no",
            "title",
            "summary",
            "status",
            "is_accessible",
        )


class ContentPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentPage
        fields = ("id", "title", "body", "page_order")


class ScenarioOptionSerializer(serializers.ModelSerializer):
    """Options as shown to a student — note: no ``weight`` leaked to students."""

    class Meta:
        model = ScenarioOption
        fields = ("id", "option_text")


class ScenarioSerializer(serializers.ModelSerializer):
    options = ScenarioOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Scenario
        fields = ("id", "situation_text", "scenario_order", "options")


class ModuleDetailSerializer(serializers.ModelSerializer):
    """Full module: ordered pages + the scenarios visible to this user."""

    pages = ContentPageSerializer(many=True, read_only=True)
    scenarios = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = ("id", "sequence_no", "title", "summary", "pages", "scenarios")

    def get_scenarios(self, obj: Module):
        # 'visible_scenarios' is injected via context by the view.
        visible = self.context.get("visible_scenarios", [])
        return ScenarioSerializer(visible, many=True).data
