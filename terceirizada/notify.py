import requests
from datetime import datetime
# import pytz
import json


# def convert_epoch_momment(momment):
#     ts = int(momment) / 1000.0
#     po = datetime.now()
#     utc_dt = datetime.fromtimestamp(ts, pytz.utc)
#     brt = pytz.timezone('America/Sao_Paulo')
#     brt_dt = utc_dt.astimezone(brt)
#     return brt_dt.strftime('%d/%m/%Y %H:%M:%S')


class ChatZ:

    def __init__(self):    #VERIFICAR SE FAZ SENTIDO COLOCAR NO .ENV
        self.token          = '9DA890CA639CB7ACAF339F97'
        self.instancia      = '3CE49DABB47C50DCDA24EEE17BD0D626'
        self.security_token = 'Fcb21faa776ed4dd6b005cba8fcfb527eS'
        # self.auth_token     = self.credencials['AUTHORIZATION_TOKEN']
        self.url            = f'https://api.z-api.io/instances/{self.instancia}/token/{self.token}/'
        self.header         = {'client-token': self.security_token}

    def notify(self, dados, delayTyp=0, delaySend=0):
#      dados            {'user':request.user.first_name, 
#                        'grupo':request.user.grupo.title, 
#                        'devedor':nome_pessoa, 
#                        'num_parcela':num_parcelas_acordo, 
#                        'valor_acordo':valor_do_acordo, 
#                        'valor_parcela':valor_parcela,
#                        'id_proposta':res_slug,
#                        'aprovacao':aprovacao,
#                        'id_acordo':pcdb.get_id_acordo(cpf=cpf),# esse ID_ACORDO é o campo ID da tabela de CORE-ACORDOS DO BANCO DE DADOS
#                        'valor_aberto':valor_pendente,
#                        'primeira_parc':dia_vencimento_primeira_parcela,
#                        'demais_parc':dia_vencimento_proxima_parcela
#                        }
        data_hoje       = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        json_return     = dados
        user            = json_return.get('user', ' ')
        grupo           = json_return.get('grupo', ' ')
        devedor         = json_return.get('devedor', ' ').title()
        num_parcela     = json_return.get('num_parcela', 0)
        valor_acordo    = json_return.get('valor_acordo', 0)
        valor_parcela   = valor_acordo / int(num_parcela)
        aprovacao       = json_return.get('aprovacao')
        id_proposta     = json_return.get('id_proposta')
        id_acordo       = json_return.get('id_acordo')# ESSE ID NÃO É O DO RESOLVE CONTAS, É O ID AUTO-FIL DA TABELA CORE-ACORDOS
        valor_aberto    = float(json_return.get('valor_aberto'))
        venc_pri        = json_return.get('primeira_parc')
        demais_parc     = json_return.get('demais_parc')

        if aprovacao:#Caso precise de aprovação, envia o link para rejeitar e aceitar o acordo, não precisa de login para recusar ou aceitar, pode vir a dar problema
            url_acordo      = f'https://parceiros.saiuacordo.com.br/t/acordos/aprovar/{id_acordo}/'
            message         = f'*Uma nova proposta foi criada com o valor abaixo do esperado. Revise assim que possível.*\n\nDados do acordo\n---------------------\n*Terceirizada*: {grupo}\n*Responsável*: {user}\n*Devedor*: {devedor}\n*Valor em aberto*: R$ {valor_aberto:.2f}\n*Valor do acordo*: R$ {valor_acordo:.2f}\n*Qtd de parcelas*: {num_parcela}\n*Valor parcela*: R$ {valor_parcela:.2f}\n*Venc Primeira Parc*: {venc_pri}\n*Demais Parcelas*: {demais_parc}\n*Data de criação*: {data_hoje}\n\n*Clique abaixo para aceitar*: {url_acordo}\n*Clique abaixo para recusar*: https://parceiros.saiuacordo.com.br/t/acordos/rejeitar/{id_acordo}/'
        else:#Caso o acordo seja dentro do valor esperado envia apenas o link da proposta pra verificar a mesma
            url_acordo      = f'https://parceiros.saiuacordo.com.br/t/propostas/visualizar/{id_proposta}/'          
            message         = f'*Uma nova proposta foi criada e precisa ser aceita para dar continuidade ao acordo.*\n\nDados do acordo\n---------------------\n*Terceirizada*: {grupo}\n*Responsável*: {user}\n*Devedor*: {devedor}\n*Valor em aberto*: R$ {valor_aberto:.2f}\n*Valor do acordo*: R$ {valor_acordo:.2f}\n*Qtd de parcelas*: {num_parcela}\n*Valor parcela*: R$ {valor_parcela:.2f}\n*Venc Primeira Parc*: {venc_pri}\n*Demais Parcelas*: {demais_parc}\n*Data de criação*: {data_hoje}\n\n*Clique abaixo para ver a proposta*: {url_acordo}'

        url         = f'{self.url}/send-link'
        content     = {
                       'phone':'120363316287796955-group',
                       'message':message,
                       'delayMessage': delaySend,
                       'delayTyping':delayTyp,
                       'image':'https://parceiros.saiuacordo.com.br/static/core/svg/logos/logo.svg',
                       'linkUrl':url_acordo,
                       'title':f'Proposta {devedor}',
                       'linkDescription':'Proposta',
                       }
        try:
            request         = requests.post(url, headers=self.header, data=content).json()
            message_info    = {'returnZapi':request}
            return message_info
        except Exception as e:
            erro = f'Instancia de desenvolvimento desconectada: {e}'
            print(erro)
            return erro
