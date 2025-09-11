import os
import json
from typing import Any, Dict

import requests


def insert_consultation(document: str, dataset: str, result: Dict[str, Any]) -> Dict[str, Any]:
    """Insert a consultation record into Supabase (public.consultations).

    Requires env vars:
      - SUPABASE_URL (e.g., https://your-project.supabase.co)
      - SUPABASE_SERVICE_ROLE (service role key)
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE")
    if not url or not key:
        return {"skipped": True, "reason": "missing_supabase_config"}

    table_endpoint = url.rstrip("/") + "/rest/v1/consultations"
    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    payload = {
        "document": document,
        "dataset": dataset,
        "result": result,
    }
    try:
        resp = requests.post(table_endpoint, headers=headers, data=json.dumps(payload), timeout=20)
    except requests.RequestException as exc:
        return {"error": str(exc)}

    try:
        data = resp.json()
    except ValueError:
        data = {"status_code": resp.status_code, "text": resp.text}
    return data if isinstance(data, dict) else {"inserted": data}

