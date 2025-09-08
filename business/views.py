import tempfile
import threading
from django.shortcuts import get_object_or_404, render
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt

from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Q
from decimal import Decimal, InvalidOperation
from datetime import datetime
import time as time_module
from django.conf import settings
from business.models import Pessoas, Segmentacao, CamposImportacao, Contratos, Acoes, Fluxos
from terceirizada.acruxdb import ParceirosDB
from terceirizada.gcpstorage import StorageGCP
from accounts.models import Grupo
from levas.models import PessoasTerceirizadas
from django.http import FileResponse, JsonResponse
from .models import Importacao, Pessoas, Telefones, Emails, Carteira
from accounts.models import Grupo
import pandas as pd
import re
import requests
from django.utils import timezone
import json
from django.http import HttpResponse
import os
import logging
from .scripts import valida_pessoas, valida_contratos
from pathlib import Path
from unidecode import unidecode
from slugify import slugify
from django.http import HttpResponseNotFound




def home(request):
    return render(request, 'business_home.html')


def somenteNumeros(cpf):
    return cpf.replace('-', '').replace('.','').replace('(','').replace(')','').replace(' ', '')


BASE_DIR  = Path(__file__).resolve().parent.parent
FILE_PATH = str(BASE_DIR) + '/business/temp/'


def baixar_arquivo(arquivo, import_type, empresa):
    ext = os.path.splitext(arquivo.name)[1]
    new_filename = f"{empresa}_{import_type}_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}{ext}"
    try:
        with open(f'{FILE_PATH}{new_filename}', 'wb') as file:
            file.write(arquivo.read())
            file.close()
        return file, new_filename
    except Exception as e:
        print(e)
        return None, None


def valida_linha(campos):
    strin_row        = []
    for campo in campos:
        if campo in strin_row:
            print('Linha duplicada, arrume!')
            return False        
        strin_row.append(campo)
        print(strin_row)
    return True


def valida_cpf(cpf):
    cpf = re.sub(r'\D', '', cpf)
    if len(cpf) != 11 or not cpf.isdigit() or cpf in (cpf[0] * len(cpf) for _ in range(10)):
        return False

    soma1 = sum(int(cpf[i]) * (10 - i) for i in range(9))
    digito1 = (soma1 * 10) % 11
    if digito1 == 10:
        digito1 = 0
    soma2 = sum(int(cpf[i]) * (11 - i) for i in range(10))
    digito2 = (soma2 * 10) % 11
    if digito2 == 10:
        digito2 = 0

    return cpf[-2:] == f"{digito1}{digito2}"



def listar_importacao(request):
    if not request.user.is_authenticated:
        return redirect('/accounts/login/')
    if request.user.grupo.tipo == 'parceiro':
        return redirect('/t/home/')
    
    usuario_logado  = request.user
    empresa_id      = request.user.grupo.id
    importacoes     = Importacao.objects.using('business').filter(empresa_id=empresa_id).order_by('-id')
    total_registros = len(importacoes)
    page            = request.GET.get('page', 1)
    paginator       = Paginator(importacoes, 30)
    
    try:
        importacoes = paginator.page(page)
    except PageNotAnInteger:
        importacoes = paginator.page(1)
    except EmptyPage:
        importacoes = paginator.page(paginator.num_pages)
            
    context = {
        'importacoes'    : importacoes,
        'total_registros': total_registros,
        'usuario_logado' : usuario_logado
        
    }
    return render(request, 'business_listar_importacoes.html', context)


@login_required
def nova_importacao(request):
    user        = request.user
    empresa     = user.grupo.id
        
    if request.method == "POST" and request.FILES.get("file"):
        user        = request.user
        empresa     = user.grupo.id
        
        if not empresa:
            return JsonResponse({"error": "Usuário não tem uma empresa associada!"}, status=400)
        
        file          = request.FILES["file"]
        import_type   = request.POST.get("import_type")
        arq, filename = baixar_arquivo(file, import_type, empresa)
        if arq:
            if file.name.endswith('.csv'):
                try:
                    data = pd.read_csv(file)
                except:
                    data = pd.DataFrame()
            elif file.name.endswith('.xls') or file.name.endswith('.xlsx'):
                try:
                    data = pd.read_excel(file)
                except:
                    data = pd.DataFrame()
            elif file.name.endswith('.txt'):
                try:
                    data = pd.read_csv(file, delimiter="\t")
                except:
                    data = pd.DataFrame()
            else:
                return JsonResponse({"error": "Formato de arquivo não suportado"}, status=400)
            if data.shape[0] > 0:
                preview_data = data.head(5).replace({pd.NA: None, pd.NaT: None, float("nan"): None})
                preview_data = preview_data.to_dict(orient="records")
                return JsonResponse({"preview": preview_data, "type":import_type, "columns": list(data.columns), "filename":filename}, status=200)
            else:
                return JsonResponse({"error": "Arquivo vazio"})
        return JsonResponse({"error": "Arquivo não enviado"})
    
    campos_default = CamposImportacao.objects.using('business').filter(empresa_id__in=[0, empresa], import_type='pessoas').order_by('empresa_id')
    columns_default_pessoas = []
    pessoas_required        = []
    for campo in campos_default:
        if campo.required == 1:
            pessoas_required.append(campo.label)
        columns_default_pessoas.append({"value": campo.name, "label": campo.label})
    
    campos_default = CamposImportacao.objects.using('business').filter(empresa_id__in=[0, empresa], import_type='contratos').order_by('empresa_id')
    columns_default_contratos = []
    contratos_required        = []
    for campo in campos_default:
        if campo.required == 1:
            contratos_required.append(campo.label)
        columns_default_contratos.append({"value": campo.name, "label": campo.label})

    carteiras = Carteira.objects.using('business').filter(empresa_id=empresa)
    
    context = {
        'pessoas_default'   : columns_default_pessoas,
        'contratos_default' : columns_default_contratos,
        'contratos_required': ', '.join(contratos_required),
        'pessoas_required'  : ', '.join(pessoas_required),
        'carteiras': carteiras,
    }
    
    return render(request, "business_importar.html", context=context)


