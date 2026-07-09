"""Branching-scenario visibility and idempotency tests."""
from __future__ import annotations

import pytest

from content.models import Scenario, ScenarioOption
from content.services import visible_scenarios
from conftest import submit_pretest

pytestmark = pytest.mark.django_db


@pytest.fixture
def branching(db, modules):
    """
    Add a second scenario to module 1 that only appears if the student chose the
    'Ethical' option of the first scenario.
    """
    module = modules[0]
    base_scenario = module.scenarios.get(scenario_order=1)
    trigger_option = base_scenario.options.get(option_text="Ethical")

    dependent = Scenario.objects.create(
        module=module,
        situation_text="Follow-up scenario (branch)",
        scenario_order=2,
        depends_on_choice=trigger_option,
    )
    ScenarioOption.objects.create(
        scenario=dependent, option_text="A", consequence_text="c",
        ethical_principle="Fairness", dimension="responsible_use", weight=80,
    )
    return {"module": module, "base": base_scenario, "dependent": dependent,
            "trigger": trigger_option}


def test_branch_invisible_until_trigger_chosen(
    client_student, student, pretest, branching
):
    """A branching scenario is invisible until its trigger option is chosen."""
    submit_pretest(student, pretest)
    module = branching["module"]

    # Initially, only the base scenario is visible.
    visible = visible_scenarios(student, module)
    assert branching["dependent"] not in visible
    assert branching["base"] in visible

    # Choose the trigger option via the API.
    resp = client_student.post(
        f"/api/scenarios/{branching['base'].id}/choose/",
        {"option_id": branching["trigger"].id},
        format="json",
    )
    assert resp.status_code == 201
    assert branching["dependent"].id in resp.json()["newly_unlocked_scenario_ids"]

    # Now the dependent scenario is visible.
    visible_after = visible_scenarios(student, module)
    assert branching["dependent"] in visible_after


def test_branch_stays_hidden_for_other_choice(
    client_student, student, pretest, branching
):
    submit_pretest(student, pretest)
    module = branching["module"]
    other_option = branching["base"].options.get(option_text="Unethical")

    client_student.post(
        f"/api/scenarios/{branching['base'].id}/choose/",
        {"option_id": other_option.id},
        format="json",
    )
    assert branching["dependent"] not in visible_scenarios(student, module)


def test_choosing_twice_returns_409(client_student, student, pretest, modules):
    """A second choice for the same scenario returns 409, not a crash."""
    submit_pretest(student, pretest)
    scenario = modules[0].scenarios.get(scenario_order=1)
    option = scenario.options.first()

    first = client_student.post(
        f"/api/scenarios/{scenario.id}/choose/",
        {"option_id": option.id}, format="json",
    )
    assert first.status_code == 201
    second = client_student.post(
        f"/api/scenarios/{scenario.id}/choose/",
        {"option_id": option.id}, format="json",
    )
    assert second.status_code == 409


def test_choice_returns_consequence(client_student, student, pretest, modules):
    submit_pretest(student, pretest)
    scenario = modules[0].scenarios.get(scenario_order=1)
    option = scenario.options.get(option_text="Ethical")
    resp = client_student.post(
        f"/api/scenarios/{scenario.id}/choose/",
        {"option_id": option.id}, format="json",
    )
    assert resp.json()["consequence_text"] == "Good"
    assert resp.json()["ethical_principle"] == "Transparency"
