Environment Files Overview

Recommended structure for this repository:

- Backend (Django + Python scripts)
  - File: `.env` (NOT committed)
  - Template: `.env.example`
  - Loader: `servicesweb/settings.py` and scripts load `BASE_DIR / ".env"`

- Frontend (Vite app)
  - File: `app/.env` (NOT committed)
  - Template: `app/.env.example`
  - Loader: Vite automatically loads `app/.env` and `app/.env.*` files

Notes

- Never commit real secrets. Only commit the `*.env.example` templates.
- The backend `.env` should include server-only secrets (DB, Supabase service role, etc.).
- The frontend `app/.env` must only contain `VITE_*` variables; they are embedded in the build and are not secret.
- If running locally, copy the example files and fill your values:
  - `cp .env.example .env`
  - `cp app/.env.example app/.env`

Common variables

- Backend: `SECRET`, `DEBUG`, `HOST`, DB creds (`DEFAULT_*`, `DATAHUB_*`, etc.), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`, `APP_PUBLIC_URL`, `GOOGLE_APPLICATION_CREDENTIALS`, `GS_BUCKET_NAME`, `SA_LOCAL_SQLITE`.
- Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`.

Git ignore

- Root `.gitignore` is configured to ignore `.env` and `.env.*` while keeping `*.env.example` tracked.

