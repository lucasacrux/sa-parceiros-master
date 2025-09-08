from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.conf import settings
from django.urls import reverse
from django.contrib import messages
from core.forms import UploadInclusaoForm, UploadExclusaoForm, InclusaoDevedorForm, ExclusaoDevedorForm
from .models import Arquivos, Acordo
from django import forms
from django.http import HttpResponse, JsonResponse
import os
from .forms import AcordoForm
import json
from django.db.models import Q
from django.http import FileResponse
import requests
from django.views.decorators.csrf import csrf_exempt
from decimal import Decimal, InvalidOperation
from datetime import datetime
from django.utils import timezone



#@login_required(login_url='login')  
def select_company(request):
    return render(request, 'select_company.html')

def home(request):
    return render(request, 'index.html')

def relatorio(request):
    return render(request, 'relatorio.html')

def carteira(request):
    return render(request, 'carteira.html',)

def create_carteira(request):
    return render(request, 'create_carteira.html')

def criar_acordo(request):
    return render(request, 'criar_acordo.html')

def buscar_acordo_feito(request):
    return render(request, 'buscar_acordo_feito.html')

@login_required(login_url='login')
def redirect_after_login(request):
        return redirect(reverse('select_company'))

    
def gestao_carteira(request):
    form_inclusao = UploadInclusaoForm(request.POST or None, request.FILES or None)
    form_exclusao = UploadExclusaoForm(request.POST or None, request.FILES or None)
    form_devedor = InclusaoDevedorForm(request.POST or None, request.FILES or None)
    form_devedor_exclusao = ExclusaoDevedorForm(request.POST or None, request.FILES or None)

    # Combinar os arquivos de inclusão e exclusão
    arquivos_contrato = Arquivos.objects.filter(
        Q(documento_inclusao__isnull=False) | Q(documento_exclusao__isnull=False)
    ).order_by('-data_envio')

    # Combinar os arquivos de inclusão e exclusão de devedor
    arquivos_devedor = Arquivos.objects.filter(
        Q(documento_inclusao_devedor__isnull=False) | Q(documento_exclusao_devedor__isnull=False)
    ).order_by('-data_envio')

    if request.method == 'POST':
        if 'submit_inclusao' in request.POST:
            form_inclusao = UploadInclusaoForm(request.POST, request.FILES)
            if form_inclusao.is_valid():
                documento = form_inclusao.cleaned_data['documento_inclusao']
                if documento:
                    Arquivos.objects.create(documento_inclusao=documento)
                    messages.success(request, 'Arquivo de inclusão salvo com sucesso!')
                else:
                    messages.error(request, 'Erro ao salvar arquivo de inclusão.')

        elif 'submit_exclusao' in request.POST:
            form_exclusao = UploadExclusaoForm(request.POST, request.FILES)
            if form_exclusao.is_valid():
                documento = form_exclusao.cleaned_data['documento_exclusao']
                if documento:
                    Arquivos.objects.create(documento_exclusao=documento)
                    messages.success(request, 'Arquivo de exclusão salvo com sucesso!')
                else:
                    messages.error(request, 'Erro ao salvar arquivo de exclusão.')

        elif 'submit_devedor' in request.POST:
            form_devedor = InclusaoDevedorForm(request.POST, request.FILES)
            if form_devedor.is_valid():
                documento = form_devedor.cleaned_data['documento_inclusao_devedor']
                if documento:
                    Arquivos.objects.create(documento_inclusao_devedor=documento)
                    messages.success(request, 'Arquivo de inclusão de devedor salvo com sucesso!')
                else:
                    messages.error(request, 'Erro ao salvar arquivo de inclusão de devedor.')
                
        elif 'submit_exclusao_devedor' in request.POST:
            form_devedor_exclusao = ExclusaoDevedorForm(request.POST, request.FILES)
            if form_devedor_exclusao.is_valid():
                documento = form_devedor_exclusao.cleaned_data['documento_exclusao_devedor']
                if documento:
                    Arquivos.objects.create(documento_exclusao_devedor=documento)
                    messages.success(request, 'Arquivo de exclusão de devedor salvo com sucesso!')
                else:
                    messages.error(request, 'Erro ao salvar arquivo de exclusão de devedor.')

    context = {
        'form_inclusao': form_inclusao,
        'form_exclusao': form_exclusao,
        'form_devedor': form_devedor,
        'form_devedor_exclusao': form_devedor_exclusao,
        'arquivos_contrato': arquivos_contrato,
        'arquivos_devedor': arquivos_devedor,
    }

    return render(request, 'gestao_carteira.html', context)



