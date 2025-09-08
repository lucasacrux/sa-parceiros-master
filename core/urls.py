from django.urls import path
from django.conf import settings
from django.conf.urls.static import static 
from core.views import select_company, home, relatorio, carteira, create_carteira, gestao_carteira, download_modelo, criar_acordo, buscar_acordo_feito, detalhes_do_acordo, editar_acordo
from accounts.views import login_view
from . import views
from terceirizada import views as views_terceirizada
from .views import download_modelo


urlpatterns = [
    path('', login_view, name='login_view'),
    path('select_company/', select_company, name='select_company'),
    path('home/',  views_terceirizada.listar_parcelas, name='home'),
    path('relatorio/', relatorio, name='relatorio'),
    path('gestao_carteira/', gestao_carteira, name='gestao_carteira'),
    path('carteiras/', carteira, name='carteira'),
    path('criar-carteira/', create_carteira, name='create_carteira'),
    path('download-modelo/', download_modelo, name='download_modelo'),
    path('criar-acordo/', views.criar_acordo, name='criar_acordo'),
    path('verificar-cpf/', views.verificar_cpf, name='verificar_cpf'),
    path('salvar-acordo/', views.salvar_acordo, name='salvar_acordo'),
    path('editar-acordo/', views.editar_acordo, name='editar_acordo'),
    path('buscar-acordo-feito/', views.buscar_acordo_feito, name='buscar_acordo_feito'),
    path('detalhes-acordo/<str:acordo_id>/', views.detalhes_do_acordo, name='detalhes_do_acordo'),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
