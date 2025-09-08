# models.py
from django.db import models
from django.contrib.auth.models import AbstractUser



class Grupo(models.Model):
    tipo_choices     = [('adm', 'adm'), ('business', 'business'), ('parceiro', 'parceiro')]
    title            = models.CharField(max_length=200)
    avatar           = models.ImageField(upload_to='avatar',  blank=True, null=True)
    description      = models.CharField(max_length=255, blank=True, null=True)
    id_resolvecontas = models.IntegerField(blank=True, null=True)
    ativo            = models.BooleanField(default=True, verbose_name='Ativo')
    id_central       = models.IntegerField(blank=True, null=True)
    razao_social     = models.CharField(max_length=255, blank=True, null=True)
    cnpj             = models.CharField(max_length=30, blank=True, null=True)
    nome_fantasia    = models.CharField(max_length=255, blank=True, null=True)
    telefone         = models.CharField(max_length=30, blank=True, null=True)
    email            = models.CharField(max_length=255, blank=True, null=True)
    site             = models.CharField(max_length=255, blank=True, null=True)
    linkedin         = models.CharField(max_length=255, blank=True, null=True)
    facebook         = models.CharField(max_length=255, blank=True, null=True)
    instagram        = models.CharField(max_length=255, blank=True, null=True)
    twitter          = models.CharField(max_length=255, blank=True, null=True)
    avatar           = models.ImageField(upload_to='avatar', blank=True, null=True)
    tipo             = models.CharField(max_length=50, choices=tipo_choices, default=False, blank=True, null=True)
    sftp_host        = models.TextField(null=True, blank=True)
    sftp_port        = models.IntegerField(null=True, blank=True)
    sftp_user        = models.TextField(null=True, blank=True)
    sftp_key         = models.TextField(null=True, blank=True)
    sftp_pass        = models.TextField(null=True, blank=True)
    
    

class CustomUser(AbstractUser):
    adm              = models.BooleanField(default=False, verbose_name='Administrativo')
    gerente          = models.BooleanField(default=False, verbose_name='Gerente')
    supergerente     = models.BooleanField(default=False, verbose_name='Super Gerente')
    id_resolvecontas = models.IntegerField(blank=True, null=True)
    ativo            = models.BooleanField(default=True, verbose_name='Ativo')
    telefone         = models.CharField(max_length=30, blank=True, null=True)
    grupo            = models.ForeignKey(Grupo, on_delete= models.CASCADE, related_name='grupo_usuario', blank=True, null=True)
