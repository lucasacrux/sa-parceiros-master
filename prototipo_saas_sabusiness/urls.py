# prototipo_saas_sabusiness/urls.py
from django.urls import path
from . import views, api

app_name = "saas"

urlpatterns = [
    # Home
    path("", views.home, name="home"),

    # Auth (GET)
    path("login/",        views.login_view, name="login"),
    path("criar-conta/",  views.signup,     name="signup"),
    # Aliases (sem name para não conflitar)
    path("signup/",       views.signup),
    path("entrar/",       views.login_view),

    # Auth (POST)
    path("login/submit/",       views.login_post,  name="login_post"),
    path("criar-conta/submit/", views.signup_post, name="signup_post"),

    # Páginas
    path("developers/", views.developers, name="developers"),
    path("solutions/",  views.solutions,  name="solutions"),
    path("pricing/",    views.pricing,    name="pricing"),
    path("whitelabel/", views.whitelabel, name="whitelabel"),
    path("helpcenter/", views.helpcenter, name="helpcenter"),

    # Onboarding + Home logada
    path("onboarding/",   views.onboarding,        name="onboarding"),
    path("onboarding/finish/", views.wizard_finish_sso, name="wizard_finish_sso"),
    path("home/logada/",  views.home_logged_view,  name="home_logged"),  # <- garante nome da view correto

    # ---- Carteiras / Portal (views stub + aliases de nome) ----
    path("carteiras/nova/",        views.carteiras_nova,        name="carteiras_nova"),
    path("carteiras/configurar/",  views.carteiras_configurar,  name="carteiras_configurar"),
    path("carteiras/config/",      views.carteiras_configurar,  name="carteiras_config"),   # <- ALIAS p/ template

    path("portal/preview/",        views.portal_preview,        name="portal_preview"),
    path("portal/demo/",           views.portal_preview,        name="portal_demo"),         # <- ALIAS p/ template

    # Aliases PT-BR (sem name)
    path("desenvolvedores/", views.developers),
    path("solucoes/",        views.solutions),
    path("precos/",          views.pricing),
    path("ajuda/",           views.helpcenter),

    # APIs usadas pelo wizard
    path("api/public/cnpj",          api.cnpj_lookup,   name="api_cnpj_lookup"),
    path("api/notify/wa/otp",        api.wa_send_otp,   name="api_wa_send_otp"),
    path("api/notify/wa/otp/verify", api.wa_verify_otp, name="api_wa_verify_otp"),
    path("api/tenant/company/link",  api.link_company,  name="api_link_company"),
]
