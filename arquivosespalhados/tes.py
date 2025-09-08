


campos = ['CPF', 'Contrato', 'Saldo']

def consulta_campos(campo):
    if campo in campos:
        print('Já temos esse campo, atualiza o campo')
    else:
        print(f'Esse campo não existe, deseja criar? Ou vincular?\ncampos existentes {campos}')


consulta_campos("Nome")