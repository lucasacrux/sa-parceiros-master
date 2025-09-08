# api.py
from typing import Any, Dict
from django.http import JsonResponse, HttpRequest
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt, csrf_protect
import requests
import random

def _ok(data: Dict[str, Any] | None = None, status=200):
    return JsonResponse({"ok": True, **(data or {})}, status=status)

def _fail(msg: str, status=400):
    return JsonResponse({"ok": False, "error": msg}, status=status)

# ========== 1) Consulta de CNPJ (proxy BrasilAPI) ==========
@require_GET
def cnpj_lookup(request: HttpRequest):
    cnpj = (request.GET.get("cnpj") or "").strip()
    digits = "".join([d for d in cnpj if d.isdigit()])
    if len(digits) != 14:
        return _fail("CNPJ inválido", 400)
    try:
        r = requests.get(f"https://brasilapi.com.br/api/cnpj/v1/{digits}", timeout=8)
        if r.status_code != 200:
            return _fail("Falha ao consultar CNPJ", 502)
        d = r.json() or {}
        # normaliza
        data = {
            "cnpj": digits,
            "razao": d.get("razao_social") or d.get("nome_fantasia") or "—",
            "tipo": d.get("natureza_juridica") or d.get("tipo") or "—",
            "situacao": d.get("descricao_situacao_cadastral") or d.get("situacao") or "—",
        }
        return _ok(data)
    except Exception:
        return _fail("Erro ao consultar serviço público", 502)

# ========== 2) Envio de OTP por WhatsApp ==========
@require_POST
@csrf_protect
def wa_send_otp(request: HttpRequest):
    """
    Protótipo: gera código e guarda na sessão.
    Em produção: integre com seu provedor (WhatsApp Cloud API, Z-API etc.) e NÃO devolva o código.
    """
    try:
        payload = request.body.decode("utf-8") or "{}"
    except Exception:
        payload = "{}"
    import json
    body = json.loads(payload)
    phone = "".join([d for d in (body.get("phone") or "") if d.isdigit()])
    if len(phone) not in (10, 11):
        return _fail("Telefone inválido", 400)

    code = f"{random.randint(100000, 999999)}"
    request.session["otp_phone"] = phone
    request.session["otp_code"] = code

    # TODO(prod): enviar código via provedor aqui (não retornar o code)
    # print(f"[DEV] OTP {code} para {phone}")

    return _ok()  # não retornamos o code em produção

# ========== 3) Verificação do OTP ==========
@require_POST
@csrf_protect
def wa_verify_otp(request: HttpRequest):
    import json
    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        body = {}
    phone = "".join([d for d in (body.get("phone") or "") if d.isdigit()])
    code  = "".join([d for d in (body.get("code") or "") if d.isdigit()])

    saved_phone = request.session.get("otp_phone")
    saved_code  = request.session.get("otp_code")

    if not saved_phone or not saved_code:
        return _fail("Código expirado. Reenvie.", 400)

    if phone != saved_phone or code != saved_code:
        return _fail("Código incorreto.", 400)

    # Marca verificação concluída
    request.session["contact_verified"] = True
    # Opcional: invalida o código após uso
    request.session.pop("otp_code", None)

    return _ok()

# ========== 4) Vincular empresa ao tenant ==========
@require_POST
@csrf_protect
def link_company(request: HttpRequest):
    import json
    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        body = {}
    cnpj = "".join([d for d in (body.get("cnpj") or "") if d.isdigit()])
    whatsapp = "".join([d for d in (body.get("whatsapp") or "") if d.isdigit()])
    if len(cnpj) != 14:
        return _fail("CNPJ inválido", 400)
    if len(whatsapp) not in (10, 11):
        return _fail("Telefone inválido", 400)

    # TODO(prod): persistir no banco (empresa/tenant) e associar ao usuário logado
    # Para o protótipo, apenas sinalize OK:
    request.session["linked_company"] = cnpj
    return _ok({"company_id": cnpj})
