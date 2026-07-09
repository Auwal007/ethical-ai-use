#!/usr/bin/env bash
# Render build script for the Django backend.
# Exit on error, unset-var, or any failure in a pipeline.
set -o errexit
set -o nounset
set -o pipefail

pip install -r requirements.txt

# Collect static assets for whitenoise to serve.
python manage.py collectstatic --no-input

# Apply database migrations.
python manage.py migrate --no-input

# Create/refresh the admin superuser from DJANGO_ADMIN_* env vars (idempotent).
# Skips cleanly if those vars aren't set.
python manage.py create_admin || echo "create_admin skipped (DJANGO_ADMIN_* not set)"
