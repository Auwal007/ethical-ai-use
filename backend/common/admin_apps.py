"""
Custom AdminConfig that installs our branded AdminSite as Django's default.

Kept in its own module (not common/apps.py) so that common/apps.py declares
exactly one AppConfig — Django rejects a module that declares more than one
default AppConfig.

Using ``default_site`` makes the global ``admin.site`` an EAILSAdminSite
instance, so every existing ``@admin.register`` decorator registers against it
with no other changes.
"""
from __future__ import annotations

from django.contrib.admin.apps import AdminConfig


class EAILSAdminConfig(AdminConfig):
    default_site = "common.admin.EAILSAdminSite"
