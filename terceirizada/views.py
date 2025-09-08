import tempfile
import threading
from django.shortcuts import get_object_or_404, render
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.utils.encoding import smart_str

from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Q
from decimal import Decimal, InvalidOperation
from datetime import datetime
import calendar
import time as time_module
from django.conf import settings
from core.models import Acordo
from accounts.models import Grupo
from levas.models import PessoasTerceirizadas
import terceirizada.resolvecontas as resolvecontas
from .acruxdb import AcruxDB, AcruxDBDataLake, ParceirosDB
from django.http import FileResponse, JsonResponse
#from djqscsv import render_to_csv_response
import pandas as pd
import re
import requests
from django.utils import timezone
import json
import pytz
from django.http import HttpResponse
from io import BytesIO
import secrets
import string
from .notify import ChatZ
import os
import pdfkit
from django.template.loader import get_template
from io import BytesIO
from tempfile import NamedTemporaryFile
from dotenv import load_dotenv
from .gcpstorage import StorageGCP, DbCON, SheetsGCP
from .scripts.dbaccess import ResolveDB
import logging
#import locale

logger = logging.getLogger(__name__)
 

WHTML = os.environ.get('WHTML') 
ROOTPATH = os.environ.get('ROOTPATH')

def formata_cpf(cpf):
    return cpf[:3] + '.' + cpf[3:6] + '.' + cpf[6:9] + '-' + cpf[9:]


gcp = StorageGCP()          #Classe do CLOUD


