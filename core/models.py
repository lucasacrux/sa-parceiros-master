import random
import uuid
from django.db import models
from django.utils import timezone
import os
from django.utils.timezone import now
from datetime import timedelta , datetime
from django.core.validators import MinValueValidator
from accounts.models import Grupo, CustomUser
from decimal import Decimal


class Carteira(models.Model):
    nome = models.CharField(max_length=255)
    data_criacao = models.DateTimeField(default=timezone.now)
    data_modificacao = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nome
    

def path_and_rename(instance, filename):
    base_path = 'saparceiros/media/'
    
    if instance.documento_inclusao and instance.documento_inclusao.name == filename:
        path = os.path.join(base_path, 'contrato_inclusao/')
    elif instance.documento_exclusao and instance.documento_exclusao.name == filename:
        path = os.path.join(base_path, 'contrato_exclusao/')
    elif instance.documento_inclusao_devedor and instance.documento_inclusao_devedor.name == filename:
        path = os.path.join(base_path, 'devedor_inclusao/')
    elif instance.documento_exclusao_devedor and instance.documento_exclusao_devedor.name == filename:
        path = os.path.join(base_path, 'devedor_exclusao/')
    else:
        path = os.path.join(base_path, 'others/')

    ext = filename.split('.')[-1]
    filename = f'{filename.rsplit(".", 1)[0]}{datetime.now().strftime("%Y-%m-%d-%H-%M")}-{instance.id}.{ext}'
    return os.path.join(path, filename)


class Arquivos(models.Model):
    documento_inclusao = models.FileField(upload_to=path_and_rename, blank=True, null=True)
    documento_exclusao = models.FileField(upload_to=path_and_rename, blank=True, null=True)
    documento_inclusao_devedor = models.FileField(upload_to=path_and_rename, blank=True, null=True)
    documento_exclusao_devedor = models.FileField(upload_to=path_and_rename, blank=True, null=True)
    data_envio = models.DateTimeField(auto_now_add=True)
    data_processamento = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=100, default='Concluído')

    def __str__(self):
        return self.documento_inclusao.name or self.documento_exclusao.name or self.documento_inclusao_devedor.name or self.documento_exclusao_devedor.name
    
    
def gerar_acordo_id():
    return str(random.randint(1000, 9999999))

def tomorrow():
    return timezone.now() + timedelta(days=7)

class Acordo(models.Model):
    acordo_id                       = models.CharField(max_length=7, default=gerar_acordo_id, blank=True, null=True)
    cpf                             = models.CharField(max_length=20)
    nome_pessoa                     = models.CharField(max_length=255, blank=True, null=True)
    contratos                       = models.CharField(max_length=150)
    contrato_num                    = models.CharField(max_length=20, blank=True, null=True)
    email                           = models.EmailField(blank=True, null=True)
    telefone                        = models.CharField(max_length=20)
    num_parcelas_acordo             = models.IntegerField(blank=True, null=True)
    closer_id                       = models.IntegerField(blank=True, null=True)
    sdr_id                          = models.IntegerField(blank=True, null=True)
    mensagens                       = models.BooleanField(blank=True, null=True)
    contrato_id                     = models.IntegerField()
    carteira_id                     = models.IntegerField()
    id_resolvecontas                = models.IntegerField(blank=True, null=True)
    grupo_owner                     = models.ForeignKey(Grupo, on_delete= models.CASCADE, related_name='grupo_acordo', blank=True, null=True)
    valor_parcela                   = models.DecimalField(max_digits=10, decimal_places=2)
    desconto                        = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, blank=True, null=True)
    dia_vencimento_primeira_parcela = models.DateField(blank=True, null=True)
    dia_vencimento_proxima_parcela  = models.DateField(blank=True, null=True)
    data_criacao                    = models.DateField(null=True, blank=True, auto_now=True)
    created_at                      = models.DateTimeField(null=True, blank=True, auto_now=True)
    valor_pendente                  = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    min_parcelas                    = models.IntegerField(null=True)
    max_parcelas                    = models.IntegerField(null=True)
    maior_desconto_valor            = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    menor_desconto_valor            = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    data_aceite                     = models.DateField(null=True, blank=True)
    parcelas                        = models.JSONField(default=list, blank=True, null=True)
    valor_do_acordo                 = models.DecimalField(max_digits=10, decimal_places=2)
    status                          = models.CharField(max_length=10, default='Simulação')
    status_proposta                 = models.CharField(max_length=50, default='Aberta')
    url_proposta                    = models.CharField(max_length=50, blank=True, null=True)
    data_expiracao_proposta         = models.DateTimeField(default=tomorrow, blank=True, null=True)
    usuario_owner                   = models.ForeignKey(CustomUser, on_delete= models.CASCADE, related_name='usuario_dono', blank=True, null=True)



    def __str__(self):
        return f"Acordo {self.acordoId} - CPF: {self.cpf}, Status: {self.status}"
  


