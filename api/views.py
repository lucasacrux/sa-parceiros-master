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
from .services.supabase_logger import (
    insert_consultation,
    extract_process_rows,
    insert_processes,
    upsert_integration_setting,
    get_integration_setting,
)
import os
import requests
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

        # Multi-tenant: accept X-Tenant-Id header or query param
        tenant_id = request.headers.get("X-Tenant-Id") or request.query_params.get("tenant_id")
        document_type = "CNPJ"

        results = {}
        errors = {}
        for cnpj in cnpjs:
            try:
                res = fetch_lawsuits(cnpj, datasets)
                results[cnpj] = {"data": res}
                saved_id = None
                # Best effort: log into Supabase if configured
                try:
                    ins = insert_consultation(cnpj, (datasets[0] if datasets else "processes"), res, tenant_id=tenant_id, document_type=document_type)
                    if isinstance(ins, dict):
                        saved_id = ins.get("inserted", {}).get("id")
                    rows = extract_process_rows(cnpj, (datasets[0] if datasets else "processes"), res, saved_id)
                    if rows:
                        insert_processes(rows, tenant_id=tenant_id)
                except Exception:
                    pass
                if saved_id:
                    results[cnpj]["saved_id"] = saved_id
            except requests.RequestException as exc:
                errors[cnpj] = str(exc)

        data = {"results": results}
        if errors:
            data["errors"] = errors
            return Response(data, status=status.HTTP_207_MULTI_STATUS)
        return Response(data, status=status.HTTP_200_OK)


class ConsultationsHistoryView(APIView):
    def get(self, request, *args, **kwargs):
        """Paginated/filterable history from Supabase consultations table.
        Accepts: tenant_id, dataset, document, from, to, page (1), page_size (20)
        """
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE")
        if not url or not key:
            return Response({"detail": "Supabase not configured"}, status=400)

        tenant_id = request.headers.get("X-Tenant-Id") or request.query_params.get("tenant_id")
        dataset = request.query_params.get("dataset")
        document = request.query_params.get("document")
        consultation_id = request.query_params.get("consultation_id")
        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")
        page = max(int(request.query_params.get("page", 1) or 1), 1)
        page_size = max(min(int(request.query_params.get("page_size", 20) or 20), 200), 1)
        start = (page - 1) * page_size
        end = start + page_size - 1

        params = []
        if tenant_id:
            params.append(f"tenant_id=eq.{tenant_id}")
        if dataset:
            params.append(f"dataset=eq.{dataset}")
        if document:
            params.append(f"document=ilike.*{document}*")
        if date_from:
            params.append(f"requested_at=gte.{date_from}")
        if date_to:
            params.append(f"requested_at=lte.{date_to}")
        qp = ("?" + "&".join(params)) if params else ""
        endpoint = url.rstrip('/') + f"/rest/v1/consultations{qp}&order=requested_at.desc"

        headers = {"Authorization": f"Bearer {key}", "apikey": key, "Range": f"{start}-{end}"}
        resp = requests.get(endpoint, headers=headers)
        try:
            data = resp.json()
        except ValueError:
            data = {"status_code": resp.status_code, "text": resp.text}
        return Response({"data": data, "page": page, "page_size": page_size}, status=resp.status_code)


class ProcessesTimeSeriesView(APIView):
    def get(self, request, *args, **kwargs):
        """Aggregate processes over time (by day) for charts.
        Accepts: tenant_id, dataset, document, from, to
        """
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE")
        if not url or not key:
            return Response({"detail": "Supabase not configured"}, status=400)
        tenant_id = request.headers.get("X-Tenant-Id") or request.query_params.get("tenant_id")
        dataset = request.query_params.get("dataset")
        document = request.query_params.get("document")
        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")

        params = ["select=publish_date,document,dataset"]
        if tenant_id:
            params.append(f"tenant_id=eq.{tenant_id}")
        if dataset:
            params.append(f"dataset=eq.{dataset}")
        if document:
            params.append(f"document=eq.{document}")
        if consultation_id:
            params.append(f"consultation_id=eq.{consultation_id}")
        if date_from:
            params.append(f"publish_date=gte.{date_from}")
        if date_to:
            params.append(f"publish_date=lte.{date_to}")
        qp = "?" + "&".join(params)
        endpoint = url.rstrip('/') + f"/rest/v1/processes{qp}"
        headers = {"Authorization": f"Bearer {key}", "apikey": key}
        resp = requests.get(endpoint, headers=headers)
        try:
            rows = resp.json() if resp.ok else []
        except ValueError:
            rows = []

        # Aggregate by day
        from collections import Counter
        import datetime as dt
        counts = Counter()
        for r in rows:
            ts = r.get("publish_date")
            if not ts:
                continue
            try:
                day = str(ts)[:10]  # YYYY-MM-DD
                counts[day] += 1
            except Exception:
                continue

        series = [{"date": d, "count": c} for d, c in sorted(counts.items())]
        return Response({"series": series, "total": sum(counts.values())})


