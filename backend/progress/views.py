"""Thin views for the Ethical Reasoning Profile and reflections."""
from __future__ import annotations

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from content.models import Module

from .models import Reflection
from .serializers import ReflectionCreateSerializer, ReflectionSerializer
from .services import build_growth, build_profile, create_reflection


class ProfileView(APIView):
    """GET /api/profile/ — the radar-chart data contract."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        return Response(build_profile(request.user))


class ProfileGrowthView(APIView):
    """GET /api/profile/growth/ — pretest vs posttest; 409 if no post-test."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        return Response(build_growth(request.user))


class ReflectionCreateView(APIView):
    """
    /api/modules/<id>/reflection/
      GET  — the authored reflection prompt for the module (+ whether answered).
      POST — submit the reflection (one per module).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, module_id: int) -> Response:
        module = get_object_or_404(Module, id=module_id, is_published=True)
        return Response(
            {
                "module": module.id,
                "prompt_text": module.reflection_prompt,
                "already_submitted": Reflection.objects.filter(
                    user=request.user, module=module
                ).exists(),
            }
        )

    def post(self, request: Request, module_id: int) -> Response:
        module = get_object_or_404(Module, id=module_id, is_published=True)
        serializer = ReflectionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reflection = create_reflection(
            request.user,
            module=module,
            response_text=serializer.validated_data["response_text"],
        )
        return Response(
            ReflectionSerializer(reflection).data, status=status.HTTP_201_CREATED
        )


class ReflectionListView(APIView):
    """GET /api/reflections/ — the requesting user's own reflections."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        # Queryset filtered to request.user — students see only their own data.
        reflections = (
            Reflection.objects.filter(user=request.user)
            .select_related("module")
            .order_by("created_at")
        )
        return Response(ReflectionSerializer(reflections, many=True).data)
