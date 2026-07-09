"""
Researcher/admin services: participant summaries, aggregate statistics, and the
anonymised CSV exports for SPSS.

Anonymisation is a hard requirement (NFR3) and a legal duty under the Nigeria
Data Protection Act 2023 (data minimisation). Exports therefore use a stable
pseudonymous ``participant_id`` (P001, P002, …) derived from a deterministic
ordering, and NEVER emit a name or email.
"""
from __future__ import annotations

import csv
from decimal import Decimal
from typing import Iterator, Optional

from django.db.models import Avg

from common.constants import DIMENSION_CHOICES, DIMENSIONS


def _pseudonym_map() -> dict[int, str]:
    """
    Build a stable {user_id: 'P001'} map over all students, ordered by id.

    Ordering by primary key is deterministic, so the same participant always
    receives the same code across every export/dataset in the study.
    """
    from accounts.models import User

    ids = (
        User.objects.filter(role=User.Role.STUDENT)
        .order_by("id")
        .values_list("id", flat=True)
    )
    return {uid: f"P{index:03d}" for index, uid in enumerate(ids, start=1)}


def _submitted_total(user_id: int, assessment_type: str) -> Optional[Decimal]:
    """Total score of a user's submitted attempt of a type, or None."""
    from assessments.models import Attempt

    attempt = (
        Attempt.objects.filter(
            user_id=user_id,
            assessment__assessment_type=assessment_type,
            submitted_at__isnull=False,
        )
        .values_list("total_score", flat=True)
        .first()
    )
    return attempt


def list_participants() -> list[dict]:
    """
    Summarise every student: consent, pretest/posttest completion + totals,
    modules completed, and the computed gain. Names/emails are included here
    because this endpoint is admin-only and behind IsAdminRole; the CSV export
    (which may leave the building) is the anonymised surface.
    """
    from accounts.models import User
    from progress.models import Progress

    rows: list[dict] = []
    students = User.objects.filter(role=User.Role.STUDENT).order_by("id")
    for user in students:
        pre = _submitted_total(user.id, "pretest")
        post = _submitted_total(user.id, "posttest")
        gain = (post - pre) if (pre is not None and post is not None) else None
        rows.append(
            {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "faculty": user.faculty,
                "level_of_study": user.level_of_study,
                "prior_ai_exposure": user.prior_ai_exposure,
                "has_consent": hasattr(user, "consent"),
                "pretest_completed": pre is not None,
                "posttest_completed": post is not None,
                "pretest_total": pre,
                "posttest_total": post,
                "gain": gain,
                "modules_completed": Progress.objects.filter(
                    user=user, status=Progress.Status.COMPLETED
                ).count(),
            }
        )
    return rows


def aggregate_stats() -> dict:
    """Study-level aggregates for the researcher dashboard."""
    from accounts.models import User
    from assessments.models import Attempt
    from content.models import Module
    from progress.models import DimensionScore, Progress

    total_students = User.objects.filter(role=User.Role.STUDENT).count()
    published_modules = Module.objects.filter(is_published=True).count()

    pretest_done = (
        Attempt.objects.filter(
            assessment__assessment_type="pretest", submitted_at__isnull=False
        )
        .values("user")
        .distinct()
        .count()
    )
    posttest_done = (
        Attempt.objects.filter(
            assessment__assessment_type="posttest", submitted_at__isnull=False
        )
        .values("user")
        .distinct()
        .count()
    )

    completed_all = 0
    if published_modules:
        for user in User.objects.filter(role=User.Role.STUDENT):
            if (
                Progress.objects.filter(
                    user=user, status=Progress.Status.COMPLETED
                ).count()
                == published_modules
            ):
                completed_all += 1

    mean_pre = Attempt.objects.filter(
        assessment__assessment_type="pretest", submitted_at__isnull=False
    ).aggregate(m=Avg("total_score"))["m"]
    mean_post = Attempt.objects.filter(
        assessment__assessment_type="posttest", submitted_at__isnull=False
    ).aggregate(m=Avg("total_score"))["m"]
    mean_gain = (
        (mean_post - mean_pre)
        if (mean_pre is not None and mean_post is not None)
        else None
    )

    labels = dict(DIMENSION_CHOICES)
    per_dimension = []
    for dim in DIMENSIONS:
        pre_mean = DimensionScore.objects.filter(
            dimension=dim, source="pretest"
        ).aggregate(m=Avg("score"))["m"]
        post_mean = DimensionScore.objects.filter(
            dimension=dim, source="posttest"
        ).aggregate(m=Avg("score"))["m"]
        per_dimension.append(
            {
                "dimension": dim,
                "label": labels[dim],
                "mean_pretest": pre_mean,
                "mean_posttest": post_mean,
            }
        )

    return {
        "total_students": total_students,
        "pretest_completed": pretest_done,
        "posttest_completed": posttest_done,
        "completed_all_modules": completed_all,
        "completion_rate": (
            round((completed_all / total_students) * 100, 1) if total_students else 0
        ),
        "mean_pretest": mean_pre,
        "mean_posttest": mean_post,
        "mean_gain": mean_gain,
        "per_dimension": per_dimension,
    }