def export_excel(df, mes):
    with BytesIO() as b:
        # Use the StringIO object as the filehandle.
        writer = pd.ExcelWriter(b, engine='openpyxl')
        df.to_excel(writer, sheet_name='Sheet1')
        writer.close()
        # Set up the Http response.
        filename = f'PagamentosRealizados_{mes}.xlsx'
        response = HttpResponse(
            b.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename=%s' % filename
        return response
    

DICT_MESES = {
    'Janeiro'  : '01',
    'Fevereiro': '02',
    'MarÃ§o'    : '03',
    'Abril'    : '04',
    'Maio'     : '05',
    'Junho'    : '06',
    'Julho'    : '07',
    'Agosto'   : '08',
    'Setembro' : '09',
    'Outubro'  : '10',
    'Novembro' : '11',
    'Dezembro' : '12'
}


#locale.setlocale(locale.LC_TIME, 'pt_BR.UTF-8')

mes_atual = datetime.now().month
mes_atual = datetime.now().month
MESES_PT  = ['Janeiro', 'Fevereiro', 'MarÃ§o', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
MESES     = MESES_PT[mes_atual-1::-1]

#MESES = ['Abril', 'MarÃ§o', 'Fevereiro', 'Janeiro']


def calculaComissao(row, tabela):
    pct_comissao_ter      = 0
    valor_comissao_ter    = 0
    
    if tabela == 1:
        if row['aging'] <= 30:
            pct_comissao_ter = 0.02
        elif row['aging'] <= 60:
            pct_comissao_ter = 0.03
        elif row['aging'] <= 90:
            pct_comissao_ter = 0.05
        elif row['aging'] <= 120:
            pct_comissao_ter = 0.07
        elif row['aging'] <= 180:
            pct_comissao_ter = 0.1
        elif row['aging'] <= 360:
            pct_comissao_ter = 0.12
        elif row['aging'] <= 720:
            pct_comissao_ter = 0.15
        elif row['aging'] <= 1800:
            pct_comissao_ter = 0.25
        else:
            pct_comissao_ter = 0.35
    else:
        if row['aging'] <= 30:
            pct_comissao_ter = 0.02
        elif row['aging'] <= 60:
            pct_comissao_ter = 0.04
        elif row['aging'] <= 90:
            pct_comissao_ter = 0.07
        elif row['aging'] <= 180:
            pct_comissao_ter = 0.1
        elif row['aging'] <= 364:
            pct_comissao_ter = 0.15
        elif row['aging'] <= 730:
            pct_comissao_ter = 0.20
        elif row['aging'] <= 1260:
            pct_comissao_ter = 0.25
        elif row['aging'] <= 1520:
            pct_comissao_ter = 0.27
        elif row['aging'] <= 1800:
            pct_comissao_ter = 0.30
        else:
            pct_comissao_ter = 0.35
        
   
    valor_comissao_ter    = (row['valor'] * pct_comissao_ter)
    return pct_comissao_ter, valor_comissao_ter


def get_model_field_names(model, ignore_fields=['content_object']):
    '''
    ::param model is a Django model class
    ::param ignore_fields is a list of field names to ignore by default
    This method gets all model field names (as strings) and returns a list 
    of them ignoring the ones we know don't work (like the 'content_object' field)
    '''
    model_fields = model._meta.get_fields()
    model_field_names = list(set([f.name for f in model_fields if f.name not in ignore_fields]))
    return model_field_names


def get_lookup_fields(model, fields=None):
    '''
    ::param model is a Django model class
    ::param fields is a list of field name strings.
    This method compares the lookups we want vs the lookups
    that are available. It ignores the unavailable fields we passed.
    '''
    model_field_names = get_model_field_names(model)
    if fields is not None:
        '''
        we'll iterate through all the passed field_names
        and verify they are valid by only including the valid ones
        '''
        lookup_fields = []
        for x in fields:
            if "__" in x:
                # the __ is for ForeignKey lookups
                lookup_fields.append(x)
            elif x in model_field_names:
                lookup_fields.append(x)
    else:
        '''
        No field names were passed, use the default model fields
        '''
        lookup_fields = model_field_names
    #lookup_fields.append('status_pagamento')
    return lookup_fields


def qs_to_dataset(qs, fields=None):
    '''
    ::param qs is any Django queryset
    ::param fields is a list of field name strings, ignoring non-model field names
    This method is the final step, simply calling the fields we formed on the queryset
    and turning it into a list of dictionaries with key/value pairs.
    '''

    lookup_fields = get_lookup_fields(qs.model, fields=fields)
    return qs.values(*lookup_fields)

def retornaComissoes(df_acordos, id_closer=None, tabela=1):
    df_acordos[['pct_ter', 'valor_ter']] = 0
    for _, row in df_acordos.iterrows():
        pct_ter, valor_ter = calculaComissao(row, tabela)
        df_acordos['pct_ter'].iloc[_]      = round(pct_ter * 100, 2) 
        df_acordos['valor_ter'].iloc[_]    = round(valor_ter, 2)             
    TOTAL_COMISSAO_PAGA = 0
    if id_closer:
        print('calculou como closer')
        TOTAL_COMISSAO_PAGA  = df_acordos[df_acordos['closer_id']==id_closer]['valor_ter'].sum()
    else:
        TOTAL_COMISSAO_PAGA  = df_acordos['valor_ter'].sum() 
    return df_acordos.T.to_dict(), TOTAL_COMISSAO_PAGA
    
    

def somenteNumeros(cpf):
    return cpf.replace('-', '').replace('.','').replace('(','').replace(')','').replace(' ', '')


def consulta_pessoa(cpf):
    url = f'https://datahub.resolvecontas.com.br/api/pessoas?cpf={cpf}'
    response = requests.get(url)
    return response


def somenteNumerosCpf(cpf):
    cpf = cpf.replace('.','').replace('-','')
    return cpf

@login_required
def home(request):
    if not request.user.is_authenticated:
        return redirect('/accounts/login/')
    if request.user.grupo.tipo == 'business':
        return redirect('/business/home/')
        
    return render(request, 't_home.html')



def consultar_cpf(request):
    if not request.user.is_authenticated:
        return redirect('/accounts/login/')
    if request.user.grupo.tipo == 'business':
        return redirect('/business/home/')
    
    context = {
        'usuario_logado'             : request.user
    }
    return render(request, 't_consultar_cpf.html', context)


def busca_pessoa(request):
    if not request.user.is_authenticated:
        return redirect('/accounts/login/')
    
    if request.user.grupo.tipo == 'business':
        return redirect('/business/home/')
            
    try:
        cpf              = request.GET['cpf']
        cpf              = somenteNumerosCpf(cpf)
        
        dict_filters = {}
        dict_filters['cpf'] = cpf
        dict_filters['terceirizada'] = request.user.grupo.id_central 
        filter_q   = Q(**dict_filters)
        pessoa = PessoasTerceirizadas.objects.filter(filter_q)
        if len(pessoa) == 0:
            pessoa = None
        else:
            db_datalake      = AcruxDBDataLake()
            db_resolvecontas = AcruxDB()
            pessoa    = db_datalake.retornaPessoa(cpf)[0]
            telefones = db_datalake.retornaTelefones(cpf)
            emails    = db_datalake.retornaEmails(cpf)
            acordos   = db_resolvecontas.retornaAcordosPessoa(cpf)
            contratos = db_resolvecontas.retornaContratosPessoa(cpf)
    except:
        pessoa = None
    
    if not pessoa:
        return render(request, 'not_found.html')
    
    dict_descontos = {}
    for contrato in contratos:
        dict_descontos[contrato['numeroContrato']] = []
        descontos = db_resolvecontas.retornaDescontosCampanha(contrato['campanha_desconto'])
        for desconto in descontos:
            pct_desconto = (contrato['saldoAPagar'] / 100) * desconto['valor']
            oferta_desconto = round(contrato['saldoAPagar'] - pct_desconto, 2)
            dict_desc = {
                'nome'              : desconto['nome'],
                'qtd_parcelas'      : desconto['quantidade_parcelas'],
                'pct_desconto'      : desconto['valor'],
                'condicao_pagamento': desconto['condicao_pagamento'],
                'oferta_desconto'   : oferta_desconto,
                'valor_original'    : contrato['saldoAPagar']
            }
            dict_descontos[contrato['numeroContrato']].append(dict_desc)
     
            
    context = {
        'pessoa'   : pessoa,
        'acordos'  : acordos,
        'contratos': contratos,
        'telefones': telefones,
        'emails'   : emails,
        'descontos': dict_descontos,
        'usuario_logado': request.user
    }
    return render(request, 't_resultado_busca_pessoa.html', context)




def listar_leads(request):
    if not request.user.is_authenticated:
        return redirect('/accounts/login/')

    if request.user.grupo.tipo == 'business':
        return redirect('/business/home/')
    
    usuario_logado  = request.user
    dict_filters = {}
    cpf_pesquisa = request.GET.get('cpf_pesquisa')
    if not cpf_pesquisa or len(cpf_pesquisa) < 3:
        cpf_pesquisa = ''
    else:
        dict_filters['cpf'] = somenteNumeros(cpf_pesquisa)
    
    dict_filters['terceirizada'] = usuario_logado.grupo.id_central 
    filter_q   = Q(**dict_filters)
    leads_list = PessoasTerceirizadas.objects.filter(filter_q).order_by('nome')
            
    total_registros = len(leads_list)
    page            = request.GET.get('page', 1)
    paginator       = Paginator(leads_list, 30)
    
    try:
        leads = paginator.page(page)
    except PageNotAnInteger:
        leads = paginator.page(1)
    except EmptyPage:
        leads = paginator.page(paginator.num_pages)
        
    context = {
        'leads'          : leads,
        'total_registros': total_registros,
        'usuario_logado' : request.user,
        'cpf_pesquisa'   : cpf_pesquisa
    }
    return render(request, 't_listar_leads.html', context)





def listar_propostas(request):
    if not request.user.is_authenticated:
        return redirect('/accounts/login/')
    if request.user.grupo.tipo == 'business':
        return redirect('/business/home/')
    usuario_logado     = request.user
    status_selecionado = request.GET.get('situacao')
    closer_selecionado = request.GET.get('closer')
    cpf_pesquisa       = request.GET.get('cpf_pesquisa')

    dict_filters = {}
    if not status_selecionado:
        status_selecionado = 'Todos'
        
    dict_filters['url_proposta__isnull'] = False
        
    if not closer_selecionado or closer_selecionado == 'Todos':
        closer_selecionado = 'Todos'
    else:
        dict_filters['grupo_owner__title'] = closer_selecionado

    if not cpf_pesquisa or len(cpf_pesquisa) < 3:
        cpf_pesquisa = ''
    else:
        dict_filters['cpf'] = somenteNumeros(cpf_pesquisa)
        
    if usuario_logado.grupo.id_resolvecontas != 58:
        dict_filters['grupo_owner'] = usuario_logado.grupo.id
        
    filter_q = Q(**dict_filters)
    acordos_list = Acordo.objects.filter(filter_q).order_by('-created_at')
    for acordo in acordos_list:
       
        if acordo.status_proposta == 'Aberta':
            if acordo.data_expiracao_proposta < datetime.now().replace(tzinfo=pytz.UTC):
                acordo.status_proposta = 'Expirada'
                acordo.save()
                
    status_list     = ['Aberta', 'Expirada', 'Declinada']
    grupos          = Grupo.objects.all().order_by('title')
    total_registros = len(acordos_list)
    page            = request.GET.get('page', 1)
    paginator       = Paginator(acordos_list, 30)
    
    try:
        acordos = paginator.page(page)
    except PageNotAnInteger:
        acordos = paginator.page(1)
    except EmptyPage:
        acordos = paginator.page(paginator.num_pages)
        
  
            
    context = {
        'acordos'           : acordos,
        'total_registros'   : total_registros,
        'status_list'       : status_list,
        'grupos_list'       : grupos,
        'status_selecionado': status_selecionado,
        'closer_selecionado': closer_selecionado,
        'cpf_pesquisa'      : cpf_pesquisa,
        'usuario_logado'    : usuario_logado
        
    }
    return render(request, 't_listar_propostas.html', context)



def listar_acordos(request):
    if not request.user.is_authenticated:
        return redirect('/accounts/login/')
    if request.user.grupo.tipo == 'business':
        return redirect('/business/home/')
    usuario_logado     = request.user
    status_selecionado = request.GET.get('situacao')
    closer_selecionado = request.GET.get('closer')
    cpf_pesquisa       = request.GET.get('cpf_pesquisa')

    
    dict_filters = {}
    if not status_selecionado:
        status_selecionado = 'Todos'
        
    if status_selecionado != 'Todos':
        dict_filters['status'] = status_selecionado  
        
    if not closer_selecionado or closer_selecionado == 'Todos':
        closer_selecionado = 'Todos'
    else:
        dict_filters['grupo_owner__title'] = closer_selecionado

    if not cpf_pesquisa or len(cpf_pesquisa) < 3:
        cpf_pesquisa = ''
    else:
        dict_filters['cpf'] = somenteNumeros(cpf_pesquisa)
        
    if usuario_logado.grupo.id_resolvecontas != 58:
        dict_filters['grupo_owner'] = usuario_logado.grupo.id
        
    #if usuario_logado.adm == 0:
    #    dict_filters['user_owner'] = usuario_logado.id
        
                
    filter_q = Q(**dict_filters)
    if len(dict_filters) > 0:
        acordos_list = Acordo.objects.filter(filter_q).exclude(status='SimulaÃ§Ã£o').order_by('-created_at')
    else:
        acordos_list = Acordo.objects.exclude(status='SimulaÃ§Ã£o').order_by('-created_at')
        
    status_list = ['Todos', 'Normal', 'Quebrado', 'Atrasado', 'Liquidado']
    grupos      = Grupo.objects.all().order_by('title')
    total_registros = len(acordos_list)
    page            = request.GET.get('page', 1)
    paginator       = Paginator(acordos_list, 30)
    
    try:
        acordos = paginator.page(page)
    except PageNotAnInteger:
        acordos = paginator.page(1)
    except EmptyPage:
        acordos = paginator.page(paginator.num_pages)
            
    context = {
        'acordos'           : acordos,
        'total_registros'   : total_registros,
        'status_list'       : status_list,
        'grupos_list'       : grupos,
        'status_selecionado': status_selecionado,
        'closer_selecionado': closer_selecionado,
        'cpf_pesquisa'      : cpf_pesquisa,
        'usuario_logado'    : usuario_logado
        
    }
    return render(request, 't_listar_acordos.html', context)



def gerar_boleto(request, acordo_id):
    usuario_logado = request.user
    acordo = Acordo.objects.get(id=acordo_id)
    if acordo.id_resolvecontas:
        try:
            acordo_ativo = consulta_pessoa(acordo.cpf).json()
            acordo_ativo = acordo_ativo['result'][0]['acordo_ativo'][0]
            if acordo_ativo['acordoId'] == acordo.id_resolvecontas:
                parcela_a_emitir = None
                for parcela in acordo_ativo['parcelas']:
                    if not parcela['dados_metodo_pagamento']:
                        parcela_a_emitir = parcela
                        break
                if parcela_a_emitir:
                    if parcela_a_emitir['parcela_id']:
                        dict_parcela = {
                            'id_parcela'        : parcela_a_emitir['parcela_id'],
                            'cpf'               : acordo.cpf,
                            'carteira_id'       : acordo.carteira_id
                        }
                        response = resolvecontas.emitir_cobranca(dict_parcela)
                        numero_boleto = response.json().get('numero')
                        if numero_boleto:
                            return JsonResponse({"success": True, "message": "Boleto emitido com sucesso."})     
                        return JsonResponse({'error': 'Erro ao emitir boleto'}, status=404)
            else:
                return JsonResponse({'error': 'Acordo invÃ¡lido'}, status=404)
        except Acordo.DoesNotExist:
            return JsonResponse({'error': 'Acordo nÃ£o encontrado'}, status=404)
    else:
        return JsonResponse({'error': 'Acordo desconhecido'}, status=404)
    



def rejeitar_acordo(request, acordo_id):
    acordo = Acordo.objects.get(id=acordo_id)
    acordo.status_proposta = 'Rejeitada'
    acordo.save()
    return redirect('/t/parcelas/') 



def aprovar_acordo(request, acordo_id):
    # acordo = Acordo.objects.get(id=acordo_id)
    # dict_aceite = {
    #     'id_acordo'  : acordo.id_resolvecontas,
    #     'cpf'        : acordo.cpf,
    #     'data_aceite': datetime.today().date().strftime("%Y-%m-%d"),
    #     'parcelas'   : acordo.parcelas
    # }    
    # try:
    #     response = resolvecontas.aceitar_acordo(dict_aceite)
    #     if 'errors' in response.json():
    #         return None, response.json()['message']
    # except:
    #     return None, 'Erro ao aceitar acordo'
    # acordo.status = 'Normal'
    # acordo.save()
    # return redirect('/t/parcelas/') 
    acordo = Acordo.objects.get(id=acordo_id)
    acordo.status_proposta = 'Aberta'
    acordo.save()
    return redirect('/t/parcelas/') 



def excluir_acordo(request, acordo_id):
    acordo = Acordo.objects.get(id=acordo_id)
    acordo.delete()
    return redirect('/t/acordos/') 
    
    

def enviar_acordo(request, acordo_id):
    usuario_logado       = request.user
    continuar            = request.GET.get('continuar', False)
    sobescrever          = request.GET.get('subs', False)
    acordo               = Acordo.objects.get(id=acordo_id)
    
    if acordo.mensagens:
        dict_acordo = {
            'cpf'                   : acordo.cpf,
            'contrato_id'           : acordo.contrato_id,
            'contrato_list'         : acordo.contratos,
            'contrato_num'          : acordo.contrato_num,
            'valorTotalAcordo'      : float(acordo.valor_do_acordo),
            'desconto'              : 0,
            'parcelas'              : acordo.parcelas,
            'percDesconto'          : 0,
            'qtd_parcelas'          : acordo.num_parcelas_acordo,
            'closer_id'             : acordo.closer_id,
            'sdr_id'                : acordo.sdr_id,
            'email'                 : acordo.email,
            'telefone'              : acordo.telefone,
            'carteira_id'           : acordo.carteira_id,
            'dataPrimeiroVencimento': acordo.dia_vencimento_primeira_parcela.strftime("%Y-%m-%d")
        }
        
    else:
        
        dict_acordo = {
            'cpf'                   : acordo.cpf,
            'contrato_id'           : acordo.contrato_id,
            'contrato_list'         : acordo.contratos,
            'contrato_num'          : acordo.contrato_num,
            'valorTotalAcordo'      : float(acordo.valor_do_acordo),
            'desconto'              : 0,
            'parcelas'              : acordo.parcelas,
            'percDesconto'          : 0,
            'qtd_parcelas'          : acordo.num_parcelas_acordo,
            'closer_id'             : acordo.grupo_owner.id_resolvecontas,
            'email'                 : acordo.email,
            'telefone'              : acordo.telefone,
            'carteira_id'           : acordo.carteira_id,
            'dataPrimeiroVencimento': acordo.dia_vencimento_primeira_parcela.strftime("%Y-%m-%d")
        }

    id_resolvecontas, msg = resolvecontas.pipeline_acordo_parceiro(dict_acordo, sobescrever, simulacao=False)
    if id_resolvecontas:
        acordo.id_resolvecontas = id_resolvecontas
        acordo.status           = 'Normal'
        acordo.status_proposta  = 'Aceita'
        acordo.data_aceite      = datetime.now()
        acordo.save()
    else:
        print('Retornou um erro:', msg)
        return JsonResponse({'error': msg}, status=500)
    return redirect('/t/propostas/concluida/') 


cht = ChatZ() #inicia o cÃ³digo para enviar a notificaÃ§Ã£o
pcdb = ParceirosDB() #acessa o banco de dados para pegar o nÃºmero do ID da tabela, esse ID Ã© o ID que preenche automatico quando cria uma nova linha


@csrf_exempt
def criar_acordo(request):
    if request.method == 'POST':
        data                            = json.loads(request.body)
        cpf                             = somenteNumeros(data.get('cpf'))
        contratos_list                  = data.get('contratos')
        origem_mensagens                = data.get('mensagens')
        id_closer                       = data.get('id_closer')
        id_sdr                          = data.get('id_sdr')
        contratos_list_ids              = resolvecontas.retorna_contrato_id_unico(cpf, contratos_list)
        contrato_id                     = contratos_list_ids[0]
        carteiraId                      = data.get('carteiraId')
        nome_pessoa                     = data.get('nome_pessoa')
        raw_valor_do_acordo             = data.get('valor_do_acordo', '0').replace('.', '').replace(',', '.')
        raw_valor_pendente              = data.get('valor_pendente', '0')
        raw_valor_parcela               = data.get('valor_parcela', '0').replace('.', '').replace(',', '.')
        raw_maiorDescontoValor          = data.get('maiorDescontoValor', '0')
        raw_menorDescontoValor          = data.get('menorDescontoValor', '0')
        num_parcelas_acordo             = data.get('numParcelas')
        dia_vencimento_primeira_parcela = data.get('dia_vencimento_primeira_parcela')
        dia_vencimento_proxima_parcela  = data.get('dia_vencimento_proxima_parcela')
        email                           = data.get('email')
        telefone                        = somenteNumeros(data.get('telefone'))
        status                          = data.get('status')
        acordoId                        = data.get('acordoId')
        parcelas                        = data.get('parcelas', [])
        minParcelas                     = data.get('minParcelas')
        maxParcelas                     = data.get('maxParcelas')        
        maiorDescontoValor              = Decimal(raw_maiorDescontoValor)
        menorDescontoValor              = Decimal(raw_menorDescontoValor)
        data_aceite                     = data.get('data_aceite')
        valor_do_acordo                 = Decimal(raw_valor_do_acordo)
        valor_pendente                  = Decimal(raw_valor_pendente)
        valor_parcela                   = Decimal(raw_valor_parcela)
        dia_vencimento_primeira_parcela = datetime.strptime(dia_vencimento_primeira_parcela, '%d/%m/%Y').date()
        dia_vencimento_proxima_parcela  = datetime.strptime(dia_vencimento_proxima_parcela, '%Y-%m-%d').date()
        contratos                       = ', '.join(contratos_list)
        
        
        
        if origem_mensagens:
            grupo = Grupo.objects.get(id=3) #Acrux
        else:
            grupo = request.user.grupo
        
        valor_total_acordo = 0
        for parcela in parcelas:
            valor_total_acordo += float(parcela['valor'].replace(',','.'))
        valor_do_acordo = round(valor_total_acordo, 2)
        
        
    
        
        diff = float(valor_do_acordo) - float(maiorDescontoValor)
        status_proposta = 'Aberta'
        aprovacao = False

        if diff < -100:
            print('Valor abaixo')
            status_proposta = 'Aprovar'
            aprovacao = True
            
        # initializing size of string
        N = 8
        
        # using secrets.choice()
        # generating random strings
        res_slug = ''.join(secrets.choice(string.ascii_uppercase + string.digits)
                    for i in range(N))
        
    
        if acordoId:
            acordo = Acordo.objects.get(acordo_id=acordoId)
        else:
            acordos_list = Acordo.objects.filter(cpf=cpf, status='SimulaÃ§Ã£o', status_proposta='Aberta')
            for acordo in acordos_list:
                acordo.status_proposta = 'Cancelada'
                acordo.save()
            
        
            
            acordo = Acordo(
                cpf                             = cpf,
                contratos                       = contratos,
                contrato_num                    = contratos_list[0],
                contrato_id                     = contrato_id,
                carteira_id                     = carteiraId[0],
                valor_do_acordo                 = valor_do_acordo,
                valor_pendente                  = valor_pendente,
                valor_parcela                   = valor_parcela,
                num_parcelas_acordo             = num_parcelas_acordo,
                dia_vencimento_primeira_parcela = dia_vencimento_primeira_parcela,
                dia_vencimento_proxima_parcela  = dia_vencimento_proxima_parcela,
                email                           = email,
                telefone                        = telefone,
                status                          = status,
                parcelas                        = parcelas,
                min_parcelas                    = minParcelas,
                max_parcelas                    = maxParcelas,
                maior_desconto_valor            = maiorDescontoValor,
                menor_desconto_valor            = menorDescontoValor,
                data_aceite                     = data_aceite,
                url_proposta                    = res_slug,
                nome_pessoa                     = nome_pessoa,
                status_proposta                 = status_proposta,
                closer_id                       = id_closer,
                sdr_id                          = id_sdr,
                mensagens                       = origem_mensagens,
                grupo_owner                     = grupo
            )
        response = acordo.save()
        
        
        try:
            user_first_name = request.user.first_name
        except:
            user_first_name = '' 
        
        # ---------------- dict abaixo utilizado para enviar a notificaÃ§Ã£o --------------------
        dict_notify = {'user'         : user_first_name, 
                       'grupo'        : grupo,
                       'devedor'      : nome_pessoa,
                       'num_parcela'  : num_parcelas_acordo,
                       'valor_acordo' : valor_do_acordo,
                       'valor_parcela': valor_parcela,
                       'id_proposta'  : res_slug,                        #ESSE ID Ã‰ PARA ACESSAR A PROPOSTA
                       'aprovacao'    : aprovacao,
                       'id_acordo'    : pcdb.get_id_acordo(cpf=cpf),     #ESSE ID NÃƒO Ã‰ O DO RESOLVE CONTAS, Ã‰ O ID AUTO-FIL DA TABELA CORE-ACORDOS
                       'valor_aberto' : valor_pendente,
                       'primeira_parc': dia_vencimento_primeira_parcela,
                       'demais_parc'  : dia_vencimento_proxima_parcela
                       }
        cht.notify(dict_notify)
        
        if origem_mensagens:
            return JsonResponse({"sucesso": res_slug})
        
        #------------------------ FIM DA NOTIFICAÃ‡ÃƒO ---------------------------
        # print(f'Proposta criada: {dict_notify["id_acordo"]}') 
        return redirect('/t/propostas/') 
    return render(request, 't_criar_acordo.html')



def editar_acordo(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        print("EDITANDO ACORDO")
        print(data)
        acordo_id = data.get('acordo_id')

        if not acordo_id:
            print("Erro: ID do acordo Ã© necessÃ¡rio para atualizar.")
        try:
            acordo = Acordo.objects.get(id=acordo_id)
            acordo.valor_do_acordo = Decimal(data.get('valor_do_acordo').replace('.', '').replace(',', '.'))
            acordo.num_parcelas_acordo = data.get('numParcelas')
            acordo.valor_parcela = Decimal(data.get('valor_parcela').replace('.', '').replace(',', '.'))
            acordo.dia_vencimento_primeira_parcela = datetime.strptime(data.get('dia_vencimento_primeira_parcela'), '%d/%m/%Y').date()
            acordo.dia_vencimento_proxima_parcela = datetime.strptime(data.get('dia_vencimento_proxima_parcela'), '%Y-%m-%d').date()
            acordo.email = data.get('email')
            acordo.telefone = somenteNumeros(data.get('telefone'))
            acordo.parcelas = data.get('parcelas', [])
            
            acordo.save()
            return JsonResponse({"success": True, "message": "Acordo atualizado com sucesso."})

        except Acordo.DoesNotExist:
            print("Erro: Acordo nÃ£o encontrado.")
        except Exception as e:
            print(f"Erro ao atualizar o acordo: {e}")

    print("Erro: MÃ©todo invÃ¡lido.")



def listar_parcelas(request):
    if not request.user.is_authenticated:
        return redirect('/accounts/login/')

    if request.user.grupo.tipo == 'business':
        return redirect('/business/home/')
    
    usuario_logado  = request.user
    mes_selecionado = request.GET.get('mes')
    acao            = request.GET.get('op')
    hoje            = datetime.today().date().strftime("%Y-%m-%d")
    
    id_sdr          = None
    id_closer       = None
    
    if mes_selecionado and mes_selecionado != '':
        mes_data = DICT_MESES.get(mes_selecionado)
    else:
        mes_selecionado = MESES[0]
        mes_data = hoje.split('-')[1]
            
    #if not usuario_logado.supergerente:
    id_closer = usuario_logado.grupo.id_resolvecontas

    mes_anterior = str(int(mes_data) - 1)
    inicio   = f'2025-{mes_data}-01'
    inicio_mes_anterior = f'2025-{mes_anterior}-01'
    prox_mes = str(int(mes_data) + 1)
    ano = '2025'
    
    if int(mes_anterior) == 0:
        mes_anterior = 12
        inicio_mes_anterior = f'2024-{mes_anterior}-01'
        
    
    if int(mes_data) == 12:
        ano = '2024'
        
    if prox_mes == '13':
        prox_mes = '1'
        ano = '2025'
        
    if len(prox_mes) == 1:
        prox_mes = '0'+prox_mes
    fim    = f'{ano}-{prox_mes}-01'

    db_resolvecontas  = AcruxDB()
    db_datalake       = AcruxDBDataLake()
    pagos             = db_resolvecontas.retornaPagamentosRealizados(id_closer, id_sdr, inicio, fim)
    pendentes         = db_resolvecontas.retornaPagamentosPendentes(id_closer, id_sdr, inicio_mes_anterior, fim)
    previstos         = db_resolvecontas.retornaPagamentosPrevistos(id_closer, id_sdr, inicio, fim)
    
    acordos           = db_resolvecontas.retornaAcordosPeriodo(inicio, fim, id_closer)
    acordos_hoje      = db_resolvecontas.retornaAcordosPeriodo(hoje, hoje, id_closer)
    
    acordos_pendentes = Acordo.objects.filter(status_proposta='Aprovar').order_by('-data_criacao')
    total_acordos_pendentes = len(acordos_pendentes)
    
    
    df_pagos          = pd.DataFrame(pagos)
    df_pendentes      = pd.DataFrame(pendentes)
    df_acordos        = pd.DataFrame(acordos)
    df_previstos      = pd.DataFrame(previstos)

    if df_pagos.shape[0] > 0 and df_pendentes.shape[0] > 0:
        df_pendentes      = df_pendentes[~df_pendentes['idAcordo'].isin(df_pagos['idAcordo'])].reset_index()
    
    if df_pendentes.shape[0] > 0 and df_previstos.shape[0] > 0:
        df_previstos      = df_previstos[~df_previstos['idAcordo'].isin(df_pendentes['idAcordo'])].reset_index()
        if df_pagos.shape[0] > 0:
            df_previstos      = df_previstos[~df_previstos['idAcordo'].isin(df_pagos['idAcordo'])].reset_index()    
        
        
    df_acordos_hoje   = pd.DataFrame(acordos_hoje)
    total_acordos_mes = df_acordos.shape[0]
    
    acordos_operador       = df_acordos.copy()
    acordos_hoje_operador  = df_acordos_hoje.copy()
    total_acordos_operador = acordos_operador.shape[0]
    total_acordos_hoje_operador = acordos_hoje_operador.shape[0]
    
    
    print("ID CLOSER", id_closer, id_sdr)
    print('PENDENTES')
    tabela = 1
    if id_closer == 92:
        tabela = 2
    if df_pendentes.shape[0] > 0:
        dict_acordos_pendentes, total_comissao_pendente = retornaComissoes(df_pendentes.copy(), id_closer, tabela)
    else:
        dict_acordos_pendentes  = {}
        total_comissao_pendente = 0
    
    print('PREVISTOS')
    if df_previstos.shape[0] > 0:
        dict_acordos_previstos, total_comissao_previsto = retornaComissoes(df_previstos.copy(), id_closer, tabela)
    else:
        dict_acordos_previstos  = {}
        total_comissao_previsto = 0    
    
    print('PAGOS')
    if df_pagos.shape[0] > 0:
        df_pagos['valor'] = df_pagos['valor_pago']
        dict_acordos_pagos    , total_comissao_paga     = retornaComissoes(df_pagos.copy(), id_closer, tabela)
    else:
        dict_acordos_pagos  = {}
        total_comissao_paga = 0
        
    try:
        saudacao = f'OlÃ¡, {usuario_logado.first_name.split()[0]}.'
    except Exception as e:
        saudacao = ''
        
    ### ACORDOS DIA A DIA
    labels_dia_dia = ''
    acordos_dia_dia= ''
    if acordos_operador.shape[0] > 0:
        acordos_operador['dia_aceite'] = acordos_operador['dataAceite'].astype(str).apply(lambda x: x.split('-')[2])
        dict_acordos_dia = acordos_operador.groupby('dia_aceite')['acordoId'].count().to_dict()
        dict_dia_dia = {}
        for i in range(1, 32):
            dia = str(i)
            if len(dia) == 1:
                dia = '0'+dia
            dict_dia_dia[dia] = dict_acordos_dia.get(dia, 0)
        labels_dia_dia = '"' + '", "'.join(list(dict_dia_dia.keys())) + '"'
        acordos_dia_dia = [str(x) for x in list(dict_dia_dia.values())]  
        acordos_dia_dia = ','.join(acordos_dia_dia)
    

    comissionamento_total =  round(total_comissao_paga,2) + round(total_comissao_pendente, 2) + round(total_comissao_previsto, 2)
    
    if  acao == 'Exportar':
        print(dict_acordos_pagos)
        df_comissao_paga = pd.DataFrame.from_dict(dict_acordos_pagos).T
        df_comissao_paga = df_comissao_paga[['idAcordo', 'cpfDevedor','nome', 'dataAceite','numeroContrato','aging', 'qtdParcelas', 'numeroParcela', 'valor', 'formaPagamento', 'situacaoPagamento', 'dataVencimento', 'valor_pago', 'pctRecuperado', 'data_pagamento', 'pct_ter', 'valor_ter']]
        return export_excel(df_comissao_paga, mes_selecionado)
        
        
    context = {
        'total_comissao_paga'            : round(total_comissao_paga,2),
        'total_comissao_pendente'        : round(total_comissao_pendente, 2),
        'total_comissao_previsto'        : round(total_comissao_previsto, 2),
        'comissionamento_total'          : round(comissionamento_total, 2),
        'dict_acordos_pagos'             : dict_acordos_pagos,
        'dict_pendentes'                 : dict_acordos_pendentes,
        'dict_previstos'                 : dict_acordos_previstos,
        'mes_selecionado'                : mes_selecionado,
        'meses'                          : MESES,
        'saudacao'                       : saudacao,
        'total_acordos_mes'              : total_acordos_mes,
        'total_acordos_operador'         : total_acordos_operador,
        'total_acordos_hoje_ope'         : total_acordos_hoje_operador,
        'labels_dia_dia'                 : labels_dia_dia,
        'acordos_dia_dia'                : acordos_dia_dia,
        'usuario_logado'                 : usuario_logado,
        'acordos_pendentes'              : acordos_pendentes,
        'total_acordos_pendentes'        : total_acordos_pendentes,
    }
    return render(request, 't_parcelas.html', context)



def aprovar_proposta(request, acordo_id):
    acordo               = Acordo.objects.get(id=acordo_id)
    
    if 2 == 5:
        acordo.id_resolvecontas = 1
        acordo.status           = 1
        acordo.data_aceite      = datetime.now()
        acordo.save()
    else:
        return JsonResponse({'status': 'Recebeu chamado'}, status=200)
    return redirect('/t/propostas/') 


def rejeitar_proposta(request, acordo_id):
    acordo               = Acordo.objects.get(id=acordo_id)
    
    if 2 == 5:
        acordo.id_resolvecontas = 1
        acordo.status           = 1
        acordo.data_aceite      = datetime.now()
        acordo.save()
    else:
        return JsonResponse({'status': 'Recebeu chamado'}, status=200)
    return redirect('/t/propostas/') 


def ver_proposta(request, url_proposta):
    dict_empresa = {
        1: 'Acrux Securitizadora SA',
        2: 'Acrux Securitizadora SA',
        3: 'Betacrux Securitizadora LTDA',
        4: 'Acrux Securitizadora SA',
        5: 'Acrux Securitizadora SA',
    }
    
    dict_produto = {
        1: 'EmprÃ©stimo Pessoal',
        2: 'EmprÃ©stimo Consignado',
        3: 'EmprÃ©stimo Pessoal',
        4: 'EmprÃ©stimo Pessoal',
        5: 'EmprÃ©stimo Pessoal'
    }
    
    dict_credor = {
        1: 'Banco BMG',
        2: 'Banco BMG',
        3: 'Banco BMG',
        4: 'Open-co/Geru',
        5: 'Open-co/Rebel'
    }
    
    dict_cessao = {
        1: '30/12/2020',
        2: '30/12/2021',
        3: '29/06/2022',
        4: '28/03/2025',
        5: '28/03/2025'
    }
    
    try:
        acordo = Acordo.objects.get(url_proposta=url_proposta, data_expiracao_proposta__gt=timezone.now())
    except Exception as e:
        print(e)
        acordo = None
    
    falha = False   
    if acordo:
        acordo.nome_credor_atual    = dict_empresa.get(acordo.carteira_id)
        acordo.nome_credor_original = dict_credor.get(acordo.carteira_id)
        acordo.tipo_produto         = dict_produto.get(acordo.carteira_id)
        acordo.data_cessao          = dict_cessao.get(acordo.carteira_id)
        acordo.valor_desconto       = acordo.valor_pendente - acordo.valor_do_acordo
    else:
        falha = True
        
    context = { 
        "acordo":acordo,
        "falha" : falha
    }
    return render(request, 't_proposta.html', context)


def proposta_concluida(request):
    return render(request, 't_proposta_final.html')




def baixar_contrato(request, carteira, contrato):
    CARTEIRA    = {
        1:'lendico',
        2:'consig',
        3:'help',
    }
    
    sht = SheetsGCP()           #Classe do GOOGLE SHEETS
    db  = DbCON()               #Classe para acessar o banco do RESOLVE CONTAS

    tipo = 'pdf'
    if carteira == '1':
        tipo    = 'zip'

    carteira    = CARTEIRA.get(int(carteira))
    print(carteira)
    localPath   = f'{ROOTPATH}media/{contrato}.{tipo}'             #O erro de download estava aqui, pois tentava salvar numa pasta inexistente
    gcPath      = f'/contrato/{carteira}/{contrato}.{tipo}'#Path do GCP aonde se encontra o contrato
    print(gcPath)
    if gcp.check(gcPath):
        gcp.download(f'{gcPath}', f'{localPath}')

        with open(localPath, 'rb') as arquivo:
            response    = HttpResponse(arquivo.read(), content_type='application/force-download')
            response['Content-Disposition'] = f'attachment; filename={contrato}.{tipo}'

            #FECHA E REMOVE O ARQUIVO APÃ“S A LEITURA DELE
            arquivo.close()
            os.remove(localPath)
            return response
    else:#Coloca na planilha selecionada o contrato para solicitaÃ§Ã£o
        dados_contrato  = db.consulta_db(contrato) #Retorna os dados do cliente com base no contrato para a solicitaÃ§Ã£o
        sht.sheet_update('https://docs.google.com/spreadsheets/d/14USGJsgAq-tUg15jxtRigb6_er5dyS5usOqb1ExhSWs/edit#gid=0', dados_contrato)
        return JsonResponse({'message': 'Contrato solicitado com sucesso.'}, status=204)


TEMP_EXTRATO_DIR = 'media/temp_extratos/'
TEMP_EXTRATO_DIR = ROOTPATH + TEMP_EXTRATO_DIR

def gerar_extrato(request, contrato):
    print(WHTML)
    source = f'/extrato/EXTRATO_{contrato}.pdf'
    if gcp.check(source): #Caso exista o extrato no gcp, redireciona para o mesmo numa pÃ¡gina diferente
        url = gcp.generate_url(source)
        return JsonResponse({'status': 'found', 'url': url})

    else:
        db = ResolveDB()
        result          = db.info_extrato(contrato)
        devedor_info    = db.consulta_original(contrato)
        nome            = {'nome':devedor_info[0][1].title()}
        cpf_completo    = devedor_info[0][2].rjust(11,'0')
        carteira        = str(devedor_info[0][3])
        cpf_formatado   = formata_cpf(cpf_completo)
        cpf             = {'cpf':cpf_formatado, 'contrato':contrato}
        header_extrato  = []
        row_extrato     = []

        if carteira == '3':
            cnpj = '46.744.077/0001-77'
            razao_social = 'BETACRUX SECURITIZADORA LTDA'
            data_cessao = '30/06/2029'
        elif carteira == '2':    
            cnpj = '07.825.881/0001-29'
            razao_social = 'ACRUX SECURITIZADORA S.A'
            data_cessao = '30/12/2021'
        elif carteira == '1':
            cnpj = '07.825.881/0001-29'
            razao_social = 'ACRUX SECURITIZADORA S.A'
            data_cessao = '30/12/2020'
        else:
            cnpj = ''
            razao_social = ''
            data_cessao = ''

        for x in range(len(result)):
            indicador_cessao = result[x][21]
            head_extrato = {
                    'contrato_info':{
                                        'ano_contrato':result[x][1][0:4],
                                        'mes_contrato':result[x][1][4:7],
                                        'contrato':result[x][2],
                                        'data_inicio_contrato':result[x][3].strftime('%d/%m/%Y'),
                                        'data_fim_contrato':result[x][4].strftime('%d/%m/%Y'),
                                        'num_ct_int':result[x][5],  #Numero de contrato interno
                                        'num_ct_int_prev':result[x][6], #Numero de contrato interno anterior
                                        'num_ct_int_new':result[x][7],  #Numero de contrato interno novo
                                        'cod_convenio':result[x][8],
                                        'type_convenio':result[x][9],
                                        'convenio':result[x][10],
                                        'matricula':result[x][11],
                                        'agrup_prod':result[x][12],
                                        'grupo_prod':result[x][13],
                                        'produto':result[x][14],    #atÃ© o 19 pular pois faz parte das parcelas
                                        'qtd_parcelas':result[x][20],   #atÃ© o 26 pular
                                        'tx_anual':result[x][26],
                                        'tx_mensal':result[x][27],
                                        'valor_financiado':result[x][28],
                                        'valor_liberado':result[x][29],
                                        'cet_am':result[x][36],
                                        'cet_aa':result[x][37],
                                        'cnpj':cnpj,
                                        'data_cessao':data_cessao,
                                        'razao_social':razao_social
                                        }
            }
            
            if indicador_cessao == 1:
                cessao = 'Contrato cedido'
            else:
                cessao = 'Contrato nÃ£o cedido'
            linha_extrato   = {                           #Tudo que tÃ¡ faltando Ã© referente as linhas do extrato, as informaÃ§Ãµes acima sÃ£o referentes ao HEADER do extrato
                        'parcelas_info':{
                                        'data_pagamento':result[x][15].strftime('%d/%m/%Y'),
                                        'valor_pago':result[x][16],
                                        'num_parcela':result[x][17],
                                        'data_parcela':result[x][18].strftime('%d/%m/%Y'),
                                        'valor_parcela':result[x][19],
                                        'indica_cessao':cessao,
                                        'origem_baixa':result[x][22],   #Desconto em folha, cessÃ£o, RenegociaÃ§Ã£o auto
                                        'origem_cont':result[x][23],    #Refinanciamente, Novo, RenegociaÃ§Ã£o etc
                                        'valor_mora':result[x][24],
                                        'valor_multa':result[x][25],
                                        'valor_principal':result[x][30],
                                        'valor_juros':result[x][31],
                                        'valor_iof':result[x][32],
                                        'valor_disponivel':result[x][33],
                                        'valor_hon':result[x][34],
                                        'valor_desconto':result[x][35]
                }
            }
            header_extrato.append(head_extrato)
            row_extrato.append(linha_extrato)

        data = {
            'contrato': header_extrato,
            'extrato_info': row_extrato,
            'nome_dev': nome,
            'cpf_dev': cpf,
            'first_header': header_extrato[0]
        }

        temp_file_path = os.path.join(TEMP_EXTRATO_DIR, f'extrato_{contrato}.json')
        os.makedirs(TEMP_EXTRATO_DIR, exist_ok=True)
        with open(temp_file_path, 'w') as file:
            json.dump(data, file)
        
        return JsonResponse({'status': 'not_found', 'contrato': contrato})


def render_to_pdf(template_src, context_dict):
    template = get_template(template_src)
    html = template.render(context_dict)

    # ANDERSON PRECISA TROCAR O PATH DO WKHTMLTOPDF AQUI
    config = pdfkit.configuration(wkhtmltopdf=WHTML)
    # ANDERSON PRECISA TROCAR O PATH DO WKHTMLTOPDF AQUI

    options = {
        'encoding': "UTF-8",
    }
    
    # Criar um arquivo temporÃ¡rio para armazenar o PDF gerado
    with NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
        pdfkit.from_string(html, tmp_file.name, configuration=config, options=options)
        tmp_file_path = tmp_file.name
    
    # le o conteudo do arquivo PDF gerado
    with open(tmp_file_path, 'rb') as f:
        pdf_content = f.read()
    
    # remove o arquivo apos a leitura
    os.remove(tmp_file_path)
    
    if pdf_content:
        return pdf_content
    return None


def renderizar_extrato(request, contrato):
    temp_file_path = os.path.join(TEMP_EXTRATO_DIR, f'extrato_{contrato}.json')
    if not os.path.exists(temp_file_path):
        return JsonResponse({'status': 'error', 'message': 'Dados do extrato nÃ£o encontrados.'})
    
    with open(temp_file_path, 'r') as file:
        data = json.load(file)

    source_ext = f'{ROOTPATH}media/EXTRATO_{contrato}.pdf'  # salvando o extrato em media
    
    try:
        pdf_content = render_to_pdf('index_e.html', data)
        if pdf_content is None:
            raise Exception('Erro ao renderizar o PDF.')

        with open(source_ext, 'wb') as f:
            f.write(pdf_content)
        
        # fazendo o upload dele para o GCP
        gcp.upload(source_ext, f'/extrato/EXTRATO_{contrato}.pdf')
        
        # depois eu excluo ele pra nao ficar no projeto
        os.remove(source_ext)
        
        # Gera a URL do GCP e retorna o JSON com a URL pra abrir em uma nova aba no meu script
        url = gcp.generate_url(f'/extrato/EXTRATO_{contrato}.pdf')
        return JsonResponse({'status': 'success', 'url': url})
    
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Erro ao gerar o extrato: {str(e)}'})
    
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


TEMP_DIR = os.path.join(settings.BASE_DIR, "terceirizada", "temp")
if not os.path.exists(TEMP_DIR):
    print(f"ðŸ”¹ Criando diretÃ³rio TEMP_DIR: {TEMP_DIR}")
    os.makedirs(TEMP_DIR, exist_ok=True)

TEMP_FILES = {}


def valida_cpf(cpf):
    cpf = re.sub(r'\D', '', cpf)  # Remove caracteres nÃ£o numÃ©ricos
    if len(cpf) != 11 or not cpf.isdigit() or cpf in (cpf[0] * len(cpf) for _ in range(10)):
        return False
    
    # CÃ¡lculo do primeiro dÃ­gito verificador
    soma1 = sum(int(cpf[i]) * (10 - i) for i in range(9))
    digito1 = (soma1 * 10) % 11
    if digito1 == 10:
        digito1 = 0

    # CÃ¡lculo do segundo dÃ­gito verificador
    soma2 = sum(int(cpf[i]) * (11 - i) for i in range(10))
    digito2 = (soma2 * 10) % 11
    if digito2 == 10:
        digito2 = 0

    return cpf[-2:] == f"{digito1}{digito2}"

def valida_linha(campos):
    strin_row        = []
    for campo in campos:
        if campo in strin_row:
            print('Linha duplicada, arrume!')
            return False        
        strin_row.append(campo)
        print(strin_row)
    return True

# def verifica_banco(request, cpf):
#     banco = ParceirosDB()
#     if request.method == 'GET':
#         cpf = request.body
#         consulta = banco.cpf_check(cpf)


def importa_dados(request):
    if request.method == "POST" and request.FILES.get("file"):
        file = request.FILES["file"]
        import_type = request.POST.get("import_type")

        required_fields = {
            "pessoas": ["cpf", "nome_completo"],
            "contratos": ["cpf", "numero_do_contrato", "saldo_a_pagar"],
        }.get(import_type, [])

        try:
            pa = ParceirosDB()
            existe = pa.cpf_check('17854401799')
            if not existe and import_type == 'contratos':
                return JsonResponse({"error": "CPF nÃ£o encontrado na base"})
            # Ler arquivo
            if file.name.endswith('.csv'):
                data = pd.read_csv(file)
            elif file.name.endswith('.xls') or file.name.endswith('.xlsx'):
                data = pd.read_excel(file)
            elif file.name.endswith('.txt'):
                data = pd.read_csv(file, delimiter="\t")
            else:
                return JsonResponse({"error": "Formato de arquivo nÃ£o suportado"}, status=400)

            # Verifica se os campos obrigatÃ³rios existem
            missing_columns = [col for col in required_fields if col not in data.columns]

            if missing_columns:
                
                return JsonResponse({
                    "error": "O arquivo nÃ£o contÃ©m os campos obrigatÃ³rios.",
                    "missing_columns": missing_columns
                }, status=400)

            # Verifica linha duplicada
            linhas = []
            for linha in data.values:
                print(list(linha))
                linhas.append(list(linha))
            validador = valida_linha(linhas)
            if validador == False:
                print('Tem linha duplicada, arrume!')
                erro = {'error':'Linha duplicada na planilha'}

            # Verificar CPFs invÃ¡lidos
            invalid_cpf_rows = []
            for i, row in data.iterrows():
                cpf_field = str(row.get("cpf")).rjust(11, "0")
                if cpf_field and not valida_cpf(cpf_field):
                    invalid_cpf_rows.append({"row": i + 1, "cpf": cpf_field})

            if invalid_cpf_rows:
                file_id = f"relatorio_erros_{int(time_module.time())}.csv"
                error_file_path = os.path.join(TEMP_DIR, file_id)
                
                df_errors = pd.DataFrame(invalid_cpf_rows)
                df_errors.to_csv(error_file_path, index=False)

                TEMP_FILES[file_id] = {
                    "path": error_file_path,
                    "timestamp": time_module.time()
                }

                return JsonResponse({
                    "error": "Erro de validaÃ§Ã£o: CPFs invÃ¡lidos encontrados.",
                    "invalid_cpfs": invalid_cpf_rows[:5],
                    "error_file_id": file_id
                }, status=400)

            # Sucesso - Retorna prÃ©-visualizaÃ§Ã£o
            preview_data = data.head(5).to_dict(orient="records")
            response = {
                "preview": preview_data,
                "columns": list(data.columns),
                "success": True
            }

            return JsonResponse(response, status=200)
        
        except Exception as e:
            return JsonResponse({"error": f"Erro ao processar o arquivo: {str(e)}"}, status=400)

    return render(request, "t_importa_dados.html")


def t_importa_dados_pessoas(request):
    return render(request, "t_importa_dados.html", {"import_type": "pessoas"})


def t_importa_dados_contratos(request):
    return render(request, "t_importa_dados.html", {"import_type": "contratos"})


@login_required
def save_imported_data(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            import_type = data.get("import_type")
            preview = data.get("preview", [])
            tipo    = data.get("type", "")

            user = request.user
            empresa = user.empresa

            if not empresa:
                return JsonResponse({"error": "UsuÃ¡rio nÃ£o tem uma empresa associada!"}, status=400)

            if import_type == "pessoas":
                for lead in preview:
                    pessoa = Pessoas(
                        empresa=empresa,
                        cpf=lead.get("cpf"),
                        nome_completo=lead.get("nome_completo"),
                        email=lead.get("email", None),
                        telefone=lead.get("telefone", None)
                    )
                    pessoa.save()

            elif import_type == "contratos":
                for contract in preview:
                    contrato = Contratos(
                        empresa=empresa,
                        cpf=contract.get("cpf"),
                        contrato=contract.get("numero_do_contrato"),
                        saldo=contract.get("saldo_a_pagar")
                    )
                    contrato.save()

            return JsonResponse({"success": True, "message": "ImportaÃ§Ã£o realizada com sucesso!"})

        except Exception as e:
            return JsonResponse({"error": f"Erro ao processar a importaÃ§Ã£o: {str(e)}"}, status=500)

    return JsonResponse({"error": "MÃ©todo nÃ£o permitido!"}, status=405)


def download_error_file(request, file_id):
    error_file_path = os.path.join(TEMP_DIR, file_id)

    if not os.path.exists(error_file_path):
        return HttpResponse("Arquivo nÃ£o encontrado.", status=404)

    response = FileResponse(
        open(error_file_path, "rb"),
        as_attachment=True,
        filename=smart_str(file_id),
    )
    response['Content-Disposition'] = f'attachment; filename="{file_id}"'
    response['Content-Type'] = 'application/octet-stream'
    return response


def clean_temp_files():
    while True:
        current_time = time_module.time()
        for file_id, file_info in list(TEMP_FILES.items()):
            if current_time - file_info["timestamp"] > 1800:
                if os.path.exists(file_info["path"]):
                    print(f"Removendo arquivo expirado: {file_info['path']}")
                    os.remove(file_info["path"])
                del TEMP_FILES[file_id]
        time_module.sleep(600)

threading.Thread(target=clean_temp_files, daemon=True).start()


def listar_campos(request):
    parceiros = ParceirosDB()
    try:
        campos = parceiros.consulta_campos()
        return render(request, "t_listar_campos.html", {"campos": campos})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

        
def listar_leads_banco(request):
    if not request.user.is_authenticated:
        return redirect('/accounts/login/')
    if request.user.grupo.tipo == 'business':
        return redirect('/business/home/')
    
    usuario_logado = request.user
    cpf_pesquisa = request.GET.get('cpf_pesquisa', '').strip()
    dict_filters = {}
    
    if cpf_pesquisa and len(cpf_pesquisa) >= 3:
        dict_filters['cpf'] = somenteNumeros(cpf_pesquisa)
    
    dict_filters['empresa'] = usuario_logado.empresa 
    leads_list = Pessoas.objects.filter(**dict_filters).order_by('nome_completo')
    print("Leads carregados:", list(leads_list.values()))
    
    paginator = Paginator(leads_list, 30)
    page = request.GET.get('page', 1)
    try:
        leads = paginator.page(page)
    except PageNotAnInteger:
        leads = paginator.page(1)
    except EmptyPage:
        leads = paginator.page(paginator.num_pages)
    
    print("Leads paginados:", list(leads.object_list.values()))
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.GET.get('format') == 'json':
        leads_data = list(leads.object_list.values("cpf", "nome_completo", "empresa__nome"))
        print("Leads retornados para JSON:", leads_data)
        return JsonResponse({"leads": leads_data, "total_registros": paginator.count})
    
    context = {
        'leads': leads,
        'total_registros': paginator.count,
        'usuario_logado': usuario_logado,
        'cpf_pesquisa': cpf_pesquisa,
    }
    print("Contexto enviado para template:", context)
    return render(request, 't_listar_leads_banco.html', context)


def detalhes_lead(request, cpf):
    pessoa = get_object_or_404(Pessoas, cpf=cpf)

    empresa_nome = pessoa.empresa.nome if hasattr(pessoa.empresa, 'nome') else pessoa.empresa

    pessoa_data = {
        "nome": pessoa.nome_completo,
        "cpf": pessoa.cpf,
        "empresa": empresa_nome if empresa_nome else "N/A",
        "email": pessoa.email if pessoa.email else "N/A",
        "telefone": pessoa.telefone if pessoa.telefone else "N/A",
        "ajuizado_poloativo": pessoa.ajuizado_poloativo if hasattr(pessoa, "ajuizado_poloativo") else 0,
        "ajuizado_polopassivo": pessoa.ajuizado_polopassivo if hasattr(pessoa, "ajuizado_polopassivo") else 0,
        "pefin": pessoa.pefin if hasattr(pessoa, "pefin") else 0,
        "limpanomes": pessoa.limpanomes if hasattr(pessoa, "limpanomes") else 0,
    }

    context = {
        'pessoa': pessoa_data,
    }
    return render(request, 't_resultado_pessoa_banco.html', context)


def deletar_lead(request, cpf):
    if request.method == "DELETE":
        try:
            lead = get_object_or_404(Pessoas, cpf=cpf)
            lead.delete()
            logger.info(f"Lead excluÃ­do: CPF {cpf}")
            return JsonResponse({"success": True, "message": "Lead excluÃ­do com sucesso!"})
        except Exception as e:
            logger.error(f"Erro ao excluir lead {cpf}: {str(e)}")
            return JsonResponse({"error": f"Erro ao excluir o lead: {str(e)}"}, status=500)

    return JsonResponse({"error": "MÃ©todo nÃ£o permitido!"}, status=405)
