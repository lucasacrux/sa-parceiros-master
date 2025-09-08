from django.urls import path
from django.conf import settings
from django.conf.urls.static import static 
from . import views


urlpatterns = [
    path('home/',  views.home, name='business_home'),
    path('acoes/',  views.listar_acoes, name='business_listar_acoes'), 
    path('acoes/criar/',  views.acoes, name='business_acoes'),
    path('acoes/editar/<int:acao_id>/', views.editar_acao, name='business_editar_acao'),
    path('acoes/excluir/<int:acao_id>', views.excluir_acao, name='business_excluir_acao'),

    # Importação Start
    path('importar/novo/',  views.nova_importacao, name='business_nova_importacao'),
    path('importar/listar',  views.listar_importacao, name='business_listar_importacao'),
    
    path("importar/save/", views.save_imported_data, name="save_imported_data"),
    path('importar-dados/pessoas/', views.importar_dados_pessoas, name='business_importar_dados_pessoas'),
    path('importar-dados/contratos/', views.importar_dados_contratos, name='business_importar_dados_contratos'),
    # Importação End

    # Listagem Lead Start
    path("leads/", views.listar_leads, name="business_listar_leads"),
    path('leads/busca', views.busca_pessoa, name='business_busca_pessoa'),

    path("deletar_lead/<str:cpf>/", views.deletar_lead, name="business_deletar_lead"),
    path('detalhes/<str:cpf>/', views.detalhes_lead, name='business_detalhes_lead'),
    # Listagem Lead End

    # Segmentações Start
    path('segmentacoes/', views.listar_segmentacoes, name='business_listar_segmentacoes'),
    path('segmentacoes/criar/', views.criar_segmentacao, name='business_criar_segmentacao'),
    path('segmentacoes/editar/<str:id>', views.editar_segmentacao, name='business_editar_segmentacao'),
    path('segmentacoes/excluir/<int:id>', views.excluir_segmentacao, name='bussiness_excluir_segmentacao'),
    # Segmentações End
    
    # Fluxos Start
    path('fluxos/',  views.listar_fluxos, name='business_listar_fluxos'), 
    path('fluxos/criar/',  views.novo_fluxo, name='business_fluxos'),
    path('fluxos/executar/<int:fluxo_id>/', views.executar_fluxo, name='business_executar_fluxo'),
    path('fluxos/editar/<int:fluxo_id>/', views.editar_fluxo, name='business_editar_fluxo'),
    path('fluxos/excluir/<int:fluxo_id>/', views.excluir_fluxo, name='business_excluir_fluxo'),
    # Fluxos End
    
    # Campos Start
    path('campos/',  views.business_listar_campos, name='business_listar_campos'), 
    path('campos/criar/',  views.novo_campo, name='business_campos'),
    path('campos/editar/<str:id>', views.editar_campos, name='business_editar_campos'),
    path('campos/excluir/<str:id>', views.excluir_campos, name='business_excluir_campos'),
    # Campos End

    # Carteira Start
    path('carteiras/',  views.business_listar_carteiras, name='business_listar_carteiras'), 
    path('carteira/criar/',  views.nova_carteira, name='business_criar_carteira'),
    path('carteira/editar/<str:id>', views.editar_carteira, name='business_editar_carteira'),
    path('carteiras', views.business_excluir_carteira, name='business_excluir_carteira'),
    # Carteira End

    # Empresa Start
    path('minha-empresa/', views.business_minha_empresa, name='business_minha_empresa'),
    path('empresas/',  views.business_listar_empresas, name='business_listar_empresas'), 
    path('empresa/criar/',  views.nova_empresa, name='business_criar_empresa'),
    path('empresa/editar/<str:id>', views.editar_empresa, name='business_editar_empresa'),
    # Empresa End
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
