from django.db import models


class PessoasTerceirizadas(models.Model):
    id_resolvecontas = models.IntegerField(blank=True, null=True)
    id_piperun       = models.IntegerField(blank=True, null=True)
    cpf              = models.CharField(max_length=15, blank=True, null=True)
    nome             = models.CharField(max_length=250, blank=True, null=True)
    sexo             = models.CharField(max_length=5, blank=True, null=True)
    data_nascimento  = models.DateTimeField(blank=True, null=True)
    estado_civil     = models.CharField(max_length=10, blank=True, null=True)
    uf_nascimento    = models.CharField(max_length=5, blank=True, null=True)
    nome_pai         = models.CharField(max_length=250, blank=True, null=True)
    nome_mae         = models.CharField(max_length=250, blank=True, null=True)
    pefin            = models.IntegerField(blank=True, null=True)
    terceirizada     = models.IntegerField(blank=True, null=True)
    enderecos        = models.TextField(blank=True, null=True)
    emails           = models.TextField(blank=True, null=True)
    telefones        = models.TextField(blank=True, null=True)
    contratos        = models.TextField(blank=True, null=True)