# ---------------------------------------------------------------------------
# CSV exports — anonymised, streamed. Each returns a generator of rows.
# ---------------------------------------------------------------------------
class _Echo:
    """A file-like object whose write() returns the value — for streaming csv."""

    def write(self, value: str) -> str:
        return value


def _dimension_columns(prefix: str) -> list[str]:
    return [f"{prefix}_{dim}" for dim in DIMENSIONS]


_EXPORTERS = {
    "scores": "_export_scores",
    "responses": "_export_responses",
    "usability": "_export_usability",
    "reflections": "_export_reflections",
}


def export_csv(dataset: str) -> Iterator[str]:
    """
    Return a generator of CSV lines for the requested dataset. Raises ValueError
    *eagerly* (before any streaming) for an unknown dataset, so the view can turn
    it into a 400 rather than starting a 200 response it can't undo. Every
    dataset keys on the pseudonymous participant_id only.
    """
    if dataset not in _EXPORTERS:
        raise ValueError(f"Unknown dataset: {dataset}")

    def _stream() -> Iterator[str]:
        writer = csv.writer(_Echo())
        pseudo = _pseudonym_map()
        exporter = globals()[_EXPORTERS[dataset]]
        yield from exporter(writer, pseudo)

    return _stream()


def _dimension_score_map(user_id: int, source: str) -> dict[str, Decimal]:
    from progress.models import DimensionScore

    return {
        r.dimension: r.score
        for r in DimensionScore.objects.filter(user_id=user_id, source=source)
    }


def _export_scores(writer, pseudo: dict[int, str]) -> Iterator[str]:
    header = (
        [
            "participant_id",
            "faculty",
            "level",
            "prior_ai_exposure",
            "pretest_total",
            "posttest_total",
            "gain",
        ]
        + _dimension_columns("pretest")
        + _dimension_columns("posttest")
    )
    yield writer.writerow(header)

    from accounts.models import User

    for user in User.objects.filter(role=User.Role.STUDENT).order_by("id"):
        pid = pseudo[user.id]
        pre = _submitted_total(user.id, "pretest")
        post = _submitted_total(user.id, "posttest")
        gain = (post - pre) if (pre is not None and post is not None) else ""
        pre_dims = _dimension_score_map(user.id, "pretest")
        post_dims = _dimension_score_map(user.id, "posttest")
        row = (
            [
                pid,
                user.faculty,
                user.level_of_study,
                user.prior_ai_exposure,
                pre if pre is not None else "",
                post if post is not None else "",
                gain,
            ]
            + [pre_dims.get(d, "") for d in DIMENSIONS]
            + [post_dims.get(d, "") for d in DIMENSIONS]
        )
        yield writer.writerow(row)


def _export_responses(writer, pseudo: dict[int, str]) -> Iterator[str]:
    yield writer.writerow(
        [
            "participant_id",
            "assessment_type",
            "question_order",
            "dimension",
            "answer",
            "item_score",
        ]
    )
    from assessments.models import Response

    responses = (
        Response.objects.select_related("attempt__user", "question", "attempt__assessment")
        .filter(attempt__user__role="student")
        .order_by("attempt__user_id", "attempt__assessment_id", "question__question_order")
    )
    for r in responses:
        uid = r.attempt.user_id
        if uid not in pseudo:
            continue
        yield writer.writerow(
            [
                pseudo[uid],
                r.attempt.assessment.assessment_type,
                r.question.question_order,
                r.question.dimension,
                r.answer,
                r.item_score if r.item_score is not None else "",
            ]
        )


def _export_usability(writer, pseudo: dict[int, str]) -> Iterator[str]:
    """
    Usability export emits BOTH the raw Likert selection (``likert_value``) and
    the ``scored_value`` used for analysis. For reverse-scored (negatively
    worded) items the scored value is 6 - raw, so that across every item a
    higher scored value consistently means a more positive evaluation — SPSS can
    then average items within a domain without per-item sign handling.
    """
    yield writer.writerow(
        ["participant_id", "question_order", "dimension", "likert_value", "scored_value"]
    )
    from assessments.models import Response

    responses = (
        Response.objects.select_related("attempt__user", "question")
        .filter(
            attempt__assessment__assessment_type="usability",
            attempt__user__role="student",
        )
        .order_by("attempt__user_id", "question__question_order")
    )
    for r in responses:
        uid = r.attempt.user_id
        if uid not in pseudo:
            continue
        raw = r.answer
        try:
            raw_int = int(str(raw).strip())
            scored = 6 - raw_int if r.question.reverse_scored else raw_int
        except (ValueError, TypeError):
            scored = ""
        yield writer.writerow(
            [
                pseudo[uid],
                r.question.question_order,
                r.question.dimension,
                raw,
                scored,
            ]
        )


def _export_reflections(writer, pseudo: dict[int, str]) -> Iterator[str]:
    yield writer.writerow(
        ["participant_id", "module_sequence", "response_text"]
    )
    from progress.models import Reflection

    reflections = (
        Reflection.objects.select_related("user", "module")
        .filter(user__role="student")
        .order_by("user_id", "module__sequence_no")
    )
    for ref in reflections:
        uid = ref.user_id
        if uid not in pseudo:
            continue
        yield writer.writerow(
            [pseudo[uid], ref.module.sequence_no, ref.response_text]
        )
