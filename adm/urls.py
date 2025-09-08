from django.urls import path
from django.conf import settings
from django.conf.urls.static import static 
from accounts.views import login_view
from . import views

urlpatterns = [
    path('usuarios/detalhes/<str:usuario_id>/', views.detalhes_usuario, name='adm_detalhes_usuario'),
    path('usuarios/criar', views.criar_usuario, name='adm_criar_usuario'),
    path('usuarios/', views.listar_usuarios, name='adm_listar_usuarios'),
    
    path('grupos/detalhes/<str:grupo_id>/', views.detalhes_grupo, name='adm_detalhes_grupo'),
    path('grupos/criar', views.criar_grupo, name='adm_criar_grupo'),
    path('grupos/', views.listar_grupos, name='adm_listar_grupos'),
    
    path('home/',  views.home, name='adm_home'),
    path('configuracoes/',  views.configuracoes, name='adm_configuracoes'),
    path('importacoes/',  views.importacoes, name='adm_importacoes'),
    path('business/',  views.business, name='adm_business'),
    path('parceiros/',  views.parceiros, name='adm_parceiros'),
    path('leads/',  views.leads, name='adm_leads'),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
