# prototipo-saas-sabusiness (Django App)

Estrutura limpa (sem pastas duplicadas) e pronta para colar no seu monorepo.

## Estrutura correta
```
prototipo-saas-sabusiness/
  prototipo_saas_sabusiness/
    __init__.py
    apps.py
    urls.py
    views.py
    templates/prototipo_saas_sabusiness/
      base.html
      home.html
      login.html
      signup.html
      onboarding.html
      developers.html
      pricing.html
      solutions.html
      whitelabel.html
    static/prototipo_saas_sabusiness/
      css/sa_business.css
      js/sa_business.js
  README.md
```

## Se você criou pastas duplicadas
No seu repo, mantenha **apenas** a pasta `prototipo-saas-sabusiness/prototipo_saas_sabusiness`.
Apague qualquer subpasta redundante `prototipo-saas-sabusiness/prototipo-saas-sabusiness/*`.

## Como plugar no projeto (resumo)
1. Copie `prototipo-saas-sabusiness/` para a raiz do seu Django (onde está o `manage.py`).
2. `settings.py`:
```python
INSTALLED_APPS = [
    # ...
    "prototipo_saas_sabusiness",
]
STATIC_URL = "static/"
STATICFILES_DIRS = [
    BASE_DIR / "prototipo-saas-sabusiness" / "prototipo_saas_sabusiness" / "static",
]
```
3. URLs raiz:
```python
from django.urls import path, include
urlpatterns = [
    path("", include("prototipo_saas_sabusiness.urls")),
]
```
4. `python manage.py runserver 8020` e acesse `/`.