def create_slug(value): 
    return slugify(value, separator='_').replace('-','')


@login_required
def save_imported_data(request):
    if request.method == "POST":
        data        = json.loads(request.body)
        import_type = data.get("import_type")
        import_name = data.get("import_name")
        file_name   = str(data.get("file_name"))
        carteira_id = data.get("carteira_id")
        columns     = data.get("columns", [])
        user        = request.user
        empresa     = user.grupo.id
        
        if columns:
            for col in columns:
                col['slug_db'] = create_slug(col['name'])        

        if not empresa:
            return JsonResponse({"error": "Usuário não tem uma empresa associada!"}, status=400)
        
        try:
            if import_type == 'pessoas':
                validador = valida_pessoas.ValidadorPessoas(FILE_PATH + file_name, empresa, carteira_id, import_name, columns, import_type)               
            elif import_type == 'contratos':
                validador = valida_contratos.ValidadorContratos(FILE_PATH + file_name, empresa,  carteira_id, import_name,  columns, import_type) 
            else:
                return JsonResponse({"error": "Tipo de importação desconhecida"}, status=405)
            
            response, create_cols  = validador.validar()
            success                = response.get('success', False)
            total                  = response.get('total', 0)
            total_atualizar        = response.get('total_atualizar', 0)
            qtd_erros              = response.get('qtd_erros', 0)
            list_erros             = response.get('list_erros', [])
                
        except Exception as e:
            return JsonResponse({"error": f"Erro ao processar a importação: {str(e)}"}, status=500)
        
        # CRIANDO IMPORTACAO
        try:                 
            Importacao.objects.using('business').create(
                name            = import_name,
                empresa_id      = empresa,
                usuario_id      = user.id,
                file_name       = file_name,
                carteira_id     = carteira_id,
                file_path       = FILE_PATH,
                status          = 'sucesso' if success else 'falhou',
                total_registros = total,
                total_atualizar = total_atualizar,
                total_erros     = qtd_erros,
                list_erros      = list_erros,
                custom_columns  = columns,
                tipo            = import_type
            )
        except Exception as e:
            print('erro', e)
    
  
        # CRIANDO NOVAS COLUNAS
        if len(create_cols) > 0:
            for col in columns:
                if col.get('slug_db') in create_cols:
                    try:                 
                        CamposImportacao.objects.using('business').create(
                            name            = col.get('coluna'),
                            label           = col.get('name'),
                            slug_db         = col.get('slug_db'),
                            data_type       = 'text' if col.get('type') == 'text' else 'value',
                            empresa_id      = empresa,
                            import_type     = import_type
                        )
                    except Exception as e:
                        print('erro', e)
                
        return JsonResponse(response)

    return JsonResponse({"error": "Método não permitido!"}, status=405)



def importar_dados_pessoas(request):
    return render(request, "business_importar.html", {"import_type": "pessoas"})


def importar_dados_contratos(request):
    return render(request, "business_importar.html", {"import_type": "contratos"})


def listar_segmentacoes(request):
    grupo_id = request.user.grupo.id
    segmentacoes = Segmentacao.objects.filter(empresa_id=grupo_id)
    segments = segmentacoes.values()
    return render(request, 'business_listar_segmentacoes.html', {'segments': segments})


def montar_condicao(condicoes):
    tabelas = {
        'campos_lead'    : 'bp',
        'campos_contrato': 'bc'
    }
    
    dict_sql = {
        'contem'        : 'LIKE', 
        'nao_contem'    : 'NOT LIKE',
        'equal'         : '=',
        'not_equal'     : '<>',
        'empty'         : 'IS NULL',
        'not_empty'     : 'IS NOT NULL',
        'more_than'     : '>', 
        'less_than'     : '<', 
        'more_or_equal' : '>=', 
        'less_or_equal' : '<=' 
    }

    linhas  = []
    percent = "%"

    for grupo in condicoes.get('groups', []):
        operador = grupo["operator"]
        filtros  = grupo.get('conditions', [])
        for condicao in filtros:
            valor        = condicao['value']
            sintax       = condicao['sintax']
            sintax_ql    = dict_sql.get(sintax, '=')
            field        = condicao['field'].split('|')[0]
            data_type    = condicao['field'].split('|')[1]
            tabela       = condicao.get("table", "")
            tabela_alias = tabelas.get(tabela, '')

            if sintax in ['contem', 'nao_contem']:
                linha = f"{operador} {tabela_alias}.{field} {sintax_ql} '{percent}{valor}{percent}'"
            else:
                if data_type == 'text':
                    linha = f"{operador} {tabela_alias}.{field} {sintax_ql} '{valor}'"
                else:
                    linha = f"{operador} {tabela_alias}.{field} {sintax_ql} {valor}"    
            linhas.append(linha)
    return ' '.join(linhas)

