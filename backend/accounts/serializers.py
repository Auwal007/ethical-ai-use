"""Serializers for authentication and user representation."""
from __future__ import annotations

from typing import Any

from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Public representation of a user (no password, no permissions internals)."""

    class Meta:
        model = User
        fields = (
            "id",
            "full_name",
            "email",
            "role",
            "faculty",
            "level_of_study",
            "prior_ai_exposure",
            "current_streak",
            "created_at",
        )
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    """Validates a registration request. ``role`` is intentionally absent."""

    full_name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    faculty = serializers.CharField(max_length=120, required=False, allow_blank=True)
    level_of_study = serializers.CharField(
        max_length=20, required=False, allow_blank=True
    )
    prior_ai_exposure = serializers.ChoiceField(
        choices=User.PriorAIExposure.choices, required=False, allow_blank=True
    )
    consent_agreed = serializers.BooleanField()
    consent_version = serializers.CharField(max_length=20)

    def validate_consent_agreed(self, value: bool) -> bool:
        if value is not True:
            raise serializers.ValidationError(
                "You must agree to the consent form to participate."
            )
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class MeSerializer(serializers.Serializer):
    """Read-only computed profile (shape defined by accounts.services.get_me_payload)."""

    id = serializers.IntegerField()
    full_name = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.CharField()
    faculty = serializers.CharField(allow_blank=True)
    level_of_study = serializers.CharField(allow_blank=True)
    prior_ai_exposure = serializers.CharField(allow_blank=True)
    streak = serializers.IntegerField()
    pretest_completed = serializers.BooleanField()
    posttest_available = serializers.BooleanField()
    modules_completed = serializers.IntegerField()

    def to_representation(self, instance: Any) -> Any:
        # instance is already a plain dict from the service.
        return instance
