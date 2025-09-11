from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from rest_framework.views import APIView
from core.models import Acordo
from .serializers import AcordoSerializer
from rest_framework.response import Response
from rest_framework import status
import json
from django.db.models import Q
from django.http import HttpResponse, JsonResponse
import requests
from .services.bigdatacorp import fetch_lawsuits
from .services.supabase_logger import insert_consultation, extract_process_rows, insert_processes
from .services.supabase_logger import insert_consultation


class PropostasList(APIView):
    def get(self, request, *args, **kwargs):
        # Filtra mensagens por seller_id, se fornecido
        closer    = request.query_params.get('closer')
        try:
            if int(closer) != 58:
                acordos   = Acordo.objects.filter(closer_id=closer, status='Simulação').order_by('-id')
            else:
                acordos   = Acordo.objects.filter(status='Simulação').order_by('-id')
        except:
            acordos   = Acordo.objects.filter(status='Simulação').order_by('-id')

        serializer = AcordoSerializer(acordos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    


class AcordosList(APIView):
    def get(self, request, *args, **kwargs):
        # Filtra mensagens por seller_id, se fornecido
        closer    = request.query_params.get('closer')
        acordos   = Acordo.objects.filter(closer_id=closer).exclude(status='Simulação').order_by('-created_at')

        serializer = AcordoSerializer(acordos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class AcordosListConnect(APIView):
    def get(self, request, *args, **kwargs):
        # Filtra mensagens por seller_id, se fornecido
        seller    = request.query_params.get('seller')
        acordos   = Acordo.objects.filter(
                Q(sdr_id=seller) | Q(closer_id=seller)
            ).exclude(status='Simulação').order_by('-created_at')

        serializer = AcordoSerializer(acordos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ConsultaCNPJView(APIView):
    def post(self, request, *args, **kwargs):
        cnpjs = request.data.get("cnpjs", [])
        datasets = request.data.get("datasets", [])
        if not isinstance(cnpjs, list) or not isinstance(datasets, list):
            return Response(
                {"detail": "cnpjs and datasets must be lists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        results = {}
        errors = {}
        for cnpj in cnpjs:
            try:
                res = fetch_lawsuits(cnpj, datasets)
                results[cnpj] = res
                saved_id = None
                # Best effort: log into Supabase if configured
                try:
                    ins = insert_consultation(cnpj, (datasets[0] if datasets else "processes"), res)
                    if isinstance(ins, dict):
                        saved_id = ins.get("inserted", {}).get("id")
                    rows = extract_process_rows(cnpj, (datasets[0] if datasets else "processes"), res, saved_id)
                    if rows:
                        insert_processes(rows)
                except Exception:
                    pass
            except requests.RequestException as exc:
                errors[cnpj] = str(exc)

        data = {"results": results}
        if errors:
            data["errors"] = errors
            return Response(data, status=status.HTTP_207_MULTI_STATUS)
        return Response(data, status=status.HTTP_200_OK)


def somenteNumeros(cpf):
    return cpf.replace('-', '').replace('.','').replace('(','').replace(')','').replace(' ', '')



def listar_acordos(request):
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
        dict_filters['closer_id'] = closer_selecionado

    if not cpf_pesquisa or len(cpf_pesquisa) < 3:
        cpf_pesquisa = ''
    else:
        dict_filters['cpf'] = somenteNumeros(cpf_pesquisa)
        
                
    filter_q = Q(**dict_filters)
    if len(dict_filters) > 0:
        acordos_list = Acordo.objects.filter(filter_q).exclude(status='Simulação').order_by('-created_at')
    else:
        acordos_list = Acordo.objects.exclude(status='Simulação').order_by('-created_at')
        
    total_registros = len(acordos_list) 
            
    context = {
        'acordos'           : acordos_list,
        'total_registros'   : total_registros,
        'status_selecionado': status_selecionado,
        'closer_selecionado': closer_selecionado,
        'cpf_pesquisa'      : cpf_pesquisa,
        
    }
    return JsonResponse({"resultado": context})
