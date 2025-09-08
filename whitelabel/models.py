from django.db import models

class MassasFalidas(models.Model):
    cpf     = models.CharField(max_length=20, blank=True, null=True)
    nome    = models.CharField(max_length=250, blank=True, null=True)
    empresa = models.CharField(max_length=100, blank=True, null=True)
    credito_classe1_2010_faixa = models.CharField(max_length=100, blank=True, null=True)
    credito_classe1_2010_valor = models.CharField(max_length=100, blank=True, null=True)
    credito_classe3_2010_faixa = models.CharField(max_length=100, blank=True, null=True)
    credito_classe3_2010_valor = models.CharField(max_length=100, blank=True, null=True)
    credito_2010_total         = models.CharField(max_length=100, blank=True, null=True)
    empresa_2010               = models.CharField(max_length=100, blank=True, null=True)
    reserva_classe1_2010_faixa = models.CharField(max_length=100, blank=True, null=True)
    reserva_classe1_2010_valor = models.CharField(max_length=100, blank=True, null=True)
    reserva_classe3_2010_faixa = models.CharField(max_length=100, blank=True, null=True)
    reserva_classe3_2010_valor = models.CharField(max_length=100, blank=True, null=True)
    reserva_2010_total         = models.CharField(max_length=100, blank=True, null=True)
    
    credito_classe1_2024_faixa = models.CharField(max_length=100, blank=True, null=True)
    credito_classe1_2024_valor = models.CharField(max_length=100, blank=True, null=True)
    credito_classe3_2024_faixa = models.CharField(max_length=100, blank=True, null=True)
    credito_classe3_2024_valor = models.CharField(max_length=100, blank=True, null=True)
    credito_2024_total         = models.CharField(max_length=100, blank=True, null=True)
    empresa_2024               = models.CharField(max_length=100, blank=True, null=True)
    reserva_classe1_2024_faixa = models.CharField(max_length=100, blank=True, null=True)
    reserva_classe1_2024_valor = models.CharField(max_length=100, blank=True, null=True)
    reserva_classe3_2024_faixa = models.CharField(max_length=100, blank=True, null=True)
    reserva_classe3_2024_valor = models.CharField(max_length=100, blank=True, null=True)
    reserva_2024_total         = models.CharField(max_length=100, blank=True, null=True)
    observacoes                = models.CharField(max_length=250, blank=True, null=True)
    
    def __str__(self):
        return self.nome