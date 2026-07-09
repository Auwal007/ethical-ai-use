"""
Assessment models: the pre-test / post-test / quiz / usability instruments,
their questions, and each participant's single attempt + item responses.

Together these enforce the O1 X O2 quasi-experimental design at the database
level — see the ``Attempt`` unique constraint.
"""
from __future__ import annotations

from django.conf import settings
from django.db import models

from common.constants import DIMENSION_CHOICES


class Assessment(models.Model):
    """
    A single research instrument.

    ``module`` links a *quiz* to the module it assesses. Pre-tests, post-tests
    and usability surveys are study-wide, so they carry no module. The
    CheckConstraint enforces this invariant in the database: module is set if
    and only if the assessment is a quiz.
    """

    class AssessmentType(models.TextChoices):
        PRETEST = "pretest", "Pre-test"
        POSTTEST = "posttest", "Post-test"
        QUIZ = "quiz", "Quiz"
        USABILITY = "usability", "Usability"

    assessment_type = models.CharField(max_length=20, choices=AssessmentType.choices)
    module = models.ForeignKey(
        "content.Module",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="assessments",
    )
    title = models.CharField(max_length=160)

    class Meta:
        constraints = [
            models.CheckConstraint(
                # (type == quiz AND module IS NOT NULL) OR
                # (type != quiz AND module IS NULL)
                check=(
                    models.Q(assessment_type="quiz", module__isnull=False)
                    | (~models.Q(assessment_type="quiz") & models.Q(module__isnull=True))
                ),
                name="assessment_module_iff_quiz",
                violation_error_message=(
                    "A module must be set for quizzes only, and must be null "
                    "for pretest/posttest/usability assessments."
                ),
            )
        ]

    def __str__(self) -> str:
        return f"{self.get_assessment_type_display()}: {self.title}"


class Question(models.Model):
    """
    A question inside an assessment.

    ``options`` (JSON) holds MCQ choices or Likert labels. ``correct_answer``
    is null for Likert items (no right answer — they measure attitude).
    ``dimension`` maps the item to one of the six ethical-reasoning dimensions.
    """

    class QuestionType(models.TextChoices):
        MCQ = "mcq", "Multiple Choice"
        LIKERT = "likert", "Likert Scale"

    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name="questions",
    )
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QuestionType.choices)
    options = models.JSONField(null=True, blank=True)
    correct_answer = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Null for Likert items (no correct answer).",
    )
    # For EAILT/quiz items this is one of the six ethical dimensions; for the
    # usability instrument it holds the usability domain (navigation,
    # learnability, …). choices drive the admin dropdown for the common case but
    # are not DB-enforced, so usability domains store fine.
    dimension = models.CharField(max_length=60, choices=DIMENSION_CHOICES)
    question_order = models.SmallIntegerField()
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=1)

    # Quiz-only feedback served from the DB (null for pre/post-test & usability —
    # the EAILT must never return feedback, which would contaminate the paired
    # instrument).
    feedback_correct = models.TextField(null=True, blank=True)
    feedback_incorrect = models.TextField(null=True, blank=True)

    # Usability only: item 7 and 14 are negatively worded, so their Likert value
    # is inverted (6 - raw) when scoring. Kept on the model so the scoring rule
    # lives with the data rather than being hard-coded to item numbers.
    reverse_scored = models.BooleanField(default=False)

    class Meta:
        ordering = ["question_order"]

    def __str__(self) -> str:
        return f"Q{self.question_order} ({self.assessment_id}): {self.question_text[:40]}"


class Attempt(models.Model):
    """
    A participant's attempt at one assessment.

    ``unique_together = (user, assessment)`` guarantees each participant can
    have at most ONE attempt per instrument. This is deliberate: it protects
    the quasi-experimental design (exactly one pre-test observation O1 and one
    post-test observation O2 per participant), preventing repeat submissions
    from contaminating the paired analysis.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="attempts",
    )
    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name="attempts",
    )
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    total_score = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )

    class Meta:
        unique_together = ("user", "assessment")

    def __str__(self) -> str:
        return f"{self.user_id} × {self.assessment_id}"


class Response(models.Model):
    """
    A participant's answer to a single question within an attempt.

    ``unique_together = (attempt, question)`` prevents duplicate answers to the
    same item inside one attempt.
    """

    attempt = models.ForeignKey(
        Attempt,
        on_delete=models.CASCADE,
        related_name="responses",
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="responses",
    )
    answer = models.TextField()
    item_score = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )

    class Meta:
        unique_together = ("attempt", "question")

    def __str__(self) -> str:
        return f"Response(attempt={self.attempt_id}, q={self.question_id})"