class ProcessesByCNPJView(APIView):
    def get(self, request, *args, **kwargs):
        """Aggregate processes count grouped by document (CNPJ/CPF)."""
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE")
        if not url or not key:
            return Response({"detail": "Supabase not configured"}, status=400)
        tenant_id = request.headers.get("X-Tenant-Id") or request.query_params.get("tenant_id")
        dataset = request.query_params.get("dataset")
        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")

        params = ["select=document"]
        if tenant_id:
            params.append(f"tenant_id=eq.{tenant_id}")
        if dataset:
            params.append(f"dataset=eq.{dataset}")
        if date_from:
            params.append(f"publish_date=gte.{date_from}")
        if date_to:
            params.append(f"publish_date=lte.{date_to}")
        qp = "?" + "&".join(params)
        endpoint = url.rstrip('/') + f"/rest/v1/processes{qp}"
        headers = {"Authorization": f"Bearer {key}", "apikey": key}
        resp = requests.get(endpoint, headers=headers)
        try:
            rows = resp.json() if resp.ok else []
        except ValueError:
            rows = []

        from collections import Counter
        counts = Counter(r.get("document") for r in rows if r.get("document"))
        top = sorted(({"document": k, "count": v} for k, v in counts.items()), key=lambda x: x["count"], reverse=True)
        return Response({"items": top})


class DatasetsRegistryView(APIView):
    def get(self, request, *args, **kwargs):
        url = os.getenv("SUPABASE_URL"); key = os.getenv("SUPABASE_SERVICE_ROLE")
        if not url or not key:
            return Response({"detail": "Supabase not configured"}, status=400)
        endpoint = url.rstrip('/') + "/rest/v1/integration_datasets?select=*"
        resp = requests.get(endpoint, headers={"Authorization": f"Bearer {key}", "apikey": key})
        try:
            data = resp.json()
        except ValueError:
            data = {"status_code": resp.status_code, "text": resp.text}
        return Response({"data": data}, status=resp.status_code)

    def post(self, request, *args, **kwargs):
        url = os.getenv("SUPABASE_URL"); key = os.getenv("SUPABASE_SERVICE_ROLE")
        if not url or not key:
            return Response({"detail": "Supabase not configured"}, status=400)
        payload = request.data
        endpoint = url.rstrip('/') + "/rest/v1/integration_datasets?on_conflict=key"
        headers = {"Authorization": f"Bearer {key}", "apikey": key, "Content-Type": "application/json"}
        resp = requests.post(endpoint, headers=headers, data=json.dumps(payload))
        try:
            data = resp.json()
        except ValueError:
            data = {"status_code": resp.status_code, "text": resp.text}
        return Response(data, status=resp.status_code)


class WalletImportView(APIView):
    parser_classes = []  # use default DRF parsers; expect multipart/form-data

    def post(self, request, wallet_id: str, *args, **kwargs):
        import csv
        from io import TextIOWrapper
        import pandas as pd

        file = request.FILES.get('file')
        if not file:
            return Response({"detail": "file is required"}, status=400)

        # Read CSV/XLSX one-column to list of docs
        docs: list[str] = []
        name = file.name.lower()
        try:
            if name.endswith('.csv'):
                wrapper = TextIOWrapper(file.file, encoding='utf-8', errors='ignore')
                reader = csv.reader(wrapper)
                for row in reader:
                    for cell in row:
                        cell = (cell or '').strip()
                        if cell:
                            docs.append(cell)
            elif name.endswith('.xlsx'):
                df = pd.read_excel(file)
                for col in df.columns:
                    for v in df[col].tolist():
                        v = str(v).strip()
                        if v and v.lower() != 'nan':
                            docs.append(v)
            else:
                return Response({"detail": "unsupported file type"}, status=400)
        except Exception as exc:
            return Response({"detail": f"failed to parse file: {exc}"}, status=400)

        # Normalize docs (digits only)
        docs = ["".join(ch for ch in d if ch.isdigit()) for d in docs if d]
        docs = [d for d in docs if d]
        if not docs:
            return Response({"detail": "no documents found"}, status=400)

        # Insert into wallet_clients via Supabase REST
        url = os.getenv("SUPABASE_URL"); key = os.getenv("SUPABASE_SERVICE_ROLE")
        if not url or not key:
            return Response({"detail": "Supabase not configured"}, status=400)
        endpoint = url.rstrip('/') + "/rest/v1/wallet_clients"
        headers = {"Authorization": f"Bearer {key}", "apikey": key, "Content-Type": "application/json"}

        payload = [{"wallet_id": wallet_id, "document": d} for d in docs]
        resp = requests.post(endpoint, headers=headers, data=json.dumps(payload))
        if not resp.ok:
            try:
                data = resp.json()
            except ValueError:
                data = {"status_code": resp.status_code, "text": resp.text}
            return Response(data, status=resp.status_code)
        return Response({"inserted": len(payload)})


