"""
Thin authentication views. All logic delegates to accounts.services and the
SimpleJWT token machinery.
"""
from __future__ import annotations

from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    LoginSerializer,
    MeSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .services import get_me_payload, register_participant


def _tokens_for(user) -> dict[str, str]:
    """Issue a fresh access/refresh pair for a user."""
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class RegisterView(APIView):
    """POST /api/auth/register/ — create participant + consent, return JWTs."""

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = register_participant(
            full_name=data["full_name"],
            email=data["email"],
            password=data["password"],
            consent_agreed=data["consent_agreed"],
            consent_version=data["consent_version"],
            faculty=data.get("faculty", ""),
            level_of_study=data.get("level_of_study", ""),
            prior_ai_exposure=data.get("prior_ai_exposure", ""),
        )
        return Response(
            {"user": UserSerializer(user).data, **_tokens_for(user)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """POST /api/auth/login/ — email + password -> JWT pair + user."""

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response({"user": UserSerializer(user).data, **_tokens_for(user)})


class MeView(APIView):
    """GET /api/auth/me/ — current user with computed streak & gating flags."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        payload = get_me_payload(request.user)
        return Response(MeSerializer(payload).data)
