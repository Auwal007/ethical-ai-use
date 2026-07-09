"""
Progress services — the research-critical gating engine, the streak tracker, and
the Ethical Reasoning Profile aggregation.

Every content and assessment endpoint routes its access decisions through
``get_user_state`` / the ``*_accessible`` helpers here. Centralising the rules
in one authoritative, unit-testable module is deliberate: the gating and scoring
rules *are* the research instrument, and a determined student calling the API
directly must not be able to skip the pre-test or jump modules out of order.
"""
from __future__ import annotations

import datetime
from dataclasses import dataclass
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from common.constants import DIMENSIONS

if TYPE_CHECKING:  # avoid import cycles at runtime
    from accounts.models import User


# ---------------------------------------------------------------------------
# Streak tracking
# ---------------------------------------------------------------------------
def touch_activity(user: "User", *, today: Optional[datetime.date] = None) -> None:
    """
    Update ``last_active_date`` and recompute ``current_streak`` for a user.

    Called on every authenticated request. Consecutive-day logic:
      * same calendar day as last activity  -> no change (must NOT increment);
      * exactly the previous day            -> streak += 1;
      * any older / never                   -> streak resets to 1.

    Idempotent within a day so refreshing a page can't inflate engagement
    metrics used in the study.
    """
    today = today or timezone.localdate()
    last = user.last_active_date

    if last == today:
        return  # same-day request: do not increment

    if last == today - datetime.timedelta(days=1):
        user.current_streak = (user.current_streak or 0) + 1
    else:
        user.current_streak = 1

    user.last_active_date = today
    user.save(update_fields=["current_streak", "last_active_date"])


# ---------------------------------------------------------------------------
# Gating — "what is this user allowed to do right now?"
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class UserState:
    """Immutable snapshot of a user's gating state (dict-serialisable)."""

    pretest_completed: bool
    unlocked_module_ids: list[int]
    next_module_id: Optional[int]
    all_modules_completed: bool
    posttest_completed: bool
    usability_completed: bool

    def as_dict(self) -> dict:
        return {
            "pretest_completed": self.pretest_completed,
            "unlocked_module_ids": self.unlocked_module_ids,
            "next_module_id": self.next_module_id,
            "all_modules_completed": self.all_modules_completed,
            "posttest_completed": self.posttest_completed,
            "usability_completed": self.usability_completed,
        }


def _has_submitted_attempt(user: "User", *, assessment_type: str) -> bool:
    """True if the user has a *submitted* attempt of the given assessment type."""
    from assessments.models import Attempt

    return Attempt.objects.filter(
        user=user,
        assessment__assessment_type=assessment_type,
        submitted_at__isnull=False,
    ).exists()


def get_user_state(user: "User") -> UserState:
    """
    Compute the authoritative gating snapshot for ``user``.

    Rules (enforced server-side, always):
      1. No module is accessible until the pre-test has a submitted Attempt.
      2. Modules unlock strictly in ``sequence_no`` order: module n unlocks only
         when module n-1's Progress.status == 'completed'. Module 1 unlocks as
         soon as the pre-test is submitted.
      3. The post-test is inaccessible until all published modules are completed.
      4. The usability questionnaire is inaccessible until the post-test is
         submitted.
    """
    from content.models import Module
    from progress.models import Progress

    pretest_completed = _has_submitted_attempt(user, assessment_type="pretest")
    posttest_completed = _has_submitted_attempt(user, assessment_type="posttest")
    usability_completed = _has_submitted_attempt(user, assessment_type="usability")

    modules = list(Module.objects.filter(is_published=True).order_by("sequence_no"))

    completed_ids = set(
        Progress.objects.filter(
            user=user, module__in=modules, status=Progress.Status.COMPLETED
        ).values_list("module_id", flat=True)
    )

    unlocked_ids: list[int] = []
    next_module_id: Optional[int] = None

    if pretest_completed:
        # Walk modules in order; a module is unlocked if it's the first, or the
        # previous module is completed. Stop unlocking once we hit a module
        # whose predecessor is not yet complete.
        prev_completed = True
        for module in modules:
            if prev_completed:
                unlocked_ids.append(module.id)
                if module.id not in completed_ids and next_module_id is None:
                    next_module_id = module.id
            prev_completed = module.id in completed_ids

    all_modules_completed = bool(modules) and all(
        m.id in completed_ids for m in modules
    )

    return UserState(
        pretest_completed=pretest_completed,
        unlocked_module_ids=unlocked_ids,
        next_module_id=next_module_id,
        all_modules_completed=all_modules_completed,
        posttest_completed=posttest_completed,
        usability_completed=usability_completed,
    )


