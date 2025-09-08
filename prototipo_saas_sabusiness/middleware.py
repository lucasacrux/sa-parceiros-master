# prototipo_saas_sabusiness/middleware.py
from django.shortcuts import redirect
from django.urls import reverse
from .models import SaasConfig

SAFE_PREFIXES = (
    "/onboarding",     # fluxo de verificação
    "/login", "/logout", "/signup", "/criar-conta",
    "/static/", "/media/",
    "/admin/",         # admin nunca deve ser bloqueado
)

class OnboardingGateMiddleware:
    """
    - strict: se contato não verificado -> redireciona para /onboarding?step=3
    - preview: permite navegar, mas marca request.is_readonly = True (para você desabilitar botões de ação)
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        if path.startswith(SAFE_PREFIXES):
            return self.get_response(request)

        cfg = SaasConfig.get_solo()
        contact_verified = bool(request.session.get("contact_verified"))

        if cfg.verification_mode == "strict" and not contact_verified:
            url = f"{reverse('saas:onboarding')}?step=3"
            return redirect(url)

        # Em 'preview' (ou verificado), segue; mas em preview sinalizamos 'somente visualização'
        request.is_readonly = (cfg.verification_mode == "preview" and not contact_verified)
        return self.get_response(request)
