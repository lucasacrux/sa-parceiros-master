from django.shortcuts import render
from .models import PessoasTerceirizadas


def home(request):
    return render(request, 'index.html')