"""
Assessment engine: submission + scoring + per-dimension aggregation, plus the
instrument-parity check.

Scoring is the quantitative heart of the study (Chapter 5), so it is isolated
here and unit-tested. Two rules only:
  * mcq    -> item_score = max_score if answer == correct_answer else 0
  * likert -> item_score = the Likert value itself (1–5); attitudinal, not
              right/wrong.
Per-dimension totals feed the Ethical Reasoning Profile with the source that
matches the assessment type (pretest/posttest, or 'learning' for quizzes;
usability contributes to no dimension).
"""
from __future__ import annotations

from decimal import Decimal, InvalidOperation
from typing import TYPE_CHECKING, Optional

from django.db import IntegrityError, transaction
from django.utils import timezone

from common.constants import DIMENSIONS
from common.exceptions import ConflictError, GatingError

if TYPE_CHECKING:
    from accounts.models import Assessment  # noqa: F401
    from accounts.models import User


# Map an assessment type to the DimensionScore source it contributes to.
# Quizzes accrue to the running 'learning' profile; usability contributes
# nothing (it measures the tool, not the participant's ethics).
_SOURCE_BY_TYPE = {
    "pretest": "pretest",
    "posttest": "posttest",
    "quiz": "learning",
    "usability": None,
}


def score_item(question, answer: str) -> Decimal:
    """
    Score a single response. Pure function — no DB writes — so it is trivially
    unit-testable in isolation.

    * mcq    -> max_score if answer matches correct_answer, else 0.
    * likert -> the selected value (1–5). Reverse-scored items (negatively
                worded usability statements 7 & 14) are inverted to 6 - raw so
                that a high score always means a positive evaluation. The RAW
                selection is still what gets stored in Response.answer; only the
                item_score is inverted.
    """
    if question.question_type == "mcq":
        if question.correct_answer is not None and answer == question.correct_answer:
            return Decimal(question.max_score)
        return Decimal("0")

    # likert: the value itself is the score (1–5). Non-numeric answers score 0.
    try:
        raw = int(str(answer).strip())
    except (ValueError, InvalidOperation):
        return Decimal("0")

    if getattr(question, "reverse_scored", False):
        return Decimal(6 - raw)
    return Decimal(raw)


@transaction.atomic
def submit_assessment(
    user: "User", *, assessment, responses: list[dict]
) -> dict:
    """
    Create the single Attempt for (user, assessment), score every response, set
    the total and submitted_at, and roll scores up into per-dimension totals.

    Wrapped in a transaction. The (user, assessment) unique constraint is caught
    and surfaced as a 409 (ConflictError) rather than a 500 — this enforces
    exactly one pre-test and one post-test per participant, protecting the
    O1 X O2 design.

    Returns total_score, max_possible, the updated user state, and — for quizzes
    only — per-question feedback. Feedback is *never* returned for pre/post-test
    submissions, which would contaminate the paired instrument.
    """
    from assessments.models import Attempt, Question, Response
    from progress.services import (
        get_user_state,
        record_dimension_delta,
        set_dimension_scores_from_assessment,
    )

    # One attempt only.
    try:
        attempt = Attempt.objects.create(user=user, assessment=assessment)
    except IntegrityError:
        raise ConflictError(
            detail="You have already submitted this assessment.",
            code="attempt_exists",
        )

    # Index questions belonging to this assessment.
    questions = {q.id: q for q in assessment.questions.all()}

    total = Decimal("0")
    max_possible = Decimal("0")
    # Per-dimension running totals for this submission.
    dim_totals: dict[str, dict[str, Decimal]] = {
        d: {"score": Decimal("0"), "max": Decimal("0")} for d in DIMENSIONS
    }
    feedback: list[dict] = []

    seen_question_ids: set[int] = set()
    for item in responses:
        qid = item.get("question_id")
        answer = str(item.get("answer", ""))
        question = questions.get(qid)
        if question is None:
            raise GatingError(
                detail=f"Question {qid} is not part of this assessment.",
                code="invalid_question",
            )
        if qid in seen_question_ids:
            raise GatingError(
                detail=f"Duplicate answer for question {qid}.",
                code="duplicate_response",
            )
        seen_question_ids.add(qid)

        item_score = score_item(question, answer)
        Response.objects.create(
            attempt=attempt,
            question=question,
            answer=answer,
            item_score=item_score,
        )

        total += item_score
        # Max for likert is 5 (the top of the scale); for mcq it's max_score.
        item_max = (
            Decimal("5")
            if question.question_type == "likert"
            else Decimal(question.max_score)
        )
        max_possible += item_max

        if question.dimension in dim_totals:
            dim_totals[question.dimension]["score"] += item_score
            dim_totals[question.dimension]["max"] += item_max

        # Quiz feedback only — never for pre/post-test. The explanatory text is
        # authored content served from the DB (feedback_correct /
        # feedback_incorrect), not hard-coded here.
        if assessment.assessment_type == "quiz":
            is_correct = (
                question.question_type == "mcq"
                and answer == question.correct_answer
            )
            feedback.append(
                {
                    "question_id": question.id,
                    "correct": is_correct,
                    "item_score": item_score,
                    "explanation": (
                        question.feedback_correct
                        if is_correct
                        else question.feedback_incorrect
                    ),
                }
            )

    attempt.total_score = total
    attempt.submitted_at = timezone.now()
    attempt.save(update_fields=["total_score", "submitted_at"])

    # Roll dimension scores into the profile with the appropriate source.
    source = _SOURCE_BY_TYPE.get(assessment.assessment_type)
    if source in ("pretest", "posttest"):
        # Snapshot semantics: overwrite the single authoritative row per dim.
        set_dimension_scores_from_assessment(user, source=source, totals=dim_totals)
    elif source == "learning":
        # Accumulate: a quiz adds to the running learning profile.
        for dim, agg in dim_totals.items():
            if agg["max"] > 0:
                record_dimension_delta(
                    user,
                    dimension=dim,
                    source="learning",
                    score=agg["score"],
                    max_possible=agg["max"],
                )
    # usability (source is None): contributes to no dimension.

    result = {
        "total_score": total,
        "max_possible": max_possible,
        "user_state": get_user_state(user).as_dict(),
    }
    if assessment.assessment_type == "quiz":
        result["feedback"] = feedback
    return result