def arquivo_query(query, name):#Salva a query em um arquivo
    name_format     = unidecode(name)
    name_query      = f'{name_format}.sql'
    with open(name_query, 'w') as query_file:
        query_file.write(query)
        query_file.close()
    return name_query

def montar_query(dict_condicoes, campos_pessoas, campos_contrato, order_by=None, limit="todos"):
    fields_query  = []
    dict_tables   = [
        {"fields": campos_pessoas,  "prefix": "bp"},
        {"fields": campos_contrato, "prefix": "bc"}
    ]
    used_fields = []
    for table in dict_tables:
        
        for campo in table.get('fields'):
            field      = campo.get('slug_db')
            prefix     = table.get('prefix')
            if prefix == 'bc':
                pass
            else:
                if campo.get('default') == 1:
                    if field in used_fields:
                        fields_query.append(f"{prefix}.{field} AS {prefix}_{field}")
                    else:
                        fields_query.append(f"{prefix}.{field}")
                else:
                    if not field in used_fields:
                        fields_query.append(f"JSON_UNQUOTE(JSON_EXTRACT(JSON_UNQUOTE({prefix}.custom_fields), '$.{field}')) AS {field}")
                used_fields.append(field)
    fields_query = ', '.join(fields_query)
    
    QUERY_CORE = f"""
    WITH 
        emails_agg AS (
            SELECT cpf, GROUP_CONCAT(DISTINCT email) AS emails
            FROM business_emails
            GROUP BY cpf
        ),
        telefones_agg AS (
            SELECT cpf, GROUP_CONCAT(DISTINCT telefone) AS telefones
            FROM business_telefones
            GROUP BY cpf
        ),
        contratos_agg AS (
            SELECT 
                cpf,
                GROUP_CONCAT(DISTINCT contrato) AS contratos,
                SUM(saldo_a_pagar) AS saldo_total,
                COUNT(contrato) AS quantidade_contratos,
                MIN(data_contratacao) AS primeira_data_contratacao,
                MAX(data_contratacao) AS ultima_data_contratacao
            FROM business_contratos
            GROUP BY cpf
        )

        SELECT 
        contratos_agg.contratos,
        contratos_agg.saldo_total,
        contratos_agg.quantidade_contratos,
        contratos_agg.primeira_data_contratacao,
        contratos_agg.ultima_data_contratacao,

        emails_agg.emails,
        telefones_agg.telefones,
        {fields_query}  
        
        

        FROM business_pessoas bp
        LEFT JOIN emails_agg ON emails_agg.cpf = bp.cpf
        LEFT JOIN telefones_agg ON telefones_agg.cpf = bp.cpf
        LEFT JOIN contratos_agg ON contratos_agg.cpf = bp.cpf

    """   
    
    where = 'WHERE 1 = 1 '
    if 'or' in dict_condicoes:
        where = 'WHERE 1 = 0 '       
    condicoes = montar_condicao(condicoes=dict_condicoes)
    print("Deu erro aqui oh: - >>>", condicoes)
    QUERY     = QUERY_CORE + where + condicoes
    if order_by:
        order_clauses = []
        for order in order_by:
            origin = order.get("origin")
            field = order.get("field")
            direction = order.get("direction")

            if origin == "campo_contratos":
                order_clauses.append(f"bc.{field} {direction}")
            else:
                order_clauses.append(f"bp.{field} {direction}")
        
        QUERY += " ORDER BY " + ", ".join(order_clauses)
    
    if limit != "todos":
        try:
            limit = int(limit)
            QUERY += f" LIMIT {limit}"
        except ValueError:
            pass
    return QUERY


def convert_bytes_to_str(data):
    if isinstance(data, bytes):
        return data.decode('utf-8')  # Converte bytes para string
    elif isinstance(data, list):
        return [convert_bytes_to_str(item) for item in data]  # Se for lista, converte os elementos
    elif isinstance(data, dict):
        return {key: convert_bytes_to_str(value) for key, value in data.items()}  # Se for dicionário, converte os valores
    return data  # Se não for bytes, mantém o valor original



