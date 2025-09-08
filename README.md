SaiuAcordo Parceiros — Unified Fronts (Django + Vite)

Overview
- Two fronts sharing a single Supabase Auth/DB:
  - Backend (Django, port 8020): Landing pages, signup/onboarding wizard, SSO handoff.
  - Frontend (Vite React, port 8080, folder `app/`): Logged-in area (Lovable UI).
- SSO strategy:
  - If `SUPABASE_SERVICE_ROLE` is present on backend: 1‑click Magic Link via Supabase Admin API.
  - Otherwise: fallback to OTP on the frontend (`?need_otp=1&email=...`).
- Shared design tokens: Both sides use consistent CSS variables for a cohesive UI.

Project layout
- Django apps: `prototipo_saas_sabusiness` (marketing + wizard), `core`, `terceirizada`, `business`, etc.
- Frontend app: `app/` (Vite + React, Lovable-generated UI).
- Supabase SSO helper: `utils/supabase_sso.py` (backend-only).

Environment variables (do not mix)
- Backend (Django) — file: `.env` in the project root
  - `SUPABASE_URL=...` (fallback: `VITE_SUPABASE_URL` if present in root). Required for SSO.
  - `SUPABASE_SERVICE_ROLE=...` (optional; enables Magic Link 1‑click on backend). NEVER expose this to frontend.
  - `APP_PUBLIC_URL=http://<HOST>:8080/app` (where SSO should land after auth; used across templates + helper).
  - `SA_LOCAL_SQLITE=1` (local dev uses SQLite; avoids native MySQL deps on Windows).
- Frontend (Vite) — file: `app/.env.local` (or `app/.env`)
  - `VITE_SUPABASE_URL=...`
  - `VITE_SUPABASE_ANON_KEY=...` (publishable anon key only).

Git ignore (secrets safe)
Root `.gitignore` already includes:
- `.env`
- `app/.env`, `app/.env.local`
- `app/.next`, `app/node_modules`, `app/dist`
- `*service-account*.json`

SSO endpoints
- Wizard finish (Django): `POST|GET /onboarding/finish/`
  - Input: `email` (required), `redirect_to` (optional; defaults to `APP_PUBLIC_URL`), plus metadata fields.
  - Behavior: Magic Link redirect (if service role) or `?need_otp=1` to app.
- Helper: `utils/supabase_sso.py`
  - `ensure_user(email, metadata)` (admin only)
  - `generate_magic_link(email, redirect_to=APP_PUBLIC_URL)` (admin only)
  - `upsert(table, row)` (admin only)

Run locally (desktop)
1) Backend (Django)
   - Create venv and install deps:
     - PowerShell: `python -m venv .venv && .\.venv\Scripts\Activate.ps1`
     - `python -m pip install --upgrade pip setuptools wheel`
     - `python -m pip install -r requirements.txt`
   - Setup env in `.env` (root):
     - Minimum for dev: `SA_LOCAL_SQLITE=1`
     - SSO target: `APP_PUBLIC_URL=http://localhost:8080/app`
     - Optional for 1‑click: `SUPABASE_URL=...` and `SUPABASE_SERVICE_ROLE=...`
   - Run:
     - `python manage.py migrate`
     - `python manage.py runserver 0.0.0.0:8020`

2) Frontend (Vite)
   - `cd app`
   - `npm install`
   - `npm run dev`
   - Visit `http://localhost:8080/`

Mobile/LAN testing
- Ensure phone and PC are on the same Wi‑Fi.
- Set `APP_PUBLIC_URL=http://<PC_LAN_IP>:8080/app` in root `.env` (example: `http://192.168.1.161:8080/app`).
- Restart Django. Vite should bind to LAN by default via `vite.config.ts` (`host: '0.0.0.0'`).
- Open on phone:
  - Django: `http://<PC_LAN_IP>:8020/`
  - Vite: `http://<PC_LAN_IP>:8080/`
- If blocked, allow inbound TCP 8020/8080 in Windows Firewall.

Common pitfalls
- Windows libmagic error: removed dependency; not required for our flows.
- GCP credentials required in legacy modules: now safe-guarded (no crash without creds).
- SQLite vs MySQL: local dev uses SQLite (`SA_LOCAL_SQLITE=1`).

Deploy notes (high-level)
- Never publish `SUPABASE_SERVICE_ROLE` to frontend.
- Set `APP_PUBLIC_URL` to your public app URL (e.g., https://app.yourdomain.com/app) so Magic Links/redirects work.
- For Magic Link to non-local URLs, add the URL in Supabase Auth → URL Configuration (Additional Redirect URLs).

Safe Git workflow (no secrets)
1) Verify secrets are untracked:
   - Ensure `.env`, `app/.env`, `app/.env.local`, and any `*service-account*.json` are in `.gitignore` (already configured).
   - Run `git status` and confirm no secret files appear.
2) Stage and commit code changes only:
   - `git add -A`
   - `git restore --staged .env app/.env app/.env.local 2>$null`  (safety unstage)
   - `git commit -m "Unify fronts: SSO helper, onboarding finish, Lovable hero, APP_PUBLIC_URL, LAN support"`
3) Push to GitHub:
   - `git push origin <your-branch>`

Tip: If you ever accidentally staged a secret file, use `git reset HEAD <file>` before committing, or `git restore --source=HEAD --staged --worktree <file>` to drop changes (last resort).

