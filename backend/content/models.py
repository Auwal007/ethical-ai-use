"""
Learning-content models: the modules, their reading pages, and the branching
ethical scenarios that make up the intervention (the "X" in the O1 X O2 study).
"""
from __future__ import annotations

from django.db import models

from common.constants import DIMENSION_CHOICES


class Module(models.Model):
    """
    A learning module. ``sequence_no`` is unique to enforce a single, ordered
    curriculum (modules 1..6); the frontend unlocks them in this order.
    """

    title = models.CharField(max_length=160)
    sequence_no = models.SmallIntegerField(
        unique=True,
        help_text="Ordering position in the curriculum (e.g. 1–6). Unique.",
    )
    summary = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)
    reflection_prompt = models.TextField(
        blank=True,
        help_text=(
            "The reflection question shown at the end of the module. Served by "
            "the reflection endpoint so the prompt is authored content, not "
            "hard-coded."
        ),
    )

    class Meta:
        ordering = ["sequence_no"]

    def __str__(self) -> str:
        return f"{self.sequence_no}. {self.title}"


class ContentPage(models.Model):
    """A single reading page within a module (markdown body)."""

    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE,
        related_name="pages",
    )
    title = models.CharField(max_length=160)
    body = models.TextField(help_text="Markdown content.")
    page_order = models.SmallIntegerField()

    class Meta:
        ordering = ["page_order"]
        unique_together = ("module", "page_order")

    def __str__(self) -> str:
        return f"{self.module.title} — p{self.page_order}: {self.title}"


class Scenario(models.Model):
    """
    A branching ethical decision-point within a module.

    ``depends_on_choice`` is the mechanism for *persistent branching*: when it
    is set, this scenario is only presented to a student who previously chose
    that specific ScenarioOption. A null value means the scenario is always
    shown. Because the branch condition lives in the database (not hard-coded
    in the frontend), researchers can author and rewire branching paths from
    the Django admin without a code change, and each student's actual path is
    reconstructable from their recorded choices.
    """

    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE,
        related_name="scenarios",
    )
    situation_text = models.TextField()
    scenario_order = models.SmallIntegerField()
    depends_on_choice = models.ForeignKey(
        "content.ScenarioOption",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="triggers",
        help_text=(
            "If set, this scenario only unlocks for students who selected this "
            "option earlier. Null = always shown."
        ),
    )

    class Meta:
        ordering = ["scenario_order"]

    def __str__(self) -> str:
        return f"{self.module.title} — scenario {self.scenario_order}"


class ScenarioOption(models.Model):
    """
    One selectable answer to a Scenario.

    ``weight`` (0–100) encodes how ethically sound the option is and feeds the
    student's learning-phase dimension scores. ``ethical_principle`` and
    ``dimension`` tag the option so choices roll up into the Ethical Reasoning
    Profile.
    """

    scenario = models.ForeignKey(
        Scenario,
        on_delete=models.CASCADE,
        related_name="options",
    )
    option_text = models.TextField()
    consequence_text = models.TextField(
        help_text="Feedback shown after the option is chosen."
    )
    ethical_principle = models.CharField(max_length=160)
    dimension = models.CharField(max_length=60, choices=DIMENSION_CHOICES)
    weight = models.SmallIntegerField(
        help_text="How ethically sound this choice is, 0–100."
    )

    def __str__(self) -> str:
        return f"Option (w={self.weight}) — {self.option_text[:40]}"