@csrf_exempt
def criar_segmentacao(request):
    data_hoje = datetime.today().strftime('%Y-%m-%d')
    user      = request.user
    empresa   = user.grupo.id
    
    campos = CamposImportacao.objects.using('business').filter(empresa_id__in=[0, empresa], import_type='pessoas').order_by('empresa_id')
    campos_pessoas = []
    for campo in campos:
        campos_pessoas.append({"campo": campo.label, "slug_db": campo.slug_db,  "value": campo.name, "tipo": campo.data_type, "default": campo.default_col})
    
    campos = CamposImportacao.objects.using('business').filter(empresa_id__in=[0, empresa], import_type='contratos').order_by('empresa_id')
    campos_contratos = []
    for campo in campos:
        campos_contratos.append({"campo": campo.label, "slug_db": campo.slug_db, "value": campo.name, "tipo": campo.data_type, "default": campo.default_col})


    if request.method == 'POST':
        try:
            resposta           = json.loads(request.body)
            segment_name       = resposta.get('segmentName', '')
            segment_query      = resposta.get('segmentQuery', '')
            segment_conditions = resposta.get('segmentConditions', {})
            arquivo_path       = arquivo_query(segment_query, segment_name)
            empresa_id         = request.user.grupo.id
            gcp_path           = f'/segmentacoes/{empresa_id}/{arquivo_path}'
            gcp                = StorageGCP()
            gcp_retorno        = gcp.upload(arquivo_path, gcp_path)
            os.remove(arquivo_path)
            print("finalizou arquivos")

            if not segment_name or not segment_query:
                print("Erro: Nome e query da segmentação são obrigatórios.")
                return JsonResponse({"error": "Nome e query da segmentação são obrigatórios"}, status=400)
            
            try:                 
                Segmentacao.objects.using('business').create(
                    titulo       = segment_name,
                    data_criacao = data_hoje,
                    query_path   = gcp_path,
                    empresa_id   = empresa_id,
                    conditions   = segment_conditions
                )
            except Exception as e:
                print('erro', e)
            
            return JsonResponse({"success": True, "redirect_url": "/business/segmentacoes/"}, status=200)
        except json.JSONDecodeError:
            print("Erro: Formato JSON inválido nos dados recebidos.")
            return JsonResponse({"error": "Formato JSON inválido"}, status=400)
    
    if request.GET.get('data'):
        try:
            request_data = json.loads(request.GET.get('data', '{}'))
            filters = request_data.get('filters', {})
            order_by = request_data.get('orderBy', [])
            limit = request_data.get('limit', 'todos')

            print("Filtros recebidos:", filters)
            print("Ordenação recebida:", order_by)
            print("Limite de leads recebido:", limit)

            query = montar_query(filters, campos_pessoas, campos_contratos, order_by, limit)
            leads = executar_query(query)
            leads_format = convert_bytes_to_str(leads)

            return JsonResponse({"leads": leads_format, "query": query}, safe=False)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Formato JSON inválido"}, status=400)

    context = {
        'campos_pessoas'  : campos_pessoas,
        'campos_contratos': campos_contratos
    }
    return render(request, context=context, template_name='business_criar_segmentacao.html')



@login_required
def editar_segmentacao(request, id):
    data_hoje = datetime.today().strftime('%Y-%m-%d')

    if not request.user.is_authenticated:
        return redirect('/accounts/login/')
    
    segmentacao     = Segmentacao.objects.using('business').get(id=id)
    gcp             = StorageGCP()

    print("Segmentação carregada para edição:")
    print(f"ID: {segmentacao.id}")
    print(f"Título: {segmentacao.titulo}")
    print(f"Data Criação: {segmentacao.data_criacao}")
    print(f"Query Path: {segmentacao.query_path}")
    print(f"Conditions (JSON): {segmentacao.conditions}")

    if request.method == 'GET' and 'filters' in request.GET:  
        try:
            filters = json.loads(request.GET.get('filters', '{}'))
            # print("Filtros recebidos:", json.dumps(filters, indent=4))
            query = montar_query(filters)
            print("Query gerada:", query)
            leads = executar_query(query)
            
            return JsonResponse({"leads": leads, "query":query}, safe=False)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Formato JSON inválido"}, status=400)

    if request.method == 'POST':
        try:
            resposta = json.loads(request.body)

            segment_name    = resposta.get('segmentName', '')
            segment_query   = resposta.get('segmentQuery', '')
            segment_conditions = resposta.get('segmentConditions', {})
            arquivo_path    = arquivo_query(segment_query, segment_name) #Def pra criar o arquivo
            empresa_id      = request.user.grupo.id
            gcp_path        = f'/segmentacoes/{empresa_id}/{arquivo_path}'
            gcp_retorno     = gcp.upload(arquivo_path, gcp_path) #Vai fazer o upload no GCP

            if not segment_name or not segment_query:
                print("Erro: Nome e query da segmentação são obrigatórios.")
                return JsonResponse({"error": "Nome e query da segmentação são obrigatórios"}, status=400)
            
            segmentacao = Segmentacao.objects.get(id=id)
            segmentacao.titulo          =   segment_name
            segmentacao.update_at       =   data_hoje
            segmentacao.query_path      =   gcp_path
            segmentacao.empresa_id      =   empresa_id
            segmentacao.conditions      =   segment_conditions
            os.remove(arquivo_path)#Remove o arquivo temporário da query            
            segmentacao.save()
            print("Segmentação salva com sucesso!")

            return JsonResponse({"success": True, "redirect_url": "/business/segmentacoes/"}, status=200)

        except json.JSONDecodeError:
            print("Erro: Formato JSON inválido nos dados recebidos.")
            return JsonResponse({"error": "Formato JSON inválido"}, status=400)
        
    parceiros = ParceirosDB()
    campos_padrao_pessoas   = parceiros.consulta_campos_pessoas()
    campos_padrao_contrato  = parceiros.consulta_campos_contratos()
    campos_pessoas          = [campo['campo'] for campo in campos_padrao_pessoas]
    campos_contrato         = [campo['campo'] for campo in campos_padrao_contrato]

    context = {
        'segment_name'     : segmentacao.titulo,
        'segment_condition': segmentacao.conditions,
        'segment_creation' : segmentacao.data_criacao,
        'campos_pessoas'   : campos_pessoas,
        'campos_contratos' : campos_contrato
        }
    
    return render(request, context=context, template_name='business_editar_segmentacao.html')

