# prototipo_saas_sabusiness/models.py
from django.db import models

class SaasConfig(models.Model):
    VERIFICATION_MODES = [
        ("preview", "Visualização (libera UI, bloqueia ações sensíveis)"),
        ("strict", "Estrito (redireciona para o onboarding)"),
    ]
    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    verification_mode = models.CharField(max_length=16, choices=VERIFICATION_MODES, default="preview")
    require_email_verification = models.BooleanField(default=False)
    require_phone_verification = models.BooleanField(default=True)

    # dica: manter singleton simples
    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "Configuração do SA Business"