def verify_instrument_parity() -> list[str]:
    """
    Check that the pre-test and post-test measure the *same* construct.

    Returns a list of human-readable problems (empty == parity holds); the
    management command turns any non-empty list into a hard, non-zero exit and
    ``seed_content`` aborts its transaction on failure.

    Parity is checked across question count and — for every ``question_order`` —
    text, type, dimension, options, correct_answer, and max_score. If the two
    instruments diverge on any of these, the pre/post gain is no longer a valid
    paired-samples comparison (it would be confounded by differing items), so a
    divergence must halt the pipeline rather than silently corrupt the analysis.
    """
    from assessments.models import Assessment

    problems: list[str] = []

    pretests = list(Assessment.objects.filter(assessment_type="pretest"))
    posttests = list(Assessment.objects.filter(assessment_type="posttest"))

    if len(pretests) != 1 or len(posttests) != 1:
        problems.append(
            f"Expected exactly one pretest and one posttest; found "
            f"{len(pretests)} pretest(s) and {len(posttests)} posttest(s)."
        )
        return problems

    pre_q = list(pretests[0].questions.order_by("question_order"))
    post_q = list(posttests[0].questions.order_by("question_order"))

    if len(pre_q) != len(post_q):
        problems.append(
            f"Question count differs: pretest has {len(pre_q)}, "
            f"posttest has {len(post_q)}."
        )
        return problems

    for p, q in zip(pre_q, post_q):
        order = p.question_order
        if p.question_order != q.question_order:
            problems.append(
                f"Order mismatch: pretest #{p.question_order} vs "
                f"posttest #{q.question_order}."
            )
        if p.question_text.strip() != q.question_text.strip():
            problems.append(
                f"Text mismatch at order {order}:\n"
                f"    pretest : {p.question_text.strip()!r}\n"
                f"    posttest: {q.question_text.strip()!r}"
            )
        if p.question_type != q.question_type:
            problems.append(
                f"Type mismatch at order {order}: "
                f"'{p.question_type}' vs '{q.question_type}'."
            )
        if p.dimension != q.dimension:
            problems.append(
                f"Dimension mismatch at order {order}: "
                f"'{p.dimension}' vs '{q.dimension}'."
            )
        if p.options != q.options:
            problems.append(
                f"Options mismatch at order {order}:\n"
                f"    pretest : {p.options!r}\n"
                f"    posttest: {q.options!r}"
            )
        if p.correct_answer != q.correct_answer:
            problems.append(
                f"Correct-answer mismatch at order {order}: "
                f"{p.correct_answer!r} vs {q.correct_answer!r}."
            )
        if p.max_score != q.max_score:
            problems.append(
                f"Max-score mismatch at order {order}: "
                f"{p.max_score} vs {q.max_score}."
            )

    return problems
