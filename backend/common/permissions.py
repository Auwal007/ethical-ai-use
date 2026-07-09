"""
Custom DRF permission classes.

Access-control rule for the whole API: students may only ever touch *their own*
data, which is enforced by queryset filtering on ``request.user`` in the views —
never by trusting a client-supplied user id. These classes gate the
researcher/admin surface.
"""
from __future__ import annotations

from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView


class IsAdminRole(BasePermission):
    """
    Allow only authenticated users whose ``role == 'admin'``.

    Role is assigned server-side at creation and never accepted from a client,
    so this is a trustworthy check for the researcher-only endpoints
    (participant listing, aggregate stats, anonymised CSV export).
    """

    message = "Administrator role required."

    def has_permission(self, request: Request, view: APIView) -> bool:
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) == "admin"
        )
