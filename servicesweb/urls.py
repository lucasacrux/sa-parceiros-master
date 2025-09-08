"""
URL configuration for servicesweb project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from django.conf import settings 
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns


urlpatterns = [
    # 🔝 Nosso protótipo primeiro e na raiz:
    path("", include("prototipo_saas_sabusiness.urls")),  # /, /login/, /criar-conta/, /onboarding/, /desenvolvedores/

    # Mova o "core" para um prefixo (evita conflito com a raiz):
    path('app/', include('core.urls')),

    # Demais apps como estavam:
    path('t/', include('terceirizada.urls')),
    path('business/', include('business.urls')),
    path('varig/', include('whitelabel.urls')),
    path('adm/', include('adm.urls')),
    path('pessoas/', include('levas.urls')),
    path('admin/', admin.site.urls),
    path("accounts/", include('accounts.urls')),
    path('api/', include('api.urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += staticfiles_urlpatterns()