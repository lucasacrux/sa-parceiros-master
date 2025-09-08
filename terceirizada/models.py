from django.db import models


class Leads(models.Model):
    id                = models.AutoField(primary_key=True)
    cpf               = models.CharField(max_length=15, blank=True, null=True)
    nome              = models.CharField(max_length=250, blank=True, null=True)
    sexo              = models.CharField(max_length=5, blank=True, null=True)
    estado_civil      = models.CharField(max_length=10, blank=True, null=True)
    data_nascimento   = models.DateField(blank=True, null=True)
    uf_nascimento     = models.CharField(max_length=5, blank=True, null=True)
    nome_pai          = models.CharField(max_length=250, blank=True, null=True)
    nome_mae          = models.CharField(max_length=250, blank=True, null=True)
    ajuizado          = models.IntegerField(blank=True, null=True)
    central           = models.IntegerField(blank=True, null=True)
    acordo_limpanomes = models.IntegerField(blank=True, null=True)
    acordo_saiuacordo = models.IntegerField(blank=True, null=True)
    enderecos         = models.TextField(blank=True, null=True)
    emails            = models.TextField(blank=True, null=True)
    telefones         = models.TextField(blank=True, null=True)
    contratos         = models.TextField(blank=True, null=True)

    
    def __str__(self):
        return self.nome



