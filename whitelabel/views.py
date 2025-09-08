from django.shortcuts import render
from .models import MassasFalidas

def somenteNumeros(cpf):
    return cpf.replace('.', '').replace('-','')

def home(request):
    if request.method == "POST":
        cpf  = request.POST.get('cpf')
        nome = request.POST.get('nome')
        try:
            result = MassasFalidas.objects.get(cpf=somenteNumeros(cpf), nome=nome)
            result.cpf = cpf
        except:
            result = None
        context = {
            'result': result
        }
        return render(request, 'w_resultado.html', context)
    return render(request, 'w_home.html')
