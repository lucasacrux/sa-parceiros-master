from typing import Dict
from urllib.parse import urlencode

from django.contrib import messages
from django.http import HttpRequest, HttpResponse, HttpResponseRedirect
from django.shortcuts import render, redirect
from django.urls import reverse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from urllib.parse import urlencode
import json
import os



# ========================= PÁGINAS (GET) ==============================

@require_http_methods(["GET"])
def home(request: HttpRequest) -> HttpResponse:
    """Exibe a home."""
    return render(request, "prototipo_saas_sabusiness/home.html")


@require_http_methods(["GET"])
def login_view(request: HttpRequest) -> HttpResponse:
    """Exibe o login, pré-preenchendo e-mail se vier via query (?email=...)."""
    email = request.GET.get("email", "")
    ctx: Dict[str, str] = {"prefill_email": email}
    return render(request, "prototipo_saas_sabusiness/login.html", ctx)


@require_http_methods(["GET"])
def signup(request: HttpRequest) -> HttpResponse:
    """
    Exibe o cadastro. Pré-preenche o e-mail e preserva a origem se vier da home:
    /criar-conta/?email=...&origin=HOME_HERO_V2_A
    """
    email = request.GET.get("email", "")
    origin = request.GET.get("origin", "")
    ctx: Dict[str, str] = {"prefill_email": email, "origin": origin}
    return render(request, "prototipo_saas_sabusiness/signup.html", ctx)


@require_http_methods(["GET"])
@ensure_csrf_cookie
def onboarding(request: HttpRequest) -> HttpResponse:
    try:
        step = int(request.GET.get("step", "1"))
    except ValueError:
        step = 1
    step = 1 if step < 1 else 4 if step > 4 else step
    # Dados do pré-cadastro (guardados pela signup_post)
    app_public_url = os.getenv("APP_PUBLIC_URL") or "http://192.168.1.161:8080/app"
    ctx: Dict[str, str | int] = {
        "step": step,
        "user_email": request.session.get("user_email", ""),
        "user_name": request.session.get("user_name", ""),
        "user_whatsapp": request.session.get("user_whatsapp", ""),
        "app_public_url": app_public_url,
    }
    return render(request, "prototipo_saas_sabusiness/onboarding.html", ctx)


@require_http_methods(["GET"])
def pricing(request: HttpRequest) -> HttpResponse:
    """Página de preços."""
    return render(request, "prototipo_saas_sabusiness/pricing.html")


@require_http_methods(["GET"])
def developers(request: HttpRequest) -> HttpResponse:
    """Página de developers."""
    return render(request, "prototipo_saas_sabusiness/developers.html")


@require_http_methods(["GET"])
def solutions(request: HttpRequest) -> HttpResponse:
    """Página de soluções."""
    return render(request, "prototipo_saas_sabusiness/solutions.html")


@require_http_methods(["GET"])
def whitelabel(request: HttpRequest) -> HttpResponse:
    """Página de whitelabel."""
    return render(request, "prototipo_saas_sabusiness/whitelabel.html")


@require_http_methods(["GET"])
def helpcenter(request: HttpRequest) -> HttpResponse:
    """Página do help center."""
    return render(request, "prototipo_saas_sabusiness/helpcenter.html")


# ========================= AÇÕES (POST) ===============================

@require_http_methods(["POST"])
def signup_post(request: HttpRequest) -> HttpResponseRedirect:
    """
    Recebe o formulário de cadastro.
    Em caso de erro, redireciona de volta preservando e-mail e origin.
    """
    post = request.POST
    name   = (post.get("name") or "").strip()
    email  = (post.get("email") or "").strip().lower()
    whats  = (post.get("whatsapp") or "").strip()
    pwd1   = post.get("password") or ""
    pwd2   = post.get("password_confirm") or ""
    source = (post.get("source") or "").strip()
    origin = (post.get("origin") or "SIGNUP_PAGE").strip()

    if not all((name, email, whats, pwd1, pwd2, source)):
        messages.error(request, "Preencha todos os campos.")
        qs = urlencode({"email": email, "origin": origin})
        return redirect(f"{reverse('saas:signup')}?{qs}")

    if pwd1 != pwd2:
        messages.error(request, "As senhas não coincidem.")
        qs = urlencode({"email": email, "origin": origin})
        return redirect(f"{reverse('saas:signup')}?{qs}")

    # TODO: criar usuário/empresa, salvar 'source' e 'origin', disparar confirmações, etc.
    
    # Guarda o essencial para o wizard fase 1:
    request.session["user_name"] = name
    request.session["user_email"] = email
    request.session["user_whatsapp"] = whats
    request.session["needs_contact_verification"] = True  # para fases futuras

    messages.success(request, "Conta criada com sucesso! Faça login para continuar.")
    # Pré-preenche o e-mail no login também:
    return redirect(f"{reverse('saas:onboarding')}?step=1")