def download_modelo(request):
    caminho_arquivo = os.path.join(settings.MEDIA_ROOT, 'arquivo_modelo.txt')
    try:
        return FileResponse(open(caminho_arquivo, 'rb'), as_attachment=True)
    except FileNotFoundError:

        pass       
    
    
def convert_to_decimal(value):
    return Decimal(value.replace('.', '').replace(',', '.'))

def somenteNumeros(cpf):
    return cpf.replace('-', '').replace('.','').replace('(','').replace(')','').replace(' ', '')


def salvar_acordo(request):
    if request.method == 'POST':
        try:
            data                            = json.loads(request.body)
            cpf                             = somenteNumeros(data.get('cpf'))
            contratos_list                  = data.get('contratos')
            carteira_id                     = data.get('carteira_id')
            raw_valor_do_acordo             = data.get('valor_do_acordo', '0').replace('.', '').replace(',', '.')
            raw_valor_pendente              = data.get('valor_do_acordo', '0').replace('.', '').replace(',', '.')
            raw_valor_parcela               = data.get('valor_parcela', '0').replace('.', '').replace(',', '.')
            raw_maior_desconto_valor        = float(data.get('maior_desconto_valor', '0'))
            raw_menor_desconto_valor        = float(data.get('menor_desconto_valor', '0'))
            num_parcelas_acordo             = data.get('numParcelas')
            dia_vencimento_primeira_parcela = data.get('dia_vencimento_primeira_parcela')
            dia_vencimento_proxima_parcela  = data.get('dia_vencimento_proxima_parcela')
            email                           = data.get('email')
            telefone                        = somenteNumeros(data.get('telefone'))
            status                          = data.get('status')
            acordoId                        = data.get('acordoId')
            parcelas                        = data.get('parcelas', [])
            min_parcelas                    = data.get('min_parcelas')
            max_parcelas                    = data.get('max_parcelas')
            data_aceite                     = data.get('data_aceite')
            telefone                        = data.get('telefone')


            maior_desconto_valor = Decimal(raw_maior_desconto_valor)
            menor_desconto_valor = Decimal(raw_menor_desconto_valor)
            valor_do_acordo      = Decimal(raw_valor_do_acordo)
            valor_pendente       = Decimal(raw_valor_pendente)
            valor_parcela        = Decimal(raw_valor_parcela)
            
            
            if not telefone or len(telefone) != 14 or telefone[0] != '(' or telefone[3] != ')' or telefone[9] != '-':
                return JsonResponse({"success": False, "message": "Telefone inválido. Use o formato (XX)XXXXX-XXXX."})

            if dia_vencimento_primeira_parcela is None or dia_vencimento_proxima_parcela is None:
                return JsonResponse({"success": False, "message": "As datas de vencimento das parcelas são obrigatórias."})

            dia_vencimento_primeira_parcela = datetime.strptime(dia_vencimento_primeira_parcela, '%d/%m/%Y').date()
            dia_vencimento_proxima_parcela  = datetime.strptime(dia_vencimento_proxima_parcela, '%Y-%m-%d').date()
            
            if data_aceite:
                data_aceite = datetime.strptime(data_aceite, '%d/%m/%Y').date()

            contratos = ', '.join(contratos_list)

            if acordoId:
                try:
                    acordo = Acordo.objects.get(acordo_id=acordoId)
                    acordo.status = status
                    if status == "Aceito":
                        acordo.data_aceite = timezone.now().date()
                        
                except Acordo.DoesNotExist:
                    return JsonResponse({"success": False, "message": "Acordo não encontrado."})
            else:
                acordo = Acordo(
                    cpf                             = cpf,
                    contratos                       = contratos,
                    carteira_id                     = carteira_id[0],
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
                    min_parcelas                    = min_parcelas,
                    max_parcelas                    = max_parcelas,
                    maior_desconto_valor            = maior_desconto_valor,
                    menor_desconto_valor            = menor_desconto_valor,
                    data_aceite                     = data_aceite
                )

            acordo.save()
        except Exception as e:
            print(e)

    return redirect('/t/acordos/')



