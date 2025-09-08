# prototipo_saas_sabusiness/admin.py
from django.contrib import admin
from .models import SaasConfig

@admin.register(SaasConfig)
class SaasConfigAdmin(admin.ModelAdmin):
    # 1) a primeira coluna vira um link (não editável)
    list_display = ("id", "verification_mode", "require_email_verification", "require_phone_verification")
    list_display_links = ("id",)

    # 2) os demais campos podem ser editados inline
    list_editable = ("verification_mode", "require_email_verification", "require_phone_verification")

    # (opcional) tratar como singleton
    def has_add_permission(self, request):
        return not SaasConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