def is_module_accessible(user: "User", module_id: int) -> bool:
    """A module is accessible iff it appears in the unlocked set."""
    return module_id in get_user_state(user).unlocked_module_ids


def can_take_pretest(user: "User") -> bool:
    """Pre-test allowed only if not already submitted (one attempt)."""
    return not _has_submitted_attempt(user, assessment_type="pretest")


def can_take_posttest(user: "User") -> bool:
    """Post-test allowed only once all modules are complete and not yet taken."""
    state = get_user_state(user)
    return state.all_modules_completed and not state.posttest_completed


def can_take_usability(user: "User") -> bool:
    """Usability survey allowed only after the post-test is submitted."""
    state = get_user_state(user)
    return state.posttest_completed and not state.usability_completed


def can_take_quiz(user: "User", module_id: int) -> bool:
    """A module's quiz is accessible whenever the module itself is."""
    return is_module_accessible(user, module_id)


# ---------------------------------------------------------------------------
# Ethical Reasoning Profile — per-dimension aggregation
# ---------------------------------------------------------------------------
def record_dimension_delta(
    user: "User",
    *,
    dimension: str,
    source: str,
    score: Decimal,
    max_possible: Decimal,
) -> None:
    """
    Add to (or create) the running DimensionScore for (user, dimension, source).

    Used by the learning phase where multiple scenario choices accumulate into
    a single ``source='learning'`` total per dimension.
    """
    from progress.models import DimensionScore

    obj, created = DimensionScore.objects.get_or_create(
        user=user,
        dimension=dimension,
        source=source,
        defaults={"score": score, "max_possible": max_possible},
    )
    if not created:
        obj.score = (obj.score or Decimal("0")) + score
        obj.max_possible = (obj.max_possible or Decimal("0")) + max_possible
        obj.save(update_fields=["score", "max_possible", "updated_at"])


def recompute_dimension_scores(user: "User", source: str) -> dict[str, dict]:
    """
    Aggregate a user's DimensionScore rows for one ``source`` into a per-dimension
    map. Feeds the radar-chart / profile endpoints.

    Returns ``{dimension: {"score": Decimal, "max": Decimal}}`` for every one of
    the six canonical DIMENSIONS (missing rows report as 0/0).
    """
    from progress.models import DimensionScore

    rows = DimensionScore.objects.filter(user=user, source=source)
    by_dim = {r.dimension: r for r in rows}

    result: dict[str, dict] = {}
    for dim in DIMENSIONS:
        row = by_dim.get(dim)
        result[dim] = {
            "score": row.score if row else Decimal("0"),
            "max": row.max_possible if row else Decimal("0"),
        }
    return result


@transaction.atomic
def set_dimension_scores_from_assessment(
    user: "User", *, source: str, totals: dict[str, dict]
) -> None:
    """
    Overwrite a user's DimensionScore rows for a pretest/posttest ``source`` with
    freshly computed totals.

    Pre/post-tests are single-attempt snapshots, so we replace rather than
    accumulate — guaranteeing exactly one authoritative score per dimension per
    test, which is what the O1 X O2 growth comparison relies on.
    """
    from progress.models import DimensionScore

    for dimension, agg in totals.items():
        DimensionScore.objects.update_or_create(
            user=user,
            dimension=dimension,
            source=source,
            defaults={
                "score": agg["score"],
                "max_possible": agg["max"],
            },
        )


def _percent(score: Decimal, maximum: Decimal) -> Optional[int]:
    """Percentage helper; None when there is no maximum (avoids divide-by-zero)."""
    if not maximum or maximum == 0:
        return None
    return int(round((Decimal(score) / Decimal(maximum)) * 100))


