"""Admin for assessments. Assessments inline their questions."""
from __future__ import annotations

from django.contrib import admin

from .models import Assessment, Attempt, Question, Response


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    ordering = ["question_order"]


class ResponseInline(admin.TabularInline):
    model = Response
    extra = 0
    readonly_fields = ("question", "answer", "item_score")
    can_delete = False


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ("title", "assessment_type", "module", "question_count")
    list_filter = ("assessment_type", "module")
    search_fields = ("title",)
    inlines = [QuestionInline]

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


@admin.register(Attempt)
class AttemptAdmin(admin.ModelAdmin):
    list_display = ("user", "assessment", "started_at", "submitted_at", "total_score")
    list_filter = ("assessment__assessment_type", "submitted_at")
    search_fields = ("user__email", "user__full_name", "assessment__title")
    readonly_fields = ("started_at",)
    inlines = [ResponseInline]


@admin.register(Response)
class ResponseAdmin(admin.ModelAdmin):
    list_display = ("attempt", "question", "short_answer", "item_score")
    list_filter = ("question__dimension",)
    search_fields = ("attempt__user__email", "answer")

    @admin.display(description="Answer")
    def short_answer(self, obj: Response) -> str:
        return obj.answer[:50]