@login_required
@csrf_exempt
def excluir_segmentacao(request, id):
        
    if not request.user.is_authenticated:
        return redirect('/accounts/login/')
    if request.method == 'DELETE':
        print(request)
        fluxo = Segmentacao.objects.get(id=id).delete()
        print('Deletado', id)
        return JsonResponse({"message": "Segmentaçao deletado com sucesso!", "redirect_url": "/segmentacoes/"}, status=200)
    return JsonResponse({'message':'Método não permitido'}, status=401)


def executar_query(query):
    from terceirizada.acruxdb import ParceirosDB
    parceiros = ParceirosDB()
    print(query)

    try:
        # print(query)
        leads_df = parceiros.consulta_query_dinamica(query)

        if leads_df.empty:
            # print("Nenhum lead encontrado no banco!")
            return []

        # print("Leads retornados:")
        # print(leads_df)

        leads_list = leads_df.to_dict(orient="records")
        return leads_list

    except Exception as e:
        print(f"Erro ao executar a query: {e}")
        return []



def novo_fluxo(request):
    user      = request.user
    empresa   = user.grupo.id
    if request.method == 'POST':
        try:
            grupos          = request.POST.getlist('grupos')
            acao_id         = request.POST.get('acao')
            periodicidade   = request.POST.get('periodicidade')
            unidade_tempo   = request.POST.get('unidade_tempo')
            data_inicio     = request.POST.get('data_inicio')
            termino         = request.POST.get('termino')
            qtd_ocorrencias = request.POST.get('qtd_ocorrencias')
            data_termino    = request.POST.get('data_termino')

            data_inicio     = datetime.strptime(data_inicio, "%Y-%m-%dT%H:%M")
            data_termino    = datetime.strptime(data_termino, "%Y-%m-%dT%H:%M") if data_termino else None
            qtd_ocorrencias = int(qtd_ocorrencias) if qtd_ocorrencias else None
            periodicidade   = int(periodicidade)

            acao            = Acoes.objects.using('business').get(id=acao_id)
            
            nova_acao = Fluxos.objects.using('business').create(
                grupos          = ",".join(grupos),
                acao            = acao,
                periodicidade   = periodicidade,
                unidade_tempo   = unidade_tempo,
                data_inicio     = data_inicio,
                termino         = termino,
                qtd_ocorrencias = qtd_ocorrencias,
                data_termino    = data_termino,
                empresa_id      = empresa
            )

            return JsonResponse({"status": "success", "message": "Fluxo criado com sucesso!", "data": {
                "id"             : nova_acao.id,
                "grupos"         : nova_acao.grupos.split(","),
                "acao"           : nova_acao.acao.id,
                "periodicidade"  : nova_acao.periodicidade,
                "unidade_tempo"  : nova_acao.unidade_tempo,
                "data_inicio"    : nova_acao.data_inicio.isoformat(),
                "termino"        : nova_acao.termino,
                "qtd_ocorrencias": nova_acao.qtd_ocorrencias,
                "data_termino"   : nova_acao.data_termino.isoformat() if nova_acao.data_termino else None
            }}, status=201)

        except Exception as e:
            return JsonResponse({"status": "error", "message": "Erro ao criar fluxo.", "error": str(e)}, status=400)

    acoes   = Acoes.objects.using('business').filter(empresa_id__in=[0, empresa]).order_by('empresa_id')
    grupos  = Segmentacao.objects.using('business').filter(empresa_id__in=[0, empresa]).order_by('empresa_id')
    
    context = {
        "acoes" : acoes,
        "grupos": grupos
    }
    return render(request, 'business_novo_fluxo.html', context)



def listar_fluxos(request):
    fluxos = Fluxos.objects.all().order_by('-data_criacao')
    return render(request, 'business_listar_fluxos.html', {'fluxos': fluxos})



def novo_campo(request):
    return render(request, 'business_novo_campo.html')


def business_listar_campos(request):
    user      = request.user
    empresa   = user.grupo.id
    campos    = CamposImportacao.objects.using('business').filter(empresa_id__in=[0, empresa]).order_by('empresa_id')
    return render(request, 'business_listar_campos.html', {'campos': campos})


@csrf_exempt
def acoes(request):
    user    = request.user
    empresa = user.grupo.id
    if request.method == 'POST':
        try:
            grupos          = request.POST.getlist('grupos')
            acao            = request.POST.get('acao')
            periodicidade   = request.POST.get('periodicidade')
            unidade_tempo   = request.POST.get('unidade_tempo')
            data_inicio     = request.POST.get('data_inicio')
            termino         = request.POST.get('termino')
            qtd_ocorrencias = request.POST.get('qtd_ocorrencias')
            data_termino    = request.POST.get('data_termino')

            data_inicio     = datetime.strptime(data_inicio, "%Y-%m-%dT%H:%M")
            data_termino    = datetime.strptime(data_termino, "%Y-%m-%dT%H:%M") if data_termino else None
            qtd_ocorrencias = int(qtd_ocorrencias) if qtd_ocorrencias else None
            periodicidade   = int(periodicidade)

            nova_acao = Acoes.objects.using('business').create(
                grupos=",".join(grupos),
                acao=acao,
                periodicidade=periodicidade,
                unidade_tempo=unidade_tempo,
                data_inicio=data_inicio,
                termino=termino,
                qtd_ocorrencias=qtd_ocorrencias,
                data_termino=data_termino
            )

            return JsonResponse({"status": "success", "message": "Ação criada com sucesso!", "data": {
                "id"             : nova_acao.id,
                "grupos"         : nova_acao.grupos.split(","),
                "acao"           : nova_acao.acao,
                "periodicidade"  : nova_acao.periodicidade,
                "unidade_tempo"  : nova_acao.unidade_tempo,
                "data_inicio"    : nova_acao.data_inicio.isoformat(),
                "termino"        : nova_acao.termino,
                "qtd_ocorrencias": nova_acao.qtd_ocorrencias,
                "data_termino"   : nova_acao.data_termino.isoformat() if nova_acao.data_termino else None
            }}, status=201)

        except Exception as e:
            return JsonResponse({"status": "error", "message": "Erro ao criar ação.", "error": str(e)}, status=400)

    user = request.user
    empresa = user.grupo.id
    campos = CamposImportacao.objects.using('business').filter(empresa_id__in=[0, empresa]).order_by('empresa_id')

    campos_pessoas = [{"label": campo.label, "slug": campo.slug_db} for campo in campos if campo.import_type == "pessoas"]
    campos_contratos = [{"label": campo.label, "slug": campo.slug_db} for campo in campos if campo.import_type == "contratos"]

    return render(request, 'business_nova_acao.html', {
        'campos_pessoas': campos_pessoas,
        'campos_contratos': campos_contratos
    })


