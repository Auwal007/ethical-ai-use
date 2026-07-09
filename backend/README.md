# Ethical AI Literacy System — Backend

Django 5 + Django REST Framework backend (PostgreSQL) for the ATBU Ethical AI
Literacy System. Replaces the Next.js API route handlers.

> **Architecture:** thin views; all non-trivial logic (gating, scoring,
> branching, profile aggregation, anonymised export) lives in per-app
> `services.py` modules so the research instrument is unit-testable in isolation.
> All write endpoints run inside `transaction.atomic`. Role and user identity are
> never taken from the client.

## Local setup

```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then edit DATABASE_URL / SECRET_KEY

# Create the local Postgres database (see below), then:
python manage.py migrate
python manage.py createsuperuser   # or: set DJANGO_ADMIN_* and run create_admin
python manage.py runserver
```

Admin: http://127.0.0.1:8000/admin/

## Create the local PostgreSQL database

```bash
# Using psql (adjust user as needed):
psql -U postgres -c "CREATE DATABASE ethical_ai;"
```

Set `DATABASE_URL` in `.env` to match, e.g.
`postgres://postgres:postgres@localhost:5432/ethical_ai`.

## Running the tests

The suite runs on SQLite (no Postgres needed):

```bash
USE_SQLITE_FOR_TESTS=True python -m pytest      # macOS/Linux
# PowerShell:  $env:USE_SQLITE_FOR_TESTS="True"; python -m pytest
```

Production always uses PostgreSQL via `DATABASE_URL`; the SQLite toggle only
affects the test database.

## API reference

All endpoints are JSON. Auth column: **None** = public, **JWT** = any
authenticated user (Bearer access token), **Admin** = `IsAdminRole`
(`role == 'admin'`). Students may only ever read/write their own data
(querysets are filtered on `request.user`).

### Authentication — `/api/auth/`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register/` | None | Register a participant; requires `consent_agreed=true` + `consent_version`; creates User + ConsentRecord atomically; returns JWT pair + user. Role forced to `student`. |
| POST | `/api/auth/login/` | None | Email + password → JWT access/refresh pair + user. |
| POST | `/api/auth/refresh/` | None | SimpleJWT refresh → new access token. |
| GET | `/api/auth/me/` | JWT | Current user + computed `streak`, `pretest_completed`, `posttest_available`, `modules_completed`. |

### Content — `/api/`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/modules/` | JWT | Published modules with per-user `status` + `is_accessible`. |
| GET | `/api/modules/<id>/` | JWT | Full module: ordered pages + scenarios visible to this user. 403 if gating disallows. |
| POST | `/api/modules/<id>/complete/` | JWT | Mark module completed (requires quiz submitted + all visible scenarios answered + reflection). Returns user state. |
| POST | `/api/modules/<id>/reflection/` | JWT | Submit the module reflection (min 50 chars, one per module). |
| POST | `/api/scenarios/<id>/choose/` | JWT | Record a scenario choice (`option_id`); returns consequence + newly unlocked scenarios. Second choice → 409. |

### Assessments — `/api/assessments/`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/assessments/pretest/` | JWT | Pre-test with ordered questions (no `correct_answer`). 403 if already taken. |
| GET | `/api/assessments/posttest/` | JWT | Post-test. 403 until all modules completed. |
| GET | `/api/assessments/quiz/<module_id>/` | JWT | A module's quiz. 403 unless the module is accessible. |
| GET | `/api/assessments/usability/` | JWT | Usability questionnaire (Likert). 403 until post-test submitted. |
| POST | `/api/assessments/<id>/submit/` | JWT | Score + persist the single attempt. 409 if already submitted. Returns totals + user state; quiz-only per-question feedback. |

### Ethical Reasoning Profile & reflections — `/api/`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/profile/` | JWT | Radar-chart contract: per-dimension pretest / current(learning) / posttest. |
| GET | `/api/profile/growth/` | JWT | Pretest vs posttest per dimension + overall gain. 409 if no post-test. |
| GET | `/api/reflections/` | JWT | The requesting user's own reflections, chronological. |

### Researcher / admin — `/api/admin/`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/participants/` | Admin | Every student: consent, pre/post completion + totals, modules completed, gain. |
| GET | `/api/admin/stats/` | Admin | Counts, completion rate, mean pre/post/gain, per-dimension means. |
| GET | `/api/admin/export/?dataset=scores\|responses\|usability\|reflections` | Admin | Streams anonymised CSV (pseudonymous `P001…`; never name/email). |

## Management commands
| Command | Purpose |
|---|---|
| `create_admin` | Create/refresh a superuser from `DJANGO_ADMIN_*` env vars (idempotent). |
| `verify_instrument_parity` | Fail loudly if pretest/posttest diverge in count, order, dimension, or text — protects the O₁ X O₂ comparison. |
