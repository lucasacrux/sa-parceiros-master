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

]
