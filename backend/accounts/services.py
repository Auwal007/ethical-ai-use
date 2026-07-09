"""
Account services: registration (with mandatory consent) and the computed
fields exposed by /api/auth/me/.

Business logic lives here so the views stay thin and the consent precondition
(FR3) and role-assignment policy are unit-testable in isolation.
"""
from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import transaction

from common.exceptions import ConflictError

if TYPE_CHECKING:
    from accounts.models import User


@transaction.atomic
def register_participant(
    *,
    full_name: str,
    email: str,
    password: str,
    consent_agreed: bool,
    consent_version: str,
    faculty: str = "",
    level_of_study: str = "",
    prior_ai_exposure: str = "",
) -> "User":
    """
    Create a participant and their consent record atomically.

    Consent is a hard precondition for participation (FR3): if ``consent_agreed``
    is not True we refuse to create the account at all — there is no
    consent-less user in the system. Role is forced to 'student' server-side;
    a client can never register itself (or anyone) as an admin.
    """
    from accounts.models import ConsentRecord, User

    if consent_agreed is not True:
        raise ConflictError(
            detail="Informed consent is required to register.",
            code="consent_required",
        )

    if User.objects.filter(email__iexact=email).exists():
        raise ConflictError(detail="An account with this email already exists.")

    user = User.objects.create_user(
        email=email,
        password=password,
        full_name=full_name,
        role=User.Role.STUDENT,  # never trust client-supplied role
        faculty=faculty or "",
        level_of_study=level_of_study or "",
        prior_ai_exposure=prior_ai_exposure or "",
    )
    ConsentRecord.objects.create(user=user, consent_version=consent_version)
    return user


def get_me_payload(user: "User") -> dict:
    """
    Assemble the computed profile shown at /api/auth/me/: streak plus the gating
    flags the frontend needs to route the participant to their next step.
    """
    from progress.models import Progress
    from progress.services import get_user_state

    state = get_user_state(user)
    modules_completed = Progress.objects.filter(
        user=user, status=Progress.Status.COMPLETED
    ).count()

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "faculty": user.faculty,
        "level_of_study": user.level_of_study,
        "prior_ai_exposure": user.prior_ai_exposure,
        "streak": user.current_streak,
        "pretest_completed": state.pretest_completed,
        "posttest_available": state.all_modules_completed
        and not state.posttest_completed,
        "modules_completed": modules_completed,
    }
