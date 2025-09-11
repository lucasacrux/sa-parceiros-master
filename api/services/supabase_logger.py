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
    # Supabase returns a list of inserted rows when Prefer: return=representation
    if isinstance(data, list) and data:
        return {"inserted": data[0]}
    if isinstance(data, dict):
        return data
    return {"inserted": data}

def insert_processes(process_rows: list[dict]) -> Dict[str, Any]:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE")
    if not url or not key:
        return {"skipped": True, "reason": "missing_supabase_config"}
    endpoint = url.rstrip("/") + "/rest/v1/processes"
    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    try:
        resp = requests.post(endpoint, headers=headers, data=json.dumps(process_rows), timeout=30)
        return {"status_code": resp.status_code}
    except requests.RequestException as exc:
        return {"error": str(exc)}


def extract_process_rows(document: str, dataset: str, result: Dict[str, Any], consultation_id: str | None = None) -> list[dict]:
    """Heuristically extract process-like rows from BigDataCorp response.

    We look for a list of dicts containing any of the keys: publishDate/publishedAt,
    captureDate/capturedAt, title, content, court, source, url/link/id.
    """
    def is_row(d: dict) -> bool:
        keys = set(k.lower() for k in d.keys())
        return any(k in keys for k in ["publishdate", "publisheddate", "publishedat"]) or any(
            k in keys for k in ["title", "content", "court", "source", "link", "url", "id"]
        )

    rows: list[dict] = []

    def walk(obj: Any):
        if isinstance(obj, list):
            for it in obj:
                if isinstance(it, dict) and is_row(it):
                    rows.append(it)
                else:
                    walk(it)
        elif isinstance(obj, dict):
            for v in obj.values():
                walk(v)

    walk(result)

    out: list[dict] = []
    for d in rows:
        get = lambda *names: next((d.get(n) for n in names if n in d), None)
        publish = get("publishDate", "publishedAt", "published_date")
        capture = get("captureDate", "capturedAt", "capture_date")
        title = get("title")
        content = get("content", "summary", "descricao")
        court = get("court", "tribunal")
        source = get("source", "fonte")
        url = get("url", "link")
        pid = get("id", "processId", "identificador")
        out.append({
            "consultation_id": consultation_id,
            "document": document,
            "dataset": dataset,
            "process_id": pid,
            "publish_date": publish,
            "capture_date": capture,
            "title": title,
            "content": content,
            "court": court,
            "source": source,
            "url": url,
            "extra": d,
        })

    return out
