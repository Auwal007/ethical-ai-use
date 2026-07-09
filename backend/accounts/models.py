"""
Account models: the custom participant/User and their research consent record.
"""
from __future__ import annotations

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user representing a study participant (or the researcher/admin).

    Email is the login identifier (``USERNAME_FIELD``) rather than a separate
    username — participants are undergraduates who register with their email.
    The demographic fields (faculty, level_of_study, prior_ai_exposure) are
    captured for the quantitative analysis of the study.
    """

    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        ADMIN = "admin", "Admin"

    class PriorAIExposure(models.TextChoices):
        NONE = "none", "None"
        BASIC = "basic", "Basic"
        REGULAR = "regular", "Regular"
        ADVANCED = "advanced", "Advanced"

    full_name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
    )

    # Research demographics (optional).
    faculty = models.CharField(max_length=120, blank=True)
    level_of_study = models.CharField(max_length=20, blank=True)
    prior_ai_exposure = models.CharField(
        max_length=20,
        choices=PriorAIExposure.choices,
        blank=True,
    )

    # Gamification / engagement tracking.
    current_streak = models.PositiveIntegerField(default=0)
    last_active_date = models.DateField(null=True, blank=True)

    # Django admin/auth flags.
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.full_name} <{self.email}>"


class ConsentRecord(models.Model):
    """
    Records a participant's informed consent to take part in the study.

    OneToOne with User because a participant gives consent exactly once; the
    ``consent_version`` lets us track which revision of the consent form they
    agreed to (important for research-ethics auditing).
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="consent",
    )
    consent_version = models.CharField(max_length=20)
    agreed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Consent v{self.consent_version} — {self.user.email}"
