"""
Progress models: per-student state that drives module unlocking, the persistent
branching of scenarios, the Ethical Reasoning Profile, and reflections.
"""
from __future__ import annotations

from django.conf import settings
from django.db import models

from common.constants import DIMENSION_CHOICES


class Progress(models.Model):
    """
    A student's status within one module. Drives the curriculum gating
    (locked → unlocked → in_progress → completed) shown on the dashboard.
    """

    class Status(models.TextChoices):
        LOCKED = "locked", "Locked"
        UNLOCKED = "unlocked", "Unlocked"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="module_progress",
    )
    module = models.ForeignKey(
        "content.Module",
        on_delete=models.CASCADE,
        related_name="progress_records",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.LOCKED,
    )
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "module")
        verbose_name_plural = "progress"

    def __str__(self) -> str:
        return f"{self.user_id} — {self.module_id}: {self.status}"


class ScenarioChoice(models.Model):
    """
    Records the option a student selected for a scenario.

    This is what makes branching *persistent*: a Scenario whose
    ``depends_on_choice`` points at a given ScenarioOption will only unlock for
    a student who has a matching ScenarioChoice row. ``unique_together =
    (user, scenario)`` means each student answers each scenario once, so their
    path through the branch tree is deterministic and reconstructable.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="scenario_choices",
    )
    scenario = models.ForeignKey(
        "content.Scenario",
        on_delete=models.CASCADE,
        related_name="choices",
    )
    selected_option = models.ForeignKey(
        "content.ScenarioOption",
        on_delete=models.CASCADE,
        related_name="chosen_by",
    )
    chosen_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "scenario")

    def __str__(self) -> str:
        return f"{self.user_id} chose option {self.selected_option_id}"


class DimensionScore(models.Model):
    """
    A student's score on one of the six ethical-reasoning dimensions, from a
    given source.

    ``source`` distinguishes pre-test, post-test, and learning-phase scores so
    the Ethical Reasoning Profile can be plotted before vs after the
    intervention. ``unique_together = (user, dimension, source)`` keeps exactly
    one score per (student, dimension, source) triple.
    """

    class Source(models.TextChoices):
        PRETEST = "pretest", "Pre-test"
        POSTTEST = "posttest", "Post-test"
        LEARNING = "learning", "Learning"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="dimension_scores",
    )
    dimension = models.CharField(max_length=60, choices=DIMENSION_CHOICES)
    source = models.CharField(max_length=20, choices=Source.choices)
    score = models.DecimalField(max_digits=6, decimal_places=2)
    max_possible = models.DecimalField(max_digits=6, decimal_places=2)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "dimension", "source")

    def __str__(self) -> str:
        return f"{self.user_id} {self.dimension} ({self.source}): {self.score}/{self.max_possible}"


class Reflection(models.Model):
    """
    A student's free-text reflection at the end of a module. One per module
    per student (``unique_together = (user, module)``).
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reflections",
    )
    module = models.ForeignKey(
        "content.Module",
        on_delete=models.CASCADE,
        related_name="reflections",
    )
    prompt_text = models.TextField()
    response_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "module")

    def __str__(self) -> str:
        return f"Reflection {self.user_id} — module {self.module_id}"
