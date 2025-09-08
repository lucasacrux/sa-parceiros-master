from django.db import models
from accounts.models import Grupo

class Pessoas(models.Model):
    id                     = models.AutoField(primary_key=True)
    nome                   = models.CharField(max_length=250, blank=True, null=True)
    cpf                    = models.CharField(max_length=15, blank=True, null=True)
    email                  = models.TextField(blank=True, null=True, default='[]')
    telefone               = models.TextField(blank=True, null=True, default='[]')
    data_nascimento        = models.DateField(blank=True, null=True)
    uf                     = models.CharField(max_length=2, null=True, blank=True)
    endereco               = models.TextField(blank=True, null=True)
    nome_pai               = models.CharField(max_length=250, blank=True, null=True)
    nome_mae               = models.CharField(max_length=250, blank=True, null=True)
    sexo                   = models.TextField(blank=True, null=True)
    estado_civil           = models.TextField(blank=True, null=True)
    custom_fields          = models.JSONField(blank=True, null=True)
    empresa_id             = models.IntegerField(blank=True, null=True)
    carteira_id            = models.IntegerField(blank=True, null=True)
    import_name            = models.CharField(max_length=200, blank=True, null=True)
    import_type            = models.CharField(max_length=200, blank=True, null=True)
    rg                     = models.CharField(max_length=20, blank=True, null=True)
    orgaoemissor_rg        = models.CharField(max_length=20, blank=True, null=True)
    orgaoemissor_rg_uf     = models.CharField(max_length=20, blank=True, null=True)
    uf_residencia          = models.CharField(max_length=20, blank=True, null=True)
    data_emissao_rg        = models.CharField(max_length=20, blank=True, null=True)
    endereco_residencia    = models.TextField(blank=True, null=True)
    numero_residencia      = models.CharField(max_length=20, blank=True, null=True)
    compĺemento_residencia = models.TextField(blank=True, null=True)
    bairro_residencia      = models.CharField(max_length=50, blank=True, null=True)
    cidade_residencia      = models.CharField(max_length=50, blank=True, null=True)
    cep_residencia         = models.CharField(max_length=20, blank=True, null=True)
    uf_comercial           = models.CharField(max_length=20, blank=True, null=True)
    endereco_comercial     = models.TextField(blank=True, null=True)
    numero_comercial       = models.CharField(max_length=20, blank=True, null=True)
    complemento_comercial  = models.TextField(blank=True, null=True)
    bairro_comercial       = models.CharField(max_length=50, blank=True, null=True)
    cidade_comercial       = models.CharField(max_length=50, blank=True, null=True)
    



class Contratos(models.Model):
    id                        = models.AutoField(primary_key=True)
    contrato                  = models.CharField(max_length=50, blank=True, null=True)
    cpf                       = models.CharField(max_length=15, blank=True, null=True)
    saldo_a_pagar             = models.TextField(blank=True, null=True)
    custom_fields             = models.JSONField(blank=True, null=True)
    empresa_id                = models.IntegerField(blank=True, null=True)
    numero_parcelas           = models.IntegerField(blank=True, null=True)
    parcelas_nao_pagas        = models.IntegerField(blank=True, null=True)
    parcelas_pagas            = models.IntegerField(blank=True, null=True)
    data_contratacao          = models.CharField(max_length=50, blank=True, null=True)
    data_vencimento           = models.CharField(max_length=50, blank=True, null=True)
    proximo_vencimento_aberto = models.CharField(max_length=50, blank=True, null=True)
    valor_contratado          = models.FloatField(blank=True, null=True)
    taxa_financeira           = models.FloatField(blank=True, null=True)
    valor_parcela             = models.FloatField(blank=True, null=True)


class Telefones(models.Model):
    telefone   = models.CharField(max_length=30, blank=True, null=True)
    cpf        = models.CharField(max_length=15, blank=True, null=True)
    empresa_id = models.IntegerField(blank=True, null=True)



class Emails(models.Model):
    email      = models.CharField(max_length=250, blank=True, null=True)
    cpf        = models.CharField(max_length=15, blank=True, null=True)
    empresa_id = models.IntegerField(blank=True, null=True)
    


class Segmentacao(models.Model):
    id           = models.AutoField(primary_key=True)
    titulo       = models.CharField(max_length=150, blank=True, null=True)
    query_path   = models.FilePathField(blank=True, null=True)
    data_criacao = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    empresa_id   = models.IntegerField(blank=True, null=True)
    carteira_id  = models.IntegerField(blank=True, null=True)
    conditions   = models.JSONField(blank=True, null=True)
    update_at    = models.DateTimeField(auto_now_add=True, blank=True, null=True)
   
    

