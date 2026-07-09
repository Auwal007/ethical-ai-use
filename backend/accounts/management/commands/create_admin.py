"""
Management command: create (or update) a superuser from environment variables.

Render (and most PaaS hosts) run non-interactively, so ``createsuperuser``
cannot prompt. This command reads the credentials from env vars and is safe to
run on every deploy — it is idempotent (won't error if the admin already
exists).

Env vars:
    DJANGO_ADMIN_EMAIL     (required)
    DJANGO_ADMIN_PASSWORD  (required)
    DJANGO_ADMIN_NAME      (optional, default "Administrator")
"""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

import environ

env = environ.Env()


class Command(BaseCommand):
    help = "Create a superuser from DJANGO_ADMIN_* environment variables (idempotent)."

    def handle(self, *args, **options) -> None:
        email = env("DJANGO_ADMIN_EMAIL", default=None)
        password = env("DJANGO_ADMIN_PASSWORD", default=None)
        full_name = env("DJANGO_ADMIN_NAME", default="Administrator")

        if not email or not password:
            raise CommandError(
                "DJANGO_ADMIN_EMAIL and DJANGO_ADMIN_PASSWORD must both be set."
            )

        User = get_user_model()
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "full_name": full_name,
                "role": "admin",
                "is_staff": True,
                "is_superuser": True,
            },
        )

        # Always ensure the account can actually administer the site and has
        # the configured password (useful for password rotation on redeploy).
        user.full_name = user.full_name or full_name
        user.role = "admin"
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()

        verb = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{verb} superuser: {email}"))
