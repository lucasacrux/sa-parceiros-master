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