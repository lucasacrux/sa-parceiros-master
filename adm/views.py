from django.core.files.storage import default_storage
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render, redirect
from accounts.models import CustomUser, Grupo


def detalhes_usuario(request, usuario_id):
    usuario = CustomUser.objects.get(id=usuario_id)
    if request.method == "POST":
        usuario.first_name = request.POST.get('nome')
        grupo_id           = request.POST.get('grupo')
        ativo              = request.POST.get('ativo')
        usuario.ativo      = {'on':1}.get(ativo, 0)
        adm                = request.POST.get('adm')
        usuario.telefone   = request.POST.get('telefone')
        
        if request.user.gerente == 1:
            usuario.adm        = {'on':1}.get(adm, 0)
            
        if not grupo_id:
            grupo_id = request.user.grupo.id
        usuario.grupo      = Grupo.objects.get(id=grupo_id)

        senha = request.POST.get('senha')
        if senha != '':
            usuario.set_password(senha)
            
        usuario.save()
        return redirect('/adm/usuarios/')
            
    grupos  = Grupo.objects.all()
    context = {
        'usuario': usuario,
        'usuario_logado': request.user,
        'grupos' : grupos,
        'titulo' : 'Detalhes do '
    }
    return render(request, 'adm_form_usuario.html', context)


def criar_usuario(request):
    if request.method == "POST":
        nome     = request.POST.get('nome')
        grupo_id = request.POST.get('grupo')
        if not grupo_id:
            grupo_id = request.user.grupo.id
            
        ativo    = request.POST.get('ativo')
        ativo    = {'on':1}.get(ativo, 0)
        adm      = request.POST.get('adm')
        adm      = {'on':1}.get(adm, 0)
        email    = request.POST.get('email')
        telefone = request.POST.get('telefone')
        senha    = request.POST.get('senha')
        grupo    = Grupo.objects.get(id=grupo_id)
        usuario  = CustomUser.objects.create_user(username   = email, 
                                                 email      = email,
                                                 password   = senha,
                                                 ativo      = ativo,
                                                 grupo      = grupo,
                                                 adm        = adm,
                                                 telefone   = telefone,
                                                 first_name = nome)

        return redirect('/adm/usuarios/') 
    grupos  = Grupo.objects.all()
    context = {
        'grupos' : grupos,
        'titulo' : 'Novo ',
        'usuario_logado': request.user
    }
    return render(request, 'adm_form_usuario.html', context)



def listar_usuarios(request):
    usuario_logado = request.user
    
    if usuario_logado.gerente == 1:
        usuarios = CustomUser.objects.all()
    elif usuario_logado.adm == 1:
        usuarios = CustomUser.objects.filter(grupo=usuario_logado.grupo)
    else:
        return redirect('/t/home')
    
    context = {
        'usuarios': usuarios,
        'usuario_logado': request.user
    }
    return render(request, 'adm_listar_usuarios.html', context)



def detalhes_grupo(request, grupo_id):
    grupo = Grupo.objects.get(id=grupo_id)
    if request.method == "POST":
        grupo.title            = request.POST.get('nome')
        grupo.description      = request.POST.get('descricao')
        ativo                  = request.POST.get('ativo')
        
        if request.user.gerente == 1:
            grupo.ativo            = {'on':1}.get(ativo, 0)
            grupo.id_resolvecontas = request.POST.get('id_resolvecontas')

        grupo.razao_social     = request.POST.get('razao_social')
        grupo.cnpj             = request.POST.get('cnpj')
        grupo.nome_fantasia    = request.POST.get('nome_fantasia')
        grupo.telefone         = request.POST.get('telefone')
        grupo.email            = request.POST.get('email')
        grupo.site             = request.POST.get('site')
        grupo.linkedin         = request.POST.get('linkedin')
        grupo.facebook         = request.POST.get('facebook')
        grupo.instagram        = request.POST.get('instagram')
        grupo.twitter          = request.POST.get('twitter')
        grupo.avatar           = request.FILES.get('avatar')
        
        grupo.save()
        return redirect('/adm/grupos/') 
    context = {
        'grupo': grupo,
        'titulo' : 'Detalhes da ',
        'usuario_logado': request.user
    }
    return render(request, 'adm_form_grupo.html', context)



def criar_grupo(request):
    if request.method == "POST":
        nome             = request.POST.get('nome')
        descricao        = request.POST.get('descricao')
        id_resolvecontas = request.POST.get('id_resolvecontas')
        ativo            = request.POST.get('ativo')
        ativo            = {'on':1}.get(ativo, 0)
        razao_social     = request.POST.get('razao_social')
        cnpj             = request.POST.get('cnpj')
        nome_fantasia    = request.POST.get('nome_fantasia')
        telefone         = request.POST.get('telefone')
        email            = request.POST.get('email')
        site             = request.POST.get('site')
        linkedin         = request.POST.get('linkedin')
        facebook         = request.POST.get('facebook')
        instagram        = request.POST.get('instagram')
        twitter          = request.POST.get('twitter')
        
        Grupo.objects.create(
                             title            = nome,
                             description      = descricao,
                             id_resolvecontas = id_resolvecontas,
                             ativo            = ativo,
                             razao_social     = razao_social,
                             cnpj             = cnpj,
                             nome_fantasia    = nome_fantasia,
                             telefone         = telefone,
                             email            = email,
                             site             = site,
                             linkedin         = linkedin,
                             facebook         = facebook,
                             instagram        = instagram,
                             twitter          = twitter
                        )
        return redirect('/adm/grupos/') 
    return render(request, 'adm_form_grupo.html')


def listar_grupos(request):
    if request.user.gerente == 1:
        grupos = Grupo.objects.all().order_by('title')
        context = {
            'grupos': grupos,
            'usuario_logado': request.user
        }
        return render(request, 'adm_listar_grupos.html', context)
    return redirect('/adm/grupos/detalhes/'+str(request.user.grupo_id))


def home(request):
    return render(request, 'adm_home.html')

def configuracoes(request):
    return render(request, 'adm_configuracoes.html')

def importacoes(request):
    return render(request, 'adm_importacoes.html')

def business(request):
    return render(request, 'adm_business.html')

def parceiros(request):
    return render(request, 'adm_parceiros.html')

def leads(request):
    return render(request, 'adm_leads.html')