def listar_acoes(request):
    user    = request.user
    empresa = user.grupo.id
    acoes   = Acoes.objects.using('business').filter(empresa_id__in=[0, empresa]).order_by('empresa_id')
    return render(request, 'business_listar_acoes.html', {'acoes': acoes})


def editar_acao(request, acao_id):
    acao = get_object_or_404(Acoes, id=acao_id)

    if request.method == 'POST':
        try:
            acao.acao = request.POST.get('acao')
            acao.name = request.POST.get('name')
            acao.save()
            return JsonResponse({"status": "success", "message": "Ação editada com sucesso!"})
        except Exception as e:
            return JsonResponse({"status": "error", "message": "Erro ao editar ação.", "error": str(e)}, status=400)

    user = request.user
    empresa = user.grupo.id
    campos = CamposImportacao.objects.using('business').filter(empresa_id__in=[0, empresa]).order_by('empresa_id')

    campos_pessoas = [{"label": campo.label, "slug": campo.slug_db} for campo in campos if campo.import_type == "pessoas"]
    campos_contratos = [{"label": campo.label, "slug": campo.slug_db} for campo in campos if campo.import_type == "contratos"]

    return render(request, 'business_editar_acao.html', {
        'acao': acao,
        'campos_pessoas': campos_pessoas,
        'campos_contratos': campos_contratos
    })

@login_required
@csrf_exempt
def excluir_acao(request, acao_id):
        
    if not request.user.is_authenticated:
        return redirect('/accounts/login/')
    
    if request.method == 'DELETE':
        acao = Acoes.objects.get(id=acao_id).delete()
        print('Deletado', acao_id)
        return JsonResponse({"message": "Ação deletada com sucesso!", "redirect_url": "/acoes/"}, status=200)
    
    return JsonResponse({'message':'Método não permitido'}, status=401)

@csrf_exempt
def executar_fluxo(request, fluxo_id):
    user      = request.user
    empresa   = user.grupo.id
    try:
        fluxo = Fluxos.objects.using('business').get(id=fluxo_id)
    except:
        fluxo = None
    if fluxo:
        grupos_ids = []
        for grupo_nome in fluxo.grupos.split(','):
            try:
                grupo = Segmentacao.objects.using('business').get(titulo=grupo_nome)
                grupos_ids.append(grupo.id)
            except:
                grupo = None
        payload = {
            'grupos'         : grupos_ids,
            'acao'           : fluxo.acao.id,
            'empresa_id'     : fluxo.empresa_id,
            'usuario_disparo': user.id,
            'empresa_disparo': empresa,
            'momment'        : datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        }   
        fluxo.ultima_execucao = datetime.now()
        fluxo.save()
        response = requests.post("http://34.148.27.47/webhooks/fluxos", json=payload)

        return JsonResponse({"status": "success", "message": f"Fluxo {fluxo.id} executado com sucesso!", "response": response.text})
    return JsonResponse({"status": "error", "message": "Fluxo desconhecido"}, status=400)



def editar_fluxo(request, fluxo_id):
    fluxo = get_object_or_404(Fluxos, id=fluxo_id)
    acoes = Acoes.objects.all()

    # print(fluxo.grupos)
    grupos_disponiveis = [
        {"id": "grupo1", "nome": "Grupo 1"},
        {"id": "grupo2", "nome": "Grupo 2"},
        {"id": "grupo3", "nome": "Grupo 3"},
    ]

    fluxo_grupos = fluxo.grupos.split(",") if fluxo.grupos else []

    if request.method == 'POST':
        try: 
            fluxo.grupos          = ",".join(request.POST.getlist('grupos'))
            fluxo.id_acao         = request.POST.get('acao')
            fluxo.periodicidade   = request.POST.get('periodicidade')
            fluxo.unidade_tempo   = request.POST.get('unidade_tempo')
            fluxo.data_inicio     = request.POST.get('data_inicio')
            fluxo.termino         = request.POST.get('termino')
            fluxo.qtd_ocorrencias = request.POST.get('qtd_ocorrencias')
            fluxo.data_termino    = request.POST.get('data_termino')
            fluxo.ativo           = request.POST.get('status') == 'ativo'
            fluxo.save()

            return JsonResponse({"status": "success", "message": "Fluxo editado com sucesso!"})
        except Exception as e:
            return JsonResponse({"status": "error", "message": "Erro ao editar fluxo.", "error": str(e)}, status=400)

    return render(request, 'business_editar_fluxo.html', {
        'fluxo': fluxo,
        'acoes': acoes,
        'grupos_disponiveis': grupos_disponiveis,
        'fluxo_grupos': fluxo_grupos
    })

