"""
Shared pytest fixtures and seed helpers.

Builds a realistic study instrument in the test DB: a parity-matched
pretest/posttest, six published modules each with a quiz and scenarios
(including a branching scenario), and a usability survey. Helper functions let
individual tests drive a participant all the way through the flow.
"""
from __future__ import annotations

from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from accounts.models import ConsentRecord, User
from assessments.models import Assessment, Question
from content.models import ContentPage, Module, Scenario, ScenarioOption
from common.constants import DIMENSIONS


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
@pytest.fixture
def student(db) -> User:
    user = User.objects.create_user(
        email="student@atbu.edu.ng",
        password="pass1234",
        full_name="Test Student",
        role=User.Role.STUDENT,
        faculty="Science",
        level_of_study="400",
        prior_ai_exposure="basic",
    )
    ConsentRecord.objects.create(user=user, consent_version="1.0")
    return user


@pytest.fixture
def other_student(db) -> User:
    return User.objects.create_user(
        email="other@atbu.edu.ng",
        password="pass1234",
        full_name="Other Student",
        role=User.Role.STUDENT,
    )


@pytest.fixture
def admin_user(db) -> User:
    return User.objects.create_user(
        email="admin@atbu.edu.ng",
        password="pass1234",
        full_name="Researcher",
        role=User.Role.ADMIN,
        is_staff=True,
    )


def auth_client(user: User) -> APIClient:
    """An APIClient authenticated as ``user`` via JWT."""
    from rest_framework_simplejwt.tokens import RefreshToken

    client = APIClient()
    token = RefreshToken.for_user(user).access_token
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return client


@pytest.fixture
def client_student(student) -> APIClient:
    return auth_client(student)


@pytest.fixture
def client_admin(admin_user) -> APIClient:
    return auth_client(admin_user)


# ---------------------------------------------------------------------------
# Instrument seeding
# ---------------------------------------------------------------------------
# A small identical question set for pretest & posttest (parity).
_PARITY_QUESTIONS = [
    {"text": "Bias in AI stems mainly from?", "dim": DIMENSIONS[2], "order": 1,
     "opts": ["Training data", "Screen size", "CPU"], "correct": "Training data"},
    {"text": "Sharing personal data with AI risks?", "dim": DIMENSIONS[3], "order": 2,
     "opts": ["Nothing", "Privacy loss", "Faster replies"], "correct": "Privacy loss"},
]


def _make_parity_assessment(assessment_type: str) -> Assessment:
    a = Assessment.objects.create(
        assessment_type=assessment_type,
        title=f"{assessment_type} instrument",
    )
    for q in _PARITY_QUESTIONS:
        Question.objects.create(
            assessment=a,
            question_text=q["text"],
            question_type="mcq",
            options=q["opts"],
            correct_answer=q["correct"],
            dimension=q["dim"],
            question_order=q["order"],
            max_score=Decimal("1"),
        )
    return a


@pytest.fixture
def pretest(db) -> Assessment:
    return _make_parity_assessment("pretest")


@pytest.fixture
def posttest(db) -> Assessment:
    return _make_parity_assessment("posttest")


@pytest.fixture
def usability(db) -> Assessment:
    a = Assessment.objects.create(assessment_type="usability", title="Usability")
    for i in range(1, 4):
        Question.objects.create(
            assessment=a,
            question_text=f"The system was easy to use ({i}).",
            question_type="likert",
            options=[1, 2, 3, 4, 5],
            correct_answer=None,
            dimension=DIMENSIONS[0],
            question_order=i,
            max_score=Decimal("5"),
        )
    return a


@pytest.fixture
def modules(db) -> list[Module]:
    """Six published modules, each with a page, a quiz, and a non-branching scenario."""
    mods = []
    for n in range(1, 7):
        m = Module.objects.create(
            title=f"Module {n}",
            sequence_no=n,
            summary=f"Summary {n}",
            is_published=True,
        )
        ContentPage.objects.create(
            module=m, title=f"Page {n}", body="Body", page_order=1
        )
        # Quiz with one MCQ.
        quiz = Assessment.objects.create(
            assessment_type="quiz", module=m, title=f"Quiz {n}"
        )
        Question.objects.create(
            assessment=quiz,
            question_text=f"Q for module {n}",
            question_type="mcq",
            options=["A", "B"],
            correct_answer="A",
            dimension=DIMENSIONS[(n - 1) % len(DIMENSIONS)],
            question_order=1,
            max_score=Decimal("1"),
        )
        # A single always-visible scenario with two options.
        sc = Scenario.objects.create(
            module=m, situation_text=f"Scenario {n}", scenario_order=1
        )
        ScenarioOption.objects.create(
            scenario=sc, option_text="Ethical", consequence_text="Good",
            ethical_principle="Transparency", dimension=DIMENSIONS[0], weight=100,
        )
        ScenarioOption.objects.create(
            scenario=sc, option_text="Unethical", consequence_text="Bad",
            ethical_principle="Transparency", dimension=DIMENSIONS[0], weight=0,
        )
        mods.append(m)
    return mods


# ---------------------------------------------------------------------------
# Flow helpers
# ---------------------------------------------------------------------------
def submit_pretest(user: User, pretest: Assessment) -> None:
    """Give ``user`` a submitted pretest attempt via the scoring service."""
    from assessments.services import submit_assessment

    responses = [
        {"question_id": q.id, "answer": q.correct_answer}
        for q in pretest.questions.all()
    ]
    submit_assessment(user, assessment=pretest, responses=responses)


def complete_module_fully(user: User, module: Module) -> None:
    """Do everything required to complete a module: quiz + scenarios + reflection."""
    from assessments.models import Assessment
    from assessments.services import submit_assessment
    from content.services import choose_scenario_option, visible_scenarios
    from progress.services import create_reflection

    quiz = Assessment.objects.get(assessment_type="quiz", module=module)
    submit_assessment(
        user,
        assessment=quiz,
        responses=[
            {"question_id": q.id, "answer": q.correct_answer}
            for q in quiz.questions.all()
        ],
    )
    for scenario in visible_scenarios(user, module):
        first_option = scenario.options.first()
        choose_scenario_option(user, scenario=scenario, option_id=first_option.id)
    create_reflection(
        user,
        module=module,
        response_text="I reflected deeply on the ethics of AI in this module here.",
    )
    from content.services import complete_module

    complete_module(user, module)
