"""Serializers for reflections. Profile/growth payloads are plain dicts."""
from __future__ import annotations

from rest_framework import serializers

from .models import Reflection


class ReflectionSerializer(serializers.ModelSerializer):
    module_sequence = serializers.IntegerField(
        source="module.sequence_no", read_only=True
    )
    module_title = serializers.CharField(source="module.title", read_only=True)

    class Meta:
        model = Reflection
        fields = (
            "id",
            "module",
            "module_sequence",
            "module_title",
            "prompt_text",
            "response_text",
            "created_at",
        )
        read_only_fields = fields


class ReflectionCreateSerializer(serializers.Serializer):
    response_text = serializers.CharField(min_length=50)
