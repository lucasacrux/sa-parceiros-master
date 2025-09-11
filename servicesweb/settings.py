"""
Django settings for servicesweb project.

Gerado com 'django-admin startproject'.

Este arquivo foi ajustado para:
- Usar BASE_DIR do pathlib (único e consistente)
- DEBUG booleano real vindo do .env
- Servir estáticos em desenvolvimento sem 404
- Ajustar MEDIA_ROOT
- Usar credenciais do GCP via env (com fallback para o JSON no repo)
"""

from pathlib import Path
from dotenv import load_dotenv
import os
from google.oauth2 import service_account

# --- Paths / Env -------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

# Carrega variables do .env (na raiz do projeto)
load_dotenv(BASE_DIR / ".env")

# --- Básico / Segurança ------------------------------------------------------

SECRET_KEY = os.getenv("SECRET", "dev-secret")
DEBUG = os.getenv("DEBUG", "1").lower() in ("1", "true", "t", "yes", "y")
ALLOWED_HOSTS = ["*"]

# Credenciais da BigDataCorp
BIGDATA_TOKEN_ID = os.getenv("BIGDATA_TOKEN_ID", "")
BIGDATA_ACCESS_TOKEN = os.getenv("BIGDATA_ACCESS_TOKEN", "")

# --- Apps --------------------------------------------------------------------

INSTALLED_APPS = [
    "corsheaders",
    "accounts",

    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "core.apps.CoreConfig",
    "levas.apps.LevasConfig",
    "business.apps.BusinessConfig",
    "terceirizada.apps.TerceirizadaConfig",
    "whitelabel.apps.WhitelabelConfig",
    "adm.apps.AdmConfig",
    "api.apps.ApiConfig",

    "rest_framework",
    "rest_framework.authtoken",
    "storages",

    "prototipo_saas_sabusiness",
]


# --- Middlewares -------------------------------------------------------------

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # deve vir no topo, antes de CommonMiddleware
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "servicesweb.urls"

# CORS (lib: django-cors-headers)
CORS_ALLOW_ALL_ORIGINS = True

# --- Templates ---------------------------------------------------------------

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],  # se tiver templates fora dos apps, adicione paths aqui
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "servicesweb.wsgi.application"
AUTH_USER_MODEL = "accounts.CustomUser"

# --- Databases ---------------------------------------------------------------

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.environ.get("DEFAULT_NAME"),
        "USER": os.environ.get("DEFAULT_USER"),
        "PASSWORD": os.environ.get("DEFAULT_PASS"),
        "HOST": os.environ.get("HOST"),
        "PORT": "3306",
    },
    "datahub": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.environ.get("DATAHUB_NAME"),
        "USER": os.environ.get("DATAHUB_USER"),
        "PASSWORD": os.environ.get("DATAHUB_PASS"),
        "HOST": os.environ.get("HOST"),
        "PORT": "3306",
    },
    "business": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.environ.get("BUSINESS_NAME"),
        "USER": os.environ.get("DATAHUB_USER"),
        "PASSWORD": os.environ.get("DATAHUB_PASS"),
        "HOST": os.environ.get("HOST"),
        "PORT": "3306",
    },
}

DATABASE_ROUTERS = [
    "accounts.routers.AuthRouter",
    "servicesweb.routers.MeuBancoRouter",
]

# --- DEV LOCAL: usar SQLite e ignorar routers -------------------------------
USE_SQLITE_LOCAL = os.getenv("SA_LOCAL_SQLITE", "1" if DEBUG else "0").lower() in ("1","true","t","yes","y")

if USE_SQLITE_LOCAL:
    # Em desenvolvimento local, usamos um Único arquivo SQLite e expomos
    # um alias "business" para compatibilidade com .using('business') no código.
    sqlite_path = BASE_DIR / "db.sqlite3"
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": sqlite_path,
        },
        # Alias apontando para o mesmo SQLite local
        "business": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": sqlite_path,
        },
    }
    # Evita que routers tentem resolver consultas nos outros bancos
    DATABASE_ROUTERS = []

# --- Auth / Passwords --------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# --- i18n / tz ---------------------------------------------------------------

LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.AutoField"

# --- Static / Media ----------------------------------------------------------

# Em desenvolvimento, o runserver servirá /static/ via staticfiles_urlpatterns() (veja urls.py)
STATIC_URL = "/static/"

# Se você tiver uma pasta ./static na raiz do projeto (além de app/static/), mantenha:
STATICFILES_DIRS = [
    BASE_DIR / "static",
    BASE_DIR / "prototipo_saas_sabusiness" / "static",
]

# Para produção (collectstatic):
STATIC_ROOT = BASE_DIR / "staticfiles"

# Uploads de usuários
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# --- Storage (GCS via django-storages) --------------------------------------

# Tenta usar a env var GOOGLE_APPLICATION_CREDENTIALS;
# se não existir, cai no JSON dentro do repo (em terceirizada/).
_creds_path_env = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
_fallback_path = BASE_DIR / "terceirizada" / "mythical-runner-350501-79f85db1d3dd.json"
_creds_path = _creds_path_env or str(_fallback_path)
try:
    if _creds_path and os.path.isfile(_creds_path):
        GS_CREDENTIALS = service_account.Credentials.from_service_account_file(_creds_path)
        DEFAULT_FILE_STORAGE = "storages.backends.gcloud.GoogleCloudStorage"
        GS_BUCKET_NAME = os.getenv("GS_BUCKET_NAME", "services-static-lake")
    else:
        GS_CREDENTIALS = None
except Exception:
    GS_CREDENTIALS = None
