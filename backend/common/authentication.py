"""
JWT authentication that also records activity.

We subclass SimpleJWT's ``JWTAuthentication`` so that *every* successfully
authenticated request updates the user's streak/last-active date. This is the
reliable hook for "on any authenticated request, update activity" — it fires
exactly when (and only when) a valid token resolves to a user, regardless of
which view is being called. Same-day calls are a no-op (see touch_activity).
"""
from __future__ import annotations

from typing import Optional

from rest_framework.request import Request
from rest_framework_simplejwt.authentication import JWTAuthentication


class ActivityTrackingJWTAuthentication(JWTAuthentication):
    def authenticate(self, request: Request) -> Optional[tuple]:
        result = super().authenticate(request)
        if result is not None:
            user, _token = result
            try:
                from progress.services import touch_activity

                touch_activity(user)
            except Exception:
                # Activity tracking must never break authentication.
                pass
        return result
