"""
Researcher/admin API views — all gated by IsAdminRole. Students receive 403.
Thin: delegates to accounts.admin_services.
"""
from __future__ import annotations

from django.http import StreamingHttpResponse
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsAdminRole

from .admin_services import aggregate_stats, export_csv, list_participants


class ParticipantsView(APIView):
    """GET /api/admin/participants/ — per-student summary (admin only)."""

    permission_classes = [IsAdminRole]

    def get(self, request: Request) -> Response:
        return Response(list_participants())


class StatsView(APIView):
    """GET /api/admin/stats/ — study-level aggregates (admin only)."""

    permission_classes = [IsAdminRole]

    def get(self, request: Request) -> Response:
        return Response(aggregate_stats())


class ExportView(APIView):
    """
    GET /api/admin/export/?dataset=scores|responses|usability|reflections
    Streams anonymised CSV for SPSS (admin only).
    """

    permission_classes = [IsAdminRole]

    def get(self, request: Request) -> StreamingHttpResponse | Response:
        dataset = request.query_params.get("dataset", "scores")
        try:
            stream = export_csv(dataset)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)

        response = StreamingHttpResponse(stream, content_type="text/csv")
        response["Content-Disposition"] = (
            f'attachment; filename="ethical_ai_{dataset}.csv"'
        )
        return response