@login_required
def excluir_fluxo(request, fluxo_id):
    
    if not request.user.is_authenticated:
        return redirect('/accounts/login/')
    if request.method == 'DELETE':
        
        fluxo = Fluxos.objects.get(id=fluxo_id).delete()
        print('Deletado', fluxo_id)
        return JsonResponse({"message": "Fluxo deletado com sucesso!", "redirect_url": "/business/fluxos/"}, status=200)
    return JsonResponse({'message':'Método não permitido'}, status=401)

def listar_leads(request):
    if not request.user.is_authenticated:
        return redirect('/accounts/login/')
    if request.user.grupo.tipo == 'parceiro':
        return redirect('/t/home/')
    
    usuario_logado  = request.user
    empresa_id      = request.user.grupo.id
    leads           = Pessoas.objects.using('business').filter(empresa_id=empresa_id).order_by('-id')
    total_registros = len(leads)
    page            = request.GET.get('page', 1)
    paginator       = Paginator(leads, 30)
    
    try:
        leads = paginator.page(page)
    except PageNotAnInteger:
        leads = paginator.page(1)
    except EmptyPage:
        leads = paginator.page(paginator.num_pages)
            
    context = {
        'leads'          : leads,
        'total_registros': total_registros,
        'usuario_logado' : usuario_logado
        
    }
    return render(request, 'business_leads.html', context)




def busca_pessoa(request):
    if not request.user.is_authenticated:
        return redirect('/accounts/login/')
    
    if request.user.grupo.tipo == 'parceiro':
        return redirect('/t/home/')
            
    try:
        cpf = request.GET['cpf']
        cpf = somenteNumeros(cpf)
        
        dict_filters               = {}
        dict_filters['cpf']        = cpf
        dict_filters['empresa_id'] = request.user.grupo.id
        filter_q                   = Q(**dict_filters)
        try:
            pessoa = Pessoas.objects.using('business').filter(filter_q).first()
            if pessoa.custom_fields:
                pessoa.custom_fields = json.loads(pessoa.custom_fields)
            
            telefones = Telefones.objects.using('business').filter(filter_q)
            emails    = Emails.objects.using('business').filter(filter_q)
            contratos = Contratos.objects.using('business').filter(filter_q)
            
        except:
            pessoa = None
  
            # db_datalake      = AcruxDBDataLake()
            # db_resolvecontas = AcruxDB()
            # pessoa    = db_datalake.retornaPessoa(cpf)[0]
            # telefones = db_datalake.retornaTelefones(cpf)
            # emails    = db_datalake.retornaEmails(cpf)
            # acordos   = db_resolvecontas.retornaAcordosPessoa(cpf)
            # contratos = db_resolvecontas.retornaContratosPessoa(cpf)
    except:
        pessoa = None
    
    if not pessoa:
        return render(request, 'business_not_found.html')
    
    context = {
        'pessoa'   : pessoa,
        # 'acordos'  : acordos,
        'contratos': contratos,
        'telefones': telefones,
        'emails'   : emails,
        # 'descontos': dict_descontos,
        'usuario_logado': request.user
    }
    return render(request, 'business_resultado_busca_pessoa.html', context)




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
    return render(request, 'business_detalhes_leads.html', context)


def deletar_lead(request, cpf):
    if request.method == "DELETE":
        try:
            lead = get_object_or_404(Pessoas, cpf=cpf)
            lead.delete()
            return JsonResponse({"success": True, "message": "Lead excluído com sucesso!"})
        except Exception as e:
            return JsonResponse({"error": f"Erro ao excluir o lead: {str(e)}"}, status=500)

    return JsonResponse({"error": "Método não permitido!"}, status=405)

@login_required
def editar_campos(request, id):
    if not request.user.is_authenticated:
        return redirect('/accounts/login/')
    campos = CamposImportacao.objects.get(id=id)
    if request.method == 'POST':
        post_response           = json.loads(request.body)
        campos.label            = post_response.get('label', '')
        campos.name             = campos.label.replace(' ', '_').lower()
        campos.slug_db          = campos.label.replace(' ', '_').lower()
        campos.import_type      = post_response.get('tabela', '')
        campos.data_type        = post_response.get('data_type', '')
        campos.update_at        = datetime.today().strftime('%Y-%m-%d')
        campos.updated_by       = request.user.id
        campos.save()
        print(post_response)
        return JsonResponse({"message": "Campo atualizado com sucesso!", "redirect_url": "/business/campos/"}, status=200)
    
    return HttpResponse(f'Método não permitido!')


@login_required
def excluir_campos(request, id):
    if not request.user.is_authenticated:
        return redirect('/accounts/login/')
    if request.method == 'DELETE':
        campos = CamposImportacao.objects.get(id=id)
        campos.delete()
        return JsonResponse({"message": "Campo removido com sucesso!", "redirect_url": "/business/campos/"}, status=200)
    return JsonResponse({'message':'Método não permitido'}, status=401)


