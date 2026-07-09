"""
Domain exceptions used by the service layer.

Services raise these instead of returning HTTP responses, keeping business logic
free of web concerns. Thin views translate them to status codes.
"""
from __future__ import annotations

from rest_framework import status
from rest_framework.exceptions import APIException


class GatingError(APIException):
    """Raised when a user attempts an action the gating rules forbid (-> 403)."""

    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "This step is not yet available."
    default_code = "gating_forbidden"


class ConflictError(APIException):
    """Raised on duplicate/idempotency violations (-> 409), e.g. a second attempt."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "This action has already been performed."
    default_code = "conflict"