def build_profile(user: "User") -> dict:
    """
    Assemble the Ethical Reasoning Profile — the data contract for the radar
    chart. For each of the six DIMENSIONS returns pretest / current(learning) /
    posttest score-max-percent blocks; posttest is null until it is taken.
    """
    from common.constants import DIMENSION_CHOICES

    labels = dict(DIMENSION_CHOICES)
    pre = recompute_dimension_scores(user, "pretest")
    learn = recompute_dimension_scores(user, "learning")
    post = recompute_dimension_scores(user, "posttest")

    has_pretest = _has_submitted_attempt(user, assessment_type="pretest")
    has_posttest = _has_submitted_attempt(user, assessment_type="posttest")

    dimensions = []
    for dim in DIMENSIONS:
        block = {
            "dimension": dim,
            "label": labels.get(dim, dim),
            "pretest": None,
            "current": {
                "score": learn[dim]["score"],
                "max": learn[dim]["max"],
                "percent": _percent(learn[dim]["score"], learn[dim]["max"]),
            },
            "posttest": None,
        }
        if has_pretest:
            block["pretest"] = {
                "score": pre[dim]["score"],
                "max": pre[dim]["max"],
                "percent": _percent(pre[dim]["score"], pre[dim]["max"]),
            }
        if has_posttest:
            block["posttest"] = {
                "score": post[dim]["score"],
                "max": post[dim]["max"],
                "percent": _percent(post[dim]["score"], post[dim]["max"]),
            }
        dimensions.append(block)

    return {
        "dimensions": dimensions,
        "has_pretest": has_pretest,
        "has_posttest": has_posttest,
    }


def build_growth(user: "User") -> dict:
    """
    Pre-test vs post-test comparison per dimension plus overall totals and gain.

    Raises ConflictError (409) if the post-test has not been submitted — there is
    no growth to report without O2.
    """
    from common.constants import DIMENSION_CHOICES
    from common.exceptions import ConflictError

    if not _has_submitted_attempt(user, assessment_type="posttest"):
        raise ConflictError(
            detail="Post-test not submitted; no growth data available.",
            code="posttest_required",
        )

    labels = dict(DIMENSION_CHOICES)
    pre = recompute_dimension_scores(user, "pretest")
    post = recompute_dimension_scores(user, "posttest")

    dimensions = []
    pre_total = Decimal("0")
    post_total = Decimal("0")
    for dim in DIMENSIONS:
        pre_score = Decimal(pre[dim]["score"])
        post_score = Decimal(post[dim]["score"])
        pre_total += pre_score
        post_total += post_score
        gain = post_score - pre_score
        pre_pct = _percent(pre_score, pre[dim]["max"]) or 0
        post_pct = _percent(post_score, post[dim]["max"]) or 0
        dimensions.append(
            {
                "dimension": dim,
                "label": labels.get(dim, dim),
                "pretest_score": pre_score,
                "posttest_score": post_score,
                "gain": gain,
                "percent_gain": post_pct - pre_pct,
            }
        )

    return {
        "dimensions": dimensions,
        "overall": {
            "pretest_total": pre_total,
            "posttest_total": post_total,
            "gain": post_total - pre_total,
            "percent_gain": (
                int(round(((post_total - pre_total) / pre_total) * 100))
                if pre_total
                else None
            ),
        },
    }


@transaction.atomic
def create_reflection(user: "User", *, module, response_text: str):
    """
    Store a module reflection (min 50 chars, one per module).

    Raises GatingError for too-short text and ConflictError on a duplicate — the
    (user, module) unique constraint guarantees one reflection per module.
    """
    from django.db import IntegrityError

    from common.exceptions import ConflictError, GatingError
    from progress.models import Reflection

    text = (response_text or "").strip()
    if len(text) < 50:
        raise GatingError(
            detail="Reflection must be at least 50 characters.",
            code="reflection_too_short",
        )

    # Serve the authored prompt from the module; fall back to a generic prompt
    # only if content has not set one.
    prompt = module.reflection_prompt or (
        f"Reflect on what you learned in '{module.title}'."
    )
    try:
        return Reflection.objects.create(
            user=user, module=module, prompt_text=prompt, response_text=text
        )
    except IntegrityError:
        raise ConflictError(detail="You have already reflected on this module.")
