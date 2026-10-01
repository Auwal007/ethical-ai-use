"""
Custom admin site for the researcher.

Renames the admin, reorders the index so Content comes before Participants, and
exposes a link to the frontend participant dashboard. Installed as Django's
``default_site`` (see common/apps.py), so every existing ``@admin.register(...)``
decorator registers against it automatically — no per-model changes needed for
the site swap.
"""
from __future__ import annotations

import os
from typing import Any

from django.contrib.admin import AdminSite
from django.http import HttpRequest


# Desired grouping of the index: Content first, then Participants. Each entry
# maps a section label to the models (by "app_label.ModelName") that belong in
# it, in display order. Models not listed fall through to a trailing section.
_SECTIONS: list[tuple[str, list[str]]] = [
    (
        "Content",
        [
            "content.Module",
            "content.ContentPage",
            "content.Scenario",
            "content.ScenarioOption",
            "assessments.Assessment",
            "assessments.Question",
        ],
    ),
    (
        "Participants",
        [
            "accounts.User",
            "accounts.ConsentRecord",
            "progress.Reflection",
            "progress.Progress",
        ],
    ),
]


class EAILSAdminSite(AdminSite):
    """Branded, reordered admin site."""

    site_header = "Ethical AI Literacy System"
    site_title = "EAILS Admin"
    index_title = "Content and Data"
    # Custom-named template (avoids self-extension of admin/index.html) that
    # adds the frontend dashboard link.
    index_template = "eails_admin/index.html"

    def each_context(self, request: HttpRequest) -> dict[str, Any]:
        """Expose the frontend dashboard URL to admin templates."""
        context = super().each_context(request)
        # Frontend researcher dashboard (participant monitoring + CSV export).
        context["participant_dashboard_url"] = os.environ.get(
            "FRONTEND_ADMIN_URL",
            os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000") + "/admin",
        )
        return context

    def get_app_list(self, request: HttpRequest, app_label: str | None = None) -> list:
        """
        Reorder the index into Content → Participants sections.

        We flatten Django's per-app grouping and regroup by the sections above.
        Any model not explicitly placed is appended under an "Other" heading so
        nothing silently disappears.

        For a single-app page (app_label given), we keep Django's default
        app-shaped output so those pages render normally.
        """
        if app_label is not None:
            return super().get_app_list(request, app_label)

        app_dict = self._build_app_dict(request, app_label)

        # Index every model by "app_label.object_name" for lookup.
        model_index: dict[str, dict] = {}
        for app in app_dict.values():
            for model in app["models"]:
                key = f"{app['app_label']}.{model['object_name']}"
                model_index[key] = model

        used: set[str] = set()
        result: list[dict] = []

        for section_name, keys in _SECTIONS:
            models = []
            for key in keys:
                model = model_index.get(key)
                if model is not None:
                    models.append(model)
                    used.add(key)
            if models:
                result.append(
                    {
                        "name": section_name,
                        "app_label": section_name.lower().replace(" ", "_"),
                        "app_url": "",
                        "has_module_perms": True,
                        "models": models,
                    }
                )

        # Anything not explicitly placed (defensive — keeps new models visible).
        leftovers = [m for k, m in model_index.items() if k not in used]
        if leftovers:
            result.append(
                {
                    "name": "Other",
                    "app_label": "other",
                    "app_url": "",
                    "has_module_perms": True,
                    "models": leftovers,
                }
            )

        return result


# When app_label is provided (per-app page), fall back to default behaviour so
# the app index pages still work — handled inside get_app_list via _build_app_dict.