def editar_acordo(request):
    if request.method != 'POST':
        print("Erro: Método inválido.")
        return JsonResponse({"success": False, "message": "Método inválido."}, status=405)

    data = json.loads(request.body)
    acordo_id = data.get('acordo_id')

    if not acordo_id:
        print("Erro: ID do acordo é necessário para atualizar.")
        return JsonResponse({"success": False, "message": "ID do acordo é necessário para atualizar."}, status=400)

    try:
        acordo                                 = Acordo.objects.get(acordo_id=acordo_id)
        acordo.valor_do_acordo                 = Decimal(data.get('valor_do_acordo'))
        acordo.num_parcelas_acordo             = data.get('numParcelas')
        acordo.valor_parcela                   = Decimal(data.get('valor_parcela').replace('.', '').replace(',', '.'))
        acordo.dia_vencimento_primeira_parcela = datetime.strptime(data.get('dia_vencimento_primeira_parcela'), '%d/%m/%Y').date()
        acordo.dia_vencimento_proxima_parcela  = datetime.strptime(data.get('dia_vencimento_proxima_parcela'), '%Y-%m-%d').date()
        acordo.email                           = data.get('email')
        acordo.telefone                        = somenteNumeros(data.get('telefone'))
        acordo.parcelas                        = data.get('parcelas', [])
        
        acordo.save()
        return JsonResponse({"success": True, "message": "Acordo atualizado com sucesso."})

    except Acordo.DoesNotExist:
        print("Erro: Acordo não encontrado.")
        return JsonResponse({"success": False, "message": "Acordo não encontrado."}, status=404)
    except Exception as e:
        print(f"Erro ao atualizar o acordo: {e}")
        return JsonResponse({"success": False, "message": f"Erro ao atualizar o acordo: {str(e)}"}, status=500)


def consulta_pessoa(cpf):
    url = f'https://datahub.resolvecontas.com.br/api/pessoas?cpf={cpf}'
    response = requests.get(url)
    return response
    

