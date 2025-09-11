import json
from typing import Any, Dict, List

import requests
from django.conf import settings

# BigDataCorp base endpoint (companies search)
BASE_URL = "https://plataforma.bigdatacorp.com.br/empresas"


def _dataset_code_to_bigdata(dataset_code: str) -> str:
    """Map our internal dataset codes to BigData's expected Datasets value."""
    code = (dataset_code or "").lower()
    # Common aliases we may use in the UI
    if code in {"lawsuits", "processos", "processes"}:
        return "processes"
    return code or "processes"


def _sanitize_doc(doc: str) -> str:
    return "".join(ch for ch in (doc or "") if ch.isdigit())


def fetch_lawsuits(cnpj: str, datasets: List[str]) -> Dict[str, Any]:
    """
    Consulta BigDataCorp. Expects:
      - headers: TokenId + AccessToken
      - body: { "Datasets": "processes", "q": "doc{<CNPJ>}", "Limit": 1 }

    Returns a dict. If response is not JSON, returns { "status_code": ..., "text": ... }.
    """
    token_id = getattr(settings, "BIGDATA_TOKEN_ID", "")
    access_token = getattr(settings, "BIGDATA_ACCESS_TOKEN", "")
    if not token_id or not access_token:
        return {
            "error": "Missing BigDataCorp credentials",
            "detail": "Set BIGDATA_TOKEN_ID and BIGDATA_ACCESS_TOKEN in .env",
        }

    dataset = _dataset_code_to_bigdata(datasets[0] if datasets else "processes")
    doc = _sanitize_doc(cnpj)
    headers = {
        # BigData expects these exact header names
        "TokenId": token_id,
        "AccessToken": access_token,
        "accept": "application/json",
        "content-type": "application/json",
    }
    q = f"doc{{{doc}}}"
    body = {
        "Datasets": dataset,
        "q": q,
        "Limit": 1,
    }
    meta = {"dataset": dataset, "q": q, "url": BASE_URL}

    try:
        resp = requests.post(BASE_URL, headers=headers, json=body, timeout=20)
    except requests.RequestException as exc:
        return {"error": str(exc)}

    # Try to return JSON if possible; otherwise return raw text/status
    ctype = resp.headers.get("content-type", "")
    if "application/json" in ctype.lower():
        try:
            data = resp.json()
            if isinstance(data, dict):
                data.setdefault("meta", meta)
            return data
        except ValueError:
            return {"status_code": resp.status_code, "text": resp.text, "meta": meta}
    else:
        return {"status_code": resp.status_code, "text": resp.text, "meta": meta}
