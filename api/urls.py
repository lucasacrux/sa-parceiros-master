# chat/urls.py
from django.urls import path

from . import views

urlpatterns = [

    #API
    path('propostas/', views.PropostasList.as_view(), name='propostas-list'),
    path('acordos/', views.AcordosList.as_view(), name='acordos-list'),
    path('acordos-connect/', views.AcordosListConnect.as_view(), name='acordos-list-connect'),
    path('consultas/cnpj/', views.ConsultaCNPJView.as_view(), name='consulta-cnpj'),
    path('integrations/bigdatacorp/', views.BigDataIntegrationView.as_view(), name='integration-bdc'),
    path('public/consultations', views.PublicConsultationsProxy.as_view(), name='public-consultations'),
    path('consultations/history/', views.ConsultationsHistoryView.as_view(), name='consultations-history'),
    path('consultations/aggregations/time-series/', views.ProcessesTimeSeriesView.as_view(), name='processes-time-series'),
    path('consultations/aggregations/by-cnpj/', views.ProcessesByCNPJView.as_view(), name='processes-by-cnpj'),
    path('wallets/<uuid:wallet_id>/import/', views.WalletImportView.as_view(), name='wallets-import'),
    path('datasets/registry/', views.DatasetsRegistryView.as_view(), name='datasets-registry'),
    path('datasets/consult', views.ConsultByDatasetKeyView.as_view(), name='datasets-consult-by-key'),

]
