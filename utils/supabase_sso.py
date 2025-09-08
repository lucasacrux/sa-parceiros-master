import os
import requests
import datetime as dt

# Aceita SUPABASE_URL ou, se ausente, VITE_SUPABASE_URL (compat com setup atual)
SUPABASE_URL = (os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "").rstrip("/")
if not SUPABASE_URL:
    raise RuntimeError(
        "Configure SUPABASE_URL (ou VITE_SUPABASE_URL) no .env da raiz (backend)."
    )

# Opcional; habilita Magic Link 1-clique
SERVICE = os.getenv("SUPABASE_SERVICE_ROLE")
DEFAULT_APP_URL = os.getenv("APP_PUBLIC_URL") or "http://192.168.1.161:8080/app"

HDRS_ADMIN = (
    {"apikey": SERVICE, "Authorization": f"Bearer {SERVICE}", "Content-Type": "application/json"}
    if SERVICE
    else None
)


def has_admin_access() -> bool:
    """Indica se temos SERVICE_ROLE disponível (habilita operações admin/SSO)."""
    return HDRS_ADMIN is not None


def utcnow_iso():
    return dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def ensure_user(email: str, metadata: dict | None = None):
    """Cria/garante usuário no Auth; só funciona se houver SERVICE_ROLE."""
    if not HDRS_ADMIN:
        return
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        json={"email": email, "email_confirm": True, "user_metadata": metadata or {}},
        headers=HDRS_ADMIN,
        timeout=10,
    )
    if r.status_code not in (200, 201, 409):
        r.raise_for_status()


def generate_magic_link(email: str, redirect_to: str = DEFAULT_APP_URL) -> str:
    """Magic Link (1-clique); requer SERVICE_ROLE."""
    assert HDRS_ADMIN, "Service role ausente"
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/admin/generate_link",
        json={"type": "magiclink", "email": email, "options": {"redirect_to": redirect_to}},
        headers=HDRS_ADMIN,
        timeout=10,
    )
    r.raise_for_status()
    data = r.json()
    return data.get("action_link") or data.get("properties", {}).get("action_link")


def upsert(table: str, row: dict):
    """Upsert via PostgREST; só executa se houver SERVICE_ROLE."""
    if not HDRS_ADMIN:
        return
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        json=row,
        headers={**HDRS_ADMIN, "Prefer": "resolution=merge-duplicates"},
        timeout=10,
    )
    if r.status_code not in (200, 201, 204):
        r.raise_for_status()
