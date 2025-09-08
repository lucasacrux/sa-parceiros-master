from django.urls import path
from django.conf import settings
from django.conf.urls.static import static 
from accounts.views import login_view
from . import views

urlpatterns = [
    path('login', login_view, name='login_view'),
    path('home', views.listar_parcelas, name='t_home'),
    path('leads', views.listar_leads, name='t_listar_leads'),
    path('busca', views.busca_pessoa, name='t_busca_pessoa'),
    path('consulta', views.consultar_cpf, name='t_consultar_cpf'),
    path('acordos/gerarboleto/<str:acordo_id>/', views.gerar_boleto, name='t_gerar_boleto'),
    path('acordos/aprovar/<str:acordo_id>/', views.aprovar_acordo, name='t_aprovar_acordo'),#Aprova a criação da proposta, o Lucas precisa acessar
    path('acordos/rejeitar/<str:acordo_id>/', views.rejeitar_acordo, name='t_rejeitar_acordo'),
    path('acordos/enviar/<str:acordo_id>/', views.enviar_acordo, name='t_enviar_acordo'),
    path('acordos/excluir/<str:acordo_id>/', views.excluir_acordo, name='t_excluir_acordo'),
    path('propostas/editar_acordo', views.editar_acordo, name='t_editar_acordo'),
    path('acordos/', views.listar_acordos, name='t_listar_acordos'),
    path('propostas/aprovar/<str:acordo_id>/', views.aprovar_proposta, name='t_aprovar_proposta'),#Aprova a criação do acordo, o devedor precisa aceitar
    path('propostas/rejeitar/<str:acordo_id>/', views.rejeitar_proposta, name='t_rejeitar_proposta'),
    path('propostas/visualizar/<str:url_proposta>/', views.ver_proposta, name='t_ver_proposta'),
    path('propostas/criar', views.criar_acordo, name='t_criar_acordo'),
    path('propostas/', views.listar_propostas, name='t_listar_propostas'),
    path('parcelas/', views.listar_parcelas, name='t_listar_parcelas'),
    path('propostas/concluida/', views.proposta_concluida, name='t_proposta_final'),
    path('contratos/<str:carteira>/<str:contrato>', views.baixar_contrato, name='baixar_contrato'),
    path('gerar-extrato/<str:contrato>', views.gerar_extrato, name='gerar-extrato'),
    path('extrato/<str:contrato>', views.renderizar_extrato, name='extrato'),

    # 
    # path("import/", views.importa_dados, name="t_importa_dados"),
    # path("import/save/", views.save_imported_data, name="save_imported_data"),
    # path('importa-dados/pessoas/', views.t_importa_dados_pessoas, name='t_importa_dados_pessoas'),
    # path('importa-dados/contratos/', views.t_importa_dados_contratos, name='t_importa_dados_contratos'),
    # path("lista-de-campos/", views.listar_campos, name="t_listar_campos"),
    # path("lista-de-leads/", views.listar_leads_banco, name="t_listar_leads_banco"),
    # path("deletar_lead/<str:cpf>/", views.deletar_lead, name="deletar_lead"),
    # path('detalhes/<str:cpf>/', views.detalhes_lead, name='detalhes_lead'),
    # path("download-error-file/<str:file_id>/", views.download_error_file, name="download_error_file"),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
handler404   = 'core.views.erro_404'
handler500   = 'core.views.erro_500'
