from django import template 
from django.template.defaulttags import register
import datetime, json, unicodedata
from datetime import date
from django.utils.translation import to_locale, get_language
from decimal import Decimal
import locale


register = template.Library()
    
@register.filter
def get_item(dictionary, key):
    try:
        return dictionary.get(key, '-')
    except:
        return None
    

@register.filter
def get_item_list(dictionary, key):
    try:
        list = dictionary.get(key, '-')
        return list.replace('[ ','').replace(' ]','').split(',')
    except:
        return None
    

@register.filter
def get_tipo(dictionary, key):
    qtd = dictionary.get(key, 1)
    if int(qtd) > 1:
        tipo = 'checkbox'
    else:
        tipo = 'radio'
    return tipo


@register.filter
def get_sexo(item):
    item = str(item).upper()
    if item == 'M':
        return 'Homem'
    return 'Mulher'


@register.filter
def get_minutos(segundos):
    segundos = float(segundos)
    minutos = int(segundos / 60)
    return minutos


@register.filter
def get_total_atendimento(totais):
    if len(totais) > 0:
        return int(totais['totais']['total_seconds_atendimento_sum'])
    else:
        return 0
    
    
@register.filter
def get_total_espera(totais):
    if len(totais) > 0:
        return int(totais['totais']['total_seconds_espera_sum'])
    else:
        return 0


@register.filter
def formata_cpf(item):
    item = str(item)
    item = item.replace('.','').replace('-','')
    while len(item) < 11:
        item = '0' + item    
    cpf_formatado = f"{item[:3]}.{item[3:6]}.{item[6:9]}-{item[9:]}"
    return cpf_formatado


@register.filter
def formata_telefone(item):
    item = str(item)
    item = item.replace(' ','')
    if len(item[7:]) < 4:
        telefone_formatado = f"({item[:2]}) {item[2:6]}-{item[6:]}"
    else:
        telefone_formatado = f"({item[:2]}) {item[2:7]}-{item[7:]}"
    return telefone_formatado
    



@register.filter
def get_idade(item):
    try:
        idade = (datetime.datetime.today() - item)
        result = (idade.days / 365.25)
        termo = f"{int(result)} anos"
    except:
        return ''
    return termo


@register.filter
def get_nome_arquivo(item):
    item = str(item)
    nome = item.split("/")[-1]
    return nome

@register.filter
def verifyNone(item):
    if item == None:
        return ''
    else:
        return item

@register.filter
def get_item_int(dictionary, key):
    try:
        return dictionary.get(key)
    except:
        return 0


@register.filter
def get_perm(dictionary, key):
    if dictionary == '':
        return 'hidden'
    permissoes = dictionary.replace('\'','"').replace('\"\"None\"\"', '\"None\"')
    permissoes = json.loads(permissoes)
    try:
        if permissoes.get(key) == 'on':
            return ''
        else:
            return 'hidden'
    except:
        return 'hidden'




@register.filter
def get_checked(dictionary, key):
    try:
        if dictionary.get(key) == 'on':
            return 'checked'
        else:
            return ''
    except:
        return ''

