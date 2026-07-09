"""
Thin assessment views. Every fetch consults the gating service; every submit
delegates to the scoring service inside a transaction.
"""
from __future__ import annotations

from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.exceptions import GatingError
from progress.services import (
    can_take_posttest,
    can_take_pretest,
    can_take_quiz,
    can_take_usability,
)

from .models import Assessment
from .serializers import AssessmentSerializer, SubmitSerializer
from .services import submit_assessment


def _get_singleton(assessment_type: str) -> Assessment:
    """Fetch the single study-wide assessment of a type (pretest/posttest/usability)."""
    return get_object_or_404(Assessment, assessment_type=assessment_type)


def _already_submitted(user, assessment: Assessment) -> bool:
    """True if the user already has a submitted attempt for this exact assessment."""
    from .models import Attempt

    return Attempt.objects.filter(
        user=user, assessment=assessment, submitted_at__isnull=False
    ).exists()


class PretestView(APIView):
    """GET /api/assessments/pretest/ — 403 unless a pre-test may still be taken."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        if not can_take_pretest(request.user):
            raise GatingError(detail="You have already completed the pre-test.")
        assessment = _get_singleton("pretest")
        return Response(AssessmentSerializer(assessment).data)


class PosttestView(APIView):
    """GET /api/assessments/posttest/ — 403 until all modules complete."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        if not can_take_posttest(request.user):
            raise GatingError(
                detail="The post-test unlocks once all modules are completed."
            )
        assessment = _get_singleton("posttest")
        return Response(AssessmentSerializer(assessment).data)


class QuizView(APIView):
    """GET /api/assessments/quiz/<module_id>/ — module quiz; gated like the module."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, module_id: int) -> Response:
        if not can_take_quiz(request.user, module_id):
            raise GatingError(detail="This module is not accessible yet.")
        assessment = get_object_or_404(
            Assessment, assessment_type="quiz", module_id=module_id
        )
        return Response(AssessmentSerializer(assessment).data)


class UsabilityView(APIView):
    """GET /api/assessments/usability/ — 403 until the post-test is submitted."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        if not can_take_usability(request.user):
            raise GatingError(
                detail="The usability survey unlocks after the post-test."
            )
        assessment = _get_singleton("usability")
        return Response(AssessmentSerializer(assessment).data)


class SubmitView(APIView):
    """
    POST /api/assessments/<assessment_id>/submit/ — score and persist an attempt.

    Re-checks gating for the specific assessment type before accepting the
    submission, so a client cannot POST directly to bypass the fetch-time gate.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, assessment_id: int) -> Response:
        assessment = get_object_or_404(Assessment, id=assessment_id)
        self._check_gating(request.user, assessment)

        serializer = SubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = submit_assessment(
            request.user,
            assessment=assessment,
            responses=serializer.validated_data["responses"],
        )
        return Response(result)

    @staticmethod
    def _check_gating(user, assessment: Assessment) -> None:
        """
        Re-check gating at submit time.

        Note the ``_already_submitted`` escape hatch: a *duplicate* submission of
        an assessment the user already finished must surface as a 409 from the
        scoring service (the one-attempt rule), NOT a 403 from gating. So when a
        submitted attempt already exists we skip the gate and let the service
        raise ConflictError. This keeps the "submit twice -> 409" contract while
        still blocking genuinely-out-of-sequence first attempts with 403.
        """
        atype = assessment.assessment_type
        if _already_submitted(user, assessment):
            return

        if atype == "pretest" and not can_take_pretest(user):
            raise GatingError(detail="You have already completed the pre-test.")
        if atype == "posttest" and not can_take_posttest(user):
            raise GatingError(detail="The post-test is not available yet.")
        if atype == "quiz" and not can_take_quiz(user, assessment.module_id):
            raise GatingError(detail="This module is not accessible yet.")
        if atype == "usability" and not can_take_usability(user):
            raise GatingError(detail="The usability survey is not available yet.")