class CamposImportacao(models.Model):
    type_choices = [
        ('char', 'char'), 
        ('text', 'text'), 
        ('float', 'float'),
        ('bool', 'bool'),
        ('date', 'date'),
        ('int', 'int'),
        ('list', 'list')
    ]
    
    import_choices = [
        ('pessoas', 'pessoas'), 
        ('contratos', 'contratos') 
    ]
     
    id           = models.AutoField(primary_key=True)
    label        = models.CharField(max_length=150, blank=True, null=True)
    name         = models.CharField(max_length=150, blank=True, null=True)
    slug_db      = models.CharField(max_length=150, blank=True, null=True)
    description  = models.TextField(blank=True, null=True)
    default_col  = models.BooleanField(default=False)
    required     = models.BooleanField(default=False)
    data_type    = models.CharField(max_length=50, choices=type_choices, default=False, blank=True, null=True)
    import_type  = models.CharField(max_length=50, choices=import_choices, default=False, blank=True, null=True)
    empresa_id   = models.IntegerField(blank=True, null=True)
    update_at    = models.DateField(null=True, blank=True)
    updated_by   = models.IntegerField(null=True, blank=True)
    char_limit   = models.IntegerField(null=True, blank=True)   


   
class Importacao(models.Model):
    id              = models.AutoField(primary_key=True)
    data_criacao    = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    empresa_id      = models.IntegerField(blank=True, null=True)
    custom_columns  = models.JSONField(blank=True, null=True)
    name            = models.CharField(max_length=250, blank=True, null=True)
    file_name       = models.CharField(max_length=250, blank=True, null=True)
    file_path       = models.TextField(blank=True, null=True)
    status          = models.CharField(max_length=20, blank=True, null=True)
    tipo            = models.CharField(max_length=30, blank=True, null=True)
    list_erros      = models.JSONField(blank=True, null=True)
    total_registros = models.IntegerField(blank=True, null=True)
    total_atualizar = models.IntegerField(blank=True, null=True)
    total_erros     = models.IntegerField(blank=True, null=True)
    usuario_id      = models.IntegerField(blank=True, null=True)
    carteira_id     = models.IntegerField(blank=True, null=True)



class Acoes(models.Model):
    type_choices = [
        ('sms', 'sms'), 
        ('whatsapp', 'whatsapp'), 
        ('leva', 'leva')
    ]
     
    id           = models.AutoField(primary_key=True)
    name         = models.CharField(max_length=250, blank=True, null=True)
    description  = models.TextField(blank=True, null=True)
    text         = models.TextField(blank=True, null=True)
    action_type  = models.CharField(max_length=50, choices=type_choices, default=False, blank=True, null=True)
    empresa_id   = models.IntegerField(blank=True, null=True)



class Fluxos(models.Model):
    id              = models.AutoField(primary_key=True)
    grupos          = models.TextField(blank=True, null=True)
    acao            = models.ForeignKey(Acoes, related_name='acao_fluxo', on_delete=models.CASCADE, blank=True, null=True)
    data_criacao    = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    data_inicio     = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    periodicidade   = models.IntegerField(blank=True, null=True)
    unidade_tempo   = models.CharField(max_length=250, blank=True, null=True)
    termino         = models.CharField(max_length=250, blank=True, null=True)
    qtd_ocorrencias = models.IntegerField(blank=True, null=True)
    data_termino    = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    ativo           = models.BooleanField(default=False)
    empresa_id      = models.IntegerField(blank=True, null=True)
    ultima_execucao = models.DateTimeField(blank=True, null=True)
    
    
class DisparoFluxo(models.Model):
    id              = models.AutoField(primary_key=True)
    fluxo_id        = models.IntegerField(blank=True, null=True)
    momment         = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    result          = models.JSONField(blank=True, null=True)
 
 
class ListaDeContatos(models.Model):
    id          = models.AutoField(primary_key=True)
    name        = models.CharField(max_length=250, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    text        = models.TextField(blank=True, null=True)
    contatos    = models.JSONField(blank=True, null=True)
    empresa_id  = models.IntegerField(blank=True, null=True)


class Carteira(models.Model):
    id                = models.AutoField(primary_key=True)
    nome              = models.CharField(max_length=250, blank=True, null=True)
    descricao_produto = models.TextField(blank=True, null=True)
    caracteristicas   = models.TextField(blank=True, null=True)
    descricao_cessao  = models.TextField(blank=True, null=True)
    descricao_divida  = models.TextField(blank=True, null=True)
    fontes            = models.TextField(blank=True, null=True)
    empresa_id        = models.IntegerField(blank=True, null=True)