#home logada
@require_GET
def home_logged_view(request):
    return render(request, "prototipo_saas_sabusiness/home_logged.html", {"is_readonly": False})

@require_GET
def carteiras_nova(request):
    return render(request, "prototipo_saas_sabusiness/carteiras_nova.html")

@require_GET
def carteiras_configurar(request):
    return render(request, "prototipo_saas_sabusiness/carteiras_configurar.html")

@require_GET
def portal_preview(request):
    return render(request, "prototipo_saas_sabusiness/portal_preview.html")


@require_http_methods(["POST"])
def login_post(request: HttpRequest) -> HttpResponseRedirect:
    """
    Recebe o formulário de login.
    Troque pelo fluxo real de autenticação quando integrar com Django Auth.
    """
    email = (request.POST.get("email") or "").strip().lower()
    pwd   = request.POST.get("password") or ""

    if not email or not pwd:
        messages.error(request, "Informe e-mail e senha.")
        return redirect("saas:login")

    # TODO: autenticar de fato (authenticate/login) e redirecionar para dashboard.
    messages.success(request, "Login efetuado com sucesso.")
    return redirect("saas:home")


@require_http_methods(["POST", "GET"])
@csrf_exempt
def wizard_finish_sso(request: HttpRequest):
    """
    Finalização do wizard com SSO Supabase.
    - Com SUPABASE_SERVICE_ROLE: envia Magic Link (1 clique) e redireciona.
    - Sem service role: redireciona para app com need_otp=1 para OTP no frontend.

    Entrada mínima: email (POST form/JSON ou GET)
    Param opcional: redirect_to (default: http://localhost:8080/app)
    Outros campos vão como user_metadata quando houver SERVICE_ROLE
    """
    # Coleta parâmetros
    email = None
    redirect_to = None
    metadata = {}

    if request.method == 'POST':
        if request.content_type and 'application/json' in request.content_type:
            try:
                payload = json.loads(request.body or b"{}")
            except Exception:
                payload = {}
            email = (payload.get('email') or payload.get('user_email') or '').strip().lower()
            redirect_to = payload.get('redirect_to')
            metadata = {k: v for k, v in payload.items() if k not in {'email', 'user_email', 'redirect_to'}}
        else:
            email = (request.POST.get('email') or request.POST.get('user_email') or '').strip().lower()
            redirect_to = request.POST.get('redirect_to')
            metadata = {k: v for k, v in request.POST.items() if k not in {'email', 'user_email', 'redirect_to'}}
    else:
        email = (request.GET.get('email') or request.GET.get('user_email') or '').strip().lower()
        redirect_to = request.GET.get('redirect_to')
        metadata = {k: v for k, v in request.GET.items() if k not in {'email', 'user_email', 'redirect_to'}}

    if not email:
        if 'application/json' in (request.headers.get('Accept') or ''):
            return JsonResponse({"ok": False, "error": "email é obrigatório"}, status=400)
        messages.error(request, "Informe um e-mail válido.")
        return redirect('saas:onboarding')

    if not redirect_to:
        redirect_to = os.getenv("APP_PUBLIC_URL") or "http://192.168.1.161:8080/app"

    wants_json = 'application/json' in (request.headers.get('Accept') or '')

    # Importa helper apenas aqui para evitar quebrar o servidor caso env não esteja configurado
    try:
        from utils import supabase_sso as sso
    except RuntimeError:
        # Env ausente para Supabase: fallback OTP
        url = f"{redirect_to}?" + urlencode({"need_otp": 1, "email": email})
        if wants_json:
            return JsonResponse({"ok": True, "mode": "otp", "next": url})
        return redirect(url)
    except Exception:
        if wants_json:
            return JsonResponse({"ok": False, "error": "Falha ao carregar SSO"}, status=500)
        messages.error(request, "Falha ao carregar integrações de SSO.")
        return redirect('saas:onboarding')

    try:
        if sso.has_admin_access():
            try:
                sso.ensure_user(email=email, metadata=metadata)
            except Exception:
                pass
            link = sso.generate_magic_link(email=email, redirect_to=redirect_to)
            if wants_json:
                return JsonResponse({"ok": True, "mode": "magiclink", "action_link": link, "next": redirect_to})
            return redirect(link)
        else:
            url = f"{redirect_to}?" + urlencode({"need_otp": 1, "email": email})
            if wants_json:
                return JsonResponse({"ok": True, "mode": "otp", "next": url})
            return redirect(url)
    except Exception:
        if wants_json:
            return JsonResponse({"ok": False, "error": "Falha no SSO"}, status=500)
        messages.error(request, "Falha no SSO.")
        return redirect('saas:onboarding')
