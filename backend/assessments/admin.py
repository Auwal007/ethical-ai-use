"""
Admin for assessments.

Assessments inline their questions. Attempt and Response are NOT registered as
top-level entries (a researcher never hand-edits raw scored data); attempts are
surfaced read-only as an inline on the participant (User) admin instead.

Pre-test / post-test Questions are made read-only in the admin to protect
instrument parity — editing them there would silently invalidate the paired
O1 X O2 comparison. Content is changed through the seed files.
"""
from __future__ import annotations

from django.contrib import admin
from django.db.models import QuerySet
from django.http import HttpRequest

from .models import Assessment, Attempt, Question, Response

# Assessment types whose questions must never be edited from the admin.
_PROTECTED_TYPES = ("pretest", "posttest")

_PARITY_WARNING = (
    "Editing pre-test or post-test questions will break instrument parity and "
    "invalidate the study. Use the seed files instead."
)


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    ordering = ["question_order"]


class ResponseInline(admin.TabularInline):
    """Read-only view of an attempt's item responses."""

    model = Response
    extra = 0
    readonly_fields = ("question", "answer", "item_score")
    can_delete = False

    def has_add_permission(self, request: HttpRequest, obj=None) -> bool:
        return False


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ("title", "assessment_type", "module", "question_count")
    list_filter = ("assessment_type",)
    search_fields = ("title",)
    inlines = [QuestionInline]

    def get_queryset(self, request: HttpRequest) -> QuerySet:
        """Order so pre-test and post-test appear first, then quiz/usability."""
        qs = super().get_queryset(request)
        # Custom type ordering via a Case expression.
        from django.db.models import Case, IntegerField, Value, When

        return qs.annotate(
            _type_rank=Case(
                When(assessment_type="pretest", then=Value(0)),
                When(assessment_type="posttest", then=Value(1)),
                When(assessment_type="quiz", then=Value(2)),
                When(assessment_type="usability", then=Value(3)),
                default=Value(9),
                output_field=IntegerField(),
            )
        ).order_by("_type_rank", "module__sequence_no", "title")

    @admin.display(description="Questions")
    def question_count(self, obj: Assessment) -> int:
        return obj.questions.count()


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = (
        "assessment",
        "question_order",
        "short_text",
        "question_type",
        "dimension",
        "max_score",
    )
    list_filter = ("question_type", "dimension", "assessment__assessment_type")
    search_fields = ("question_text",)
    ordering = ["assessment", "question_order"]

    @admin.display(description="Question")
    def short_text(self, obj: Question) -> str:
        return obj.question_text[:60]

    # -- Instrument protection ---------------------------------------------
    @staticmethod
    def _is_protected(obj: Question | None) -> bool:
        return obj is not None and obj.assessment.assessment_type in _PROTECTED_TYPES

    def has_change_permission(self, request: HttpRequest, obj: Question | None = None) -> bool:
        if self._is_protected(obj):
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request: HttpRequest, obj: Question | None = None) -> bool:
        if self._is_protected(obj):
            return False
        return super().has_delete_permission(request, obj)

    def change_view(self, request, object_id, form_url="", extra_context=None):
        """Show a warning banner on pre/post-test question pages."""
        extra_context = extra_context or {}
        obj = self.get_object(request, object_id)
        if self._is_protected(obj):
            extra_context["parity_warning"] = _PARITY_WARNING
        return super().change_view(request, object_id, form_url, extra_context)


class AttemptInline(admin.TabularInline):
    """Read-only summary of a participant's assessment attempts (on User admin)."""

    model = Attempt
    extra = 0
    can_delete = False
    fields = ("assessment", "started_at", "submitted_at", "total_score")
    readonly_fields = fields

    def has_add_permission(self, request: HttpRequest, obj=None) -> bool:
        return False
