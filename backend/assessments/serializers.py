"""
Assessment serializers.

The student-facing question serializer deliberately OMITS ``correct_answer`` —
leaking it would let a participant see the key and would invalidate the
instrument. There is no code path that serialises ``correct_answer`` to a student.
"""
from __future__ import annotations

from rest_framework import serializers

from .models import Assessment, Question


class StudentQuestionSerializer(serializers.ModelSerializer):
    """Question as shown to a student — no ``correct_answer`` field exists here."""

    class Meta:
        model = Question
        fields = (
            "id",
            "question_text",
            "question_type",
            "options",
            "dimension",
            "question_order",
            "max_score",
        )
        read_only_fields = fields


class AssessmentSerializer(serializers.ModelSerializer):
    """An assessment with its ordered questions (student-safe)."""

    questions = StudentQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Assessment
        fields = ("id", "assessment_type", "title", "module", "questions")
        read_only_fields = fields


class ResponseItemSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    answer = serializers.CharField(allow_blank=True)


class SubmitSerializer(serializers.Serializer):
    responses = ResponseItemSerializer(many=True)
