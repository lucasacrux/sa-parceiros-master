from django.contrib import admin
from .models import CamposImportacao, Importacao, Segmentacao

@admin.register(CamposImportacao)
class CamposImportacao(admin.ModelAdmin):
    list_display = ('label', 'name', 'default_col', 'required', 'import_type', 'empresa_id')
    list_filter = ('name',)