@login_required
def business_listar_carteiras(request):
    carteiras = Carteira.objects.using('business').all()
    return render(request, 'business_listar_carteiras.html', {'carteiras': carteiras})


@login_required
def nova_carteira(request):
    if request.method == 'POST':
        nome              = request.POST.get('nome')
        descricao_produto = request.POST.get('descricao_produto')
        caracteristicas   = request.POST.get('caracteristicas')
        descricao_cessao  = request.POST.get('descricao_cessao')
        descricao_divida  = request.POST.get('descricao_divida')
        fontes            = request.POST.get('fontes')

        arquivos = request.FILES.getlist('arquivos')

        if nome and descricao_produto:
            Carteira.objects.using('business').create(
                nome              = nome,
                descricao_produto = descricao_produto,
                caracteristicas   = caracteristicas,
                descricao_cessao  = descricao_cessao,
                descricao_divida  = descricao_divida,
                fontes            = fontes,
                empresa_id        = request.user.grupo.id
            )

            for arquivo in arquivos:
                print(f"Arquivo recebido: {arquivo.name}, tamanho: {arquivo.size}")

            return redirect('business_listar_carteiras')

    return render(request, 'business_criar_carteira.html')


@login_required
def editar_carteira(request, id):
    carteira =  Carteira.objects.using('business').get(id=id)

    if request.method == 'POST':
        nome              = request.POST.get('nome')
        descricao_produto = request.POST.get('descricao_produto')
        caracteristicas   = request.POST.get('caracteristicas')
        descricao_cessao  = request.POST.get('descricao_cessao')
        descricao_divida  = request.POST.get('descricao_divida')
        fontes            = request.POST.get('fontes')
        arquivos          = request.FILES.getlist('arquivos')

        if nome:
            carteira.nome              = nome
            carteira.descricao_produto = descricao_produto
            carteira.caracteristicas   = caracteristicas
            carteira.descricao_cessao  = descricao_cessao
            carteira.descricao_divida  = descricao_divida
            carteira.fontes            = fontes
            carteira.save()

            for arquivo in arquivos:
                print(f"Arquivo recebido no editar: {arquivo.name}, tamanho: {arquivo.size}")

            return redirect('business_listar_carteiras')

    return render(request, 'business_editar_carteira.html', {'carteira': carteira})



@login_required
def business_excluir_carteira(request):
    if request.method == 'POST':
        carteira =  Carteira.objects.using('business').get(id=id)
        carteira.delete()
        return redirect('business_listar_carteiras')

    carteiras = Carteira.objects.all()

    return render(request, 'business_listar_carteiras.html', {'carteiras': carteiras})


def criar_imagem(arquivo):
    arquivo_path = f'{arquivo.name}'
    with open(arquivo_path, 'wb+') as destination:
        for chunk in arquivo.chunks():
            destination.write(chunk)
    return arquivo_path


@login_required
def business_minha_empresa(request):
    empresa = request.user.grupo
    if not empresa:
        return render(request, 'erro.html', {'mensagem': 'Nenhuma empresa vinculada ao seu usuário.'})
    
    return render(request, 'business_minha_empresa.html', {'empresa': empresa})


@login_required
def business_listar_empresas(request):
    empresas = Grupo.objects.all()
    return render(request, 'business_listar_empresas.html', {'empresas': empresas})

@login_required
def nova_empresa(request):
    if not request.user.is_authenticated:
        return redirect('/accounts/login/')
    
    if request.user.grupo.tipo == 'parceiro':
        return redirect('/t/home/')
    
    gcp = StorageGCP()
    if request.method == "POST":
        # Retorno do POST ---------- inicio ------------
        empresa         = Grupo.objects.create()
        nome            = request.POST.get('nome')
        descricao       = request.POST.get('descricao')
        razao_social    = request.POST.get('razao_social')
        cnpj            = request.POST.get('cnpj')
        telefone        = request.POST.get('telefone')
        email           = request.POST.get('email')
        site            = request.POST.get('site')
        linkedin        = request.POST.get('linkedin')
        facebook        = request.POST.get('facebook')
        sftp_host       = request.POST.get('sftp_host')
        sftp_port       = request.POST.get('sftp_port')
        foto            = request.FILES.get('fileUploader')
        sftp_user       = request.POST.get('sftp_user')
        sftp_password   = request.POST.get('sftp_password')
        # Retorno do POST ---------- fim ------------

        # Save empresa ------------ inicio ----------
        empresa.nome_fantasia   = nome
        empresa.description     = descricao
        empresa.razao_social    = razao_social
        empresa.cnpj            = cnpj
        empresa.telefone        = telefone
        empresa.email           = email
        empresa.site            = site
        empresa.linkedin        = linkedin
        empresa.facebook        = facebook
        empresa.sftp_host       = sftp_host
        empresa.sftp_port       = sftp_port
        empresa.sftp_user       = sftp_user
        empresa.save()
        # Save empresa ------------- fim -------------

        # Processamento de arquivos ----------- inicio ---------------
        
        # Processamento de arquivos -----------   fim  ---------------
        return redirect('business_listar_empresas')

    return render(request, 'business_criar_empresa.html', {'empresa': {}})

@login_required
def editar_empresa(request, id):
    empresa = Grupo.objects.get(id=id)
    return render(request, 'business_editar_empresa.html', {'empresa': empresa})