class ConsultByDatasetKeyView(APIView):
    def post(self, request, *args, **kwargs):
        """Generic consult by dataset key registered in integration_datasets.
        Body: { key: string, document: string }
        """
        url = os.getenv("SUPABASE_URL"); key = os.getenv("SUPABASE_SERVICE_ROLE")
        if not url or not key:
            return Response({"detail": "Supabase not configured"}, status=400)
        body = request.data or {}
        ds_key = body.get("key")
        document = body.get("document")
        if not ds_key or not document:
            return Response({"detail": "key and document are required"}, status=400)

        # Load dataset config
        endpoint = url.rstrip('/') + f"/rest/v1/integration_datasets?key=eq.{ds_key}&limit=1"
        headers = {"Authorization": f"Bearer {key}", "apikey": key}
        ds_resp = requests.get(endpoint, headers=headers)
        try:
            ds_rows = ds_resp.json()
        except ValueError:
            ds_rows = []
        if not isinstance(ds_rows, list) or not ds_rows:
            return Response({"detail": "dataset not found"}, status=404)
        cfg = ds_rows[0]

        # Build request
        import re
        url_template = (cfg.get("url_template") or "").strip()
        method = (cfg.get("method") or "GET").upper()
        headers_cfg = cfg.get("headers") or {}
        body_template = cfg.get("body_template") or None
        resolved_url = re.sub(r"\{\{\s*document\s*\}\}", str(document), url_template)
        req_headers = {"accept": "application/json", **headers_cfg}
        req_json = None
        if body_template:
            try:
                body_json_text = re.sub(r"\{\{\s*document\s*\}\}", str(document), body_template)
                req_json = json.loads(body_json_text)
            except Exception:
                req_json = None

        # Execute
        try:
            resp = requests.request(method, resolved_url, headers=req_headers, json=req_json, timeout=25)
            try:
                data = resp.json()
            except ValueError:
                data = {"status_code": resp.status_code, "text": resp.text}
        except requests.RequestException as exc:
            return Response({"error": str(exc)}, status=502)

        # Log to Supabase
        tenant_id = request.headers.get("X-Tenant-Id") or request.query_params.get("tenant_id")
        document_type = cfg.get("doc_type") or None
        try:
            ins = insert_consultation(str(document), ds_key, data, tenant_id=tenant_id, document_type=document_type)
            cons_id = ins.get("inserted", {}).get("id") if isinstance(ins, dict) else None
            rows = extract_process_rows(str(document), ds_key, data, cons_id)
            if rows:
                insert_processes(rows, tenant_id=tenant_id)
        except Exception:
            pass

        return Response({"data": data})


class BigDataIntegrationView(APIView):
    def get(self, request, *args, **kwargs):
        data = get_integration_setting("bigdatacorp")
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        token_id = request.data.get("token_id")
        access_token = request.data.get("access_token")
        if not token_id or not access_token:
            return Response({"detail": "token_id and access_token are required"}, status=400)
        res = upsert_integration_setting("bigdatacorp", token_id, access_token)
        return Response(res, status=status.HTTP_200_OK)


class PublicConsultationsProxy(APIView):
    def get(self, request, *args, **kwargs):
        # Simple passthrough to Supabase REST with service role (server-side only)
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE")
        if not url or not key:
            return Response({"detail": "Supabase not configured"}, status=400)
        qs = request.META.get('QUERY_STRING', '')
        endpoint = url.rstrip('/') + "/rest/v1/consultations" + ("?" + qs if qs else "")
        resp = requests.get(endpoint, headers={"Authorization": f"Bearer {key}", "apikey": key})
        try:
            data = resp.json()
        except ValueError:
            data = {"status_code": resp.status_code, "text": resp.text}
        return Response(data, status=resp.status_code)


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
