from django.shortcuts import render, redirect
from .admin import CustomUserCreationForm
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from .forms import LoginForm, SignUpForm



def register(request):
    msg = None
    success = False
    if request.method == "POST":
        form = SignUpForm(request.POST)            
        if form.is_valid():
            form.save()
            return redirect('/accounts/login')
        else:
            msg = 'Verifique suas informações'
    else:
        form = SignUpForm()
    context = {
        'form': form,
        'msg': msg,
        'success': success
    }
    return render(request, 'register.html', context)


def login_view(request):
    form = LoginForm(request.POST or None)
    msg = None
    if request.method == "POST":
        if form.is_valid():
            email = form.cleaned_data.get("email")
            raw_password = form.cleaned_data.get("password")
            user = authenticate(username=email, password=raw_password)
            if user is not None:
                login(request, user)
                return redirect('t_home')
            else:
                msg = 'Ops! Verifique seus dados de acesso!'
        else:
            msg = 'Algo não parece certo :/'
    context = {
        'form': form,
        'msg': msg
    }
    return render(request, 'login.html', context)



def logout_view(request):
    logout(request)
    return redirect('/')