def verificar_cpf(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        cpf = data['cpf']
        response = consulta_pessoa(cpf)
        print(response.json())
        if response.status_code == 200:
            result = response.json()
            return JsonResponse(result)
        return JsonResponse({'result': []})
    return JsonResponse({'error': 'Invalid request'}, status=400)


def buscar_acordo_feito(request):
    cpf_busca = ''
    if request.method == 'POST':
        cpf_busca = request.POST.get('cpf')
        if cpf_busca:
            acordos = Acordo.objects.filter(cpf=cpf_busca)
            return render(request, 'resultados_acordo.html', {'acordos': acordos, 'cpf_busca': cpf_busca})
        else:
            acordos = Acordo.objects.all()
    else:
        acordos = Acordo.objects.all()
    return render(request, 'buscar_acordo_feito.html', {'acordos': acordos, 'cpf_busca': cpf_busca})


def formataData(data):
    if '-' in data:
        data_list = data.split('-')
        new_data  = data_list[2]+'/'+data_list[1]+'/'+data_list[0]
        return new_data
    return data


def detalhes_do_acordo(request, acordo_id):
    print('teste')
    print(acordo_id)
    try:
        acordo = Acordo.objects.get(id=acordo_id)
        parcelas = None
        if acordo.id_resolvecontas:
            try:
                acordos_ativos = consulta_pessoa(acordo.cpf).json()
                
                for acordo_ativo in acordos_ativos['result'][0]['acordo_ativo']:
                    if acordo_ativo['acordoId'] == acordo.id_resolvecontas:
                        parcelas     = []
                        count        = 0
                        print(acordo_ativo)
                        for parcela in acordo_ativo['parcelas']:
                            botao = None
                            situacao = parcela['situacao']
                            print(situacao)
                            if parcela['dados_metodo_pagamento']:
                                dados_pagamento = eval(parcela['dados_metodo_pagamento'])
                                numeroBoleto    = dados_pagamento['numero']
                                linhaDigitavel  = dados_pagamento['linhaDigitavel']
                                url_boleto      = f'https://www.resolvecontas.com.br/api/1.0/boletos/bb/public/{numeroBoleto}'
                            else:
                                numeroBoleto   = None
                                linhaDigitavel = None
                                url_boleto     = None
                            
                            dataPagamento = None
                            if numeroBoleto:
                                botao = f'<a href="{url_boleto}" target="_blank" class="btn btn-warning btn-sm" style="width:100%;"><i class="bi bi-clipboard-plus-fill"></i> Ver Boleto</a>'
                
                            if situacao == 'LIQUIDADO':
                                dataPagamento   = formataData(parcela['dataVencimento'])
                                botao = f'<a href="#" class="btn btn-primary btn-sm" style="width:100%;"><i class="bi bi-clipboard-data-fill"></i> Pago</a>'
                            
                            if situacao == 'BAIXADO':
                                dataPagamento   = formataData(parcela['dataVencimento'])
                                botao = f'<a href="#" class="btn btn-primary btn-sm" style="width:100%;"><i class="bi bi-clipboard-data-fill"></i> Baixado</a>'
                                
                            if situacao == 'REGULAR' and acordo_ativo['parcelas'][count - 1]['situacao'] == 'LIQUIDADO' and not numeroBoleto:
                                botao = f'<a class="btn btn-success btn-sm" style="width:100%;" href="/t/acordos/gerarboleto/{acordo_id}"><i class="bi bi-clipboard-data-fill"></i> Gerar Boleto</a>'
                            
                            if situacao == 'REGULAR' and count == 0 and not numeroBoleto:
                                botao = f'<a class="btn btn-success btn-sm" style="width:100%;" href="/t/acordos/gerarboleto/{acordo_id}"><i class="bi bi-clipboard-data-fill"></i> Gerar Boleto</a>'
                            
                            if acordo.status == 'Quebrado':
                                dataPagamento   = formataData(parcela['dataVencimento'])
                                botao = f'<a href="#" class="btn btn-primary btn-sm" style="width:100%;"><i class="bi bi-clipboard-data-fill"></i> Quebrado</a>'
                            
                            
                            if not botao:
                                botao = '--'        
                                
                            parcelas.append(
                                {
                                    'numero'        : parcela['numeroParcela'],
                                    'dataVencimento': formataData(parcela['dataVencimento']), 
                                    'dataPagamento' : dataPagamento, 
                                    'valor'         : parcela['valor'],
                                    'situacao'      : parcela['situacao'],
                                    'numeroBoleto'  : numeroBoleto,
                                    'linhaDigitavel': linhaDigitavel,
                                    'url_boleto'    : url_boleto,
                                    'botao_parcela' : botao
                                }
                            )
                            count = count + 1
            except Exception as e:
                print(e)
                acordo_ativo = None
        else:
            
            parcelas = acordo.parcelas 
             
        data = {
            'acordo_id'                      : acordo.id_resolvecontas,
            'cpf'                            : acordo.cpf,
            'contratos'                      : acordo.contratos,
            'carteira_id'                    : acordo.carteira_id,
            'valor_do_acordo'                : acordo.valor_do_acordo,
            'valor_pendente'                 : acordo.valor_pendente,
            'valor_parcela'                  : acordo.valor_parcela,
            'num_parcelas_acordo'            : acordo.num_parcelas_acordo,
            'dia_vencimento_primeira_parcela': acordo.dia_vencimento_primeira_parcela,
            'dia_vencimento_proxima_parcela' : acordo.dia_vencimento_proxima_parcela,
            'email'                          : acordo.email,
            'telefone'                       : acordo.telefone,
            'status'                         : acordo.status,
            'data_aceite'                    : acordo.data_aceite,
            'parcelas'                       : parcelas,
            'min_parcelas'                   : acordo.min_parcelas,
            'max_parcelas'                   : acordo.max_parcelas,
            'maior_desconto_valor'           : acordo.maior_desconto_valor,
            'menor_desconto_valor'           : acordo.menor_desconto_valor
        }
        return JsonResponse(data)
    except Acordo.DoesNotExist:
        return JsonResponse({'error': 'Acordo não encontrado'}, status=404)
    
    
def erro_404(request, exception):
    return render(request,'404.html')

def erro_500(request):
    return render(request,'500.html')

