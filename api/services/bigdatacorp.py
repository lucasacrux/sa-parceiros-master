import requests
from django.conf import settings

BASE_URL = "https://plataforma.bigdatacorp.com.br/empresas"


def fetch_lawsuits(cnpj: str, datasets: list[str]):
    """Consulta processos na BigDataCorp para o CNPJ informado."""
    headers = {
        "x-authorization-tokenid": settings.BIGDATA_TOKEN_ID,
        "x-authorization-accesstoken": settings.BIGDATA_ACCESS_TOKEN,
    }
    payload = {"cnpj": cnpj, "datasets": datasets}
    try:
        response = requests.post(BASE_URL, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        raise exc
