"""
Content services: scenario visibility/branching, recording scenario choices, and
module completion.

The branching mechanism is the novel contribution of this system, so its rules
live in one place and are unit-testable. A scenario's visibility is a pure
function of the user's recorded choices, which means a participant's path through
the branch tree is fully reconstructable for the qualitative analysis.
"""
from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from django.db import IntegrityError, transaction

from common.exceptions import ConflictError, GatingError

if TYPE_CHECKING:
    from accounts.models import User
    from content.models import Scenario, ScenarioOption


def visible_scenarios(user: "User", module) -> list["Scenario"]:
    """
    Return the scenarios of ``module`` currently visible to ``user``, in order.

    A scenario is visible iff:
      * ``depends_on_choice`` is null (always shown), OR
      * the user has a ScenarioChoice whose ``selected_option`` equals that
        ``depends_on_choice`` (the trigger option was chosen).
    """
    from progress.models import ScenarioChoice

    chosen_option_ids = set(
        ScenarioChoice.objects.filter(user=user).values_list(
            "selected_option_id", flat=True
        )
    )

    result: list["Scenario"] = []
    for scenario in module.scenarios.all().order_by("scenario_order"):
        if scenario.depends_on_choice_id is None:
            result.append(scenario)
        elif scenario.depends_on_choice_id in chosen_option_ids:
            result.append(scenario)
    return result


def _scenario_is_visible(user: "User", scenario: "Scenario") -> bool:
    """Whether a single scenario is currently visible to the user."""
    if scenario.depends_on_choice_id is None:
        return True
    from progress.models import ScenarioChoice

    return ScenarioChoice.objects.filter(
        user=user, selected_option_id=scenario.depends_on_choice_id
    ).exists()


@transaction.atomic
def choose_scenario_option(
    user: "User", *, scenario: "Scenario", option_id: int
) -> dict:
    """
    Record the user's choice for a scenario and return its consequence plus any
    scenarios newly unlocked by the choice.

    * The scenario must be currently visible to the user (else GatingError).
    * The option must belong to the scenario.
    * Choosing is idempotent-safe: a second choice for the same scenario raises
      ConflictError (409), never a 500 — protected by the (user, scenario)
      unique constraint.
    * The chosen option's weight/dimension feed the learning-phase
      DimensionScore (source='learning').
    """
    from content.models import Scenario, ScenarioOption
    from progress.models import ScenarioChoice
    from progress.services import record_dimension_delta

    if not _scenario_is_visible(user, scenario):
        raise GatingError(detail="This scenario is not available yet.")

    try:
        option = scenario.options.get(id=option_id)
    except ScenarioOption.DoesNotExist:
        raise GatingError(
            detail="That option does not belong to this scenario.",
            code="invalid_option",
        )

    try:
        ScenarioChoice.objects.create(
            user=user, scenario=scenario, selected_option=option
        )
    except IntegrityError:
        raise ConflictError(detail="You have already answered this scenario.")

    # Learning-phase dimension score contribution.
    record_dimension_delta(
        user,
        dimension=option.dimension,
        source="learning",
        score=Decimal(option.weight),
        max_possible=Decimal(100),
    )

    # Any scenario (this or a later module) whose trigger is this option and
    # which is now visible = newly unlocked.
    newly_unlocked = list(
        Scenario.objects.filter(depends_on_choice=option).order_by(
            "module__sequence_no", "scenario_order"
        )
    )

    return {
        "consequence_text": option.consequence_text,
        "ethical_principle": option.ethical_principle,
        "dimension": option.dimension,
        "newly_unlocked_scenario_ids": [s.id for s in newly_unlocked],
    }


@transaction.atomic
def complete_module(user: "User", module) -> None:
    """
    Mark ``module`` completed for ``user``.

    Allowed only when the participant has genuinely done the module's work:
      * the module's quiz has a submitted Attempt,
      * every currently-visible scenario has a ScenarioChoice, and
      * a Reflection exists for the module.
    Otherwise GatingError. This prevents 'completing' a module by calling the
    endpoint directly, which would corrupt the progression data.
    """
    from assessments.models import Assessment, Attempt
    from django.utils import timezone
    from progress.models import Progress, Reflection, ScenarioChoice
    from progress.services import is_module_accessible

    if not is_module_accessible(user, module.id):
        raise GatingError(detail="This module is not accessible yet.")

    # Quiz must be submitted (if the module has a quiz).
    quiz = Assessment.objects.filter(
        assessment_type=Assessment.AssessmentType.QUIZ, module=module
    ).first()
    if quiz is not None:
        if not Attempt.objects.filter(
            user=user, assessment=quiz, submitted_at__isnull=False
        ).exists():
            raise GatingError(detail="Complete the module quiz first.")

    # All visible scenarios answered.
    visible = visible_scenarios(user, module)
    answered_ids = set(
        ScenarioChoice.objects.filter(
            user=user, scenario__in=visible
        ).values_list("scenario_id", flat=True)
    )
    if any(s.id not in answered_ids for s in visible):
        raise GatingError(detail="Answer all scenarios before completing.")

    # Reflection required.
    if not Reflection.objects.filter(user=user, module=module).exists():
        raise GatingError(detail="Submit your reflection before completing.")

    Progress.objects.update_or_create(
        user=user,
        module=module,
        defaults={
            "status": Progress.Status.COMPLETED,
            "completed_at": timezone.now(),
        },
    )
