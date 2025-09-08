from dateutil.relativedelta import relativedelta
import mysql.connector
import datetime
import requests
from pathlib import Path
from dotenv import load_dotenv
import os


HEADERS = {
        "accept": "application/json",
        "Authorization": "Bearer 6|EbVPDgxM5BhGdbsU6MzB9y7LePsfvXIdd3d6NMGC"
    }




# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

try:
    load_dotenv(BASE_DIR / '.env')
except:
    print ('Cannot load dotenv variables. Is python-dotenv package installed?')

HOST = os.environ.get('HOST')



def corrige_data(data):
    data = data.split('/')
    return f'{data[2]}-{data[1]}-{data[0]}'


class AcruxDB:
    
    def __init__(self):
        self.host     =  HOST
        self.database = 'prd-resolvecontas' #ADD NO .ENV
        self.user     = 'prd_user_powerbi'  #ADD NO .ENV
        self.password = '("rYLs+nER0i&Trc'  #ADD NO .ENV
        
    def conecta_db(self):
        conn = mysql.connector.connect(
                host=self.host, 
                database=self.database, 
                user=self.user, 
                password=self.password
            )
        return conn
    
    
    def retornaContratosPessoaUnico(self, cpf, contrato):
        
        try:
            conn = self.conecta_db()
            cursor = conn.cursor(dictionary=True)
            QUERY = f"""
                           SELECT id FROM contrato WHERE contrato = '{contrato}' AND  RIGHT(cpf_devedor, 11) = '{cpf}' LIMIT 1  
                    """
            cursor.execute(QUERY)
            contratos = cursor.fetchall()
        except Exception as e:
            print(e)
            return None
        conn.close()
        try:
            id = contratos[0]['id']
        except:
            id = None
        return id
    
    
    def corrige_parcelas(self, parcelas, id_acordo):
        try:
            for parcela in parcelas:
                QUERY = f"UPDATE resolvecontas_parcela SET dataVencimento = '{corrige_data(parcela['dataVencimento'])}' WHERE acordo_id = {id_acordo} AND numeroParcela = {parcela['numero']};"    
                conn = self.conecta_db()
                cursor = conn.cursor()
                cursor.execute(QUERY)
                conn.commit()
                conn.close()
        except Exception as e:
            print(e)
            return False
        return True
    
    
    
    def update_aceita_acordo(self, id_acordo, data_aceite):
        try:
            conn = self.conecta_db()
            cursor = conn.cursor()
            QUERY = f"""
                        UPDATE acordo SET status = 3, dataAceite = '{data_aceite}' WHERE id = {id_acordo}
                    """
            cursor.execute(QUERY)
            conn.commit()
            conn.close()
        except Exception as e:
            print(e)
            return False
        return True
    
    
    def retornaContratosPessoa(self, cpf, contratos):
        
        try:
            conn = self.conecta_db()
            cursor = conn.cursor(dictionary=True)
            QUERY = f"""
                    SELECT DISTINCT(c.id), c.contrato, a.id FROM contrato c 
                    INNER JOIN acordo_has_contratos ahc ON ahc.contrato_id = c.id
                    INNER JOIN acordo a ON ahc.acordo_id = a.id
                    WHERE c.contrato IN {contratos} AND  RIGHT(c.cpf_devedor, 11) = '{cpf}'
                    AND c.id IN(
                        SELECT c.id FROM contrato c 
                        INNER JOIN acordo_has_contratos ahc ON ahc.contrato_id = c.id
                        INNER JOIN acordo a ON ahc.acordo_id = a.id
                        WHERE c.contrato IN {contratos} AND  RIGHT(c.cpf_devedor, 11) = '{cpf}'
                        AND (a.active = 'ATIVO' AND a.situacao IN (0, 3) AND a.status NOT IN (1, 6, 5))
                    ) AND a.status NOT IN (1, 6, 5)  AND a.situacao IN (0, 3) AND a.active = 'ATIVO'
                    """.replace('[', '(').replace(']', ')')
            cursor.execute(QUERY)
            contratos = cursor.fetchall()
        except Exception as e:
            print(e)
            return None
        conn.close()
        return contratos

        
        

def formataData(data_venc):
    if '/' in data_venc:
        data = data_venc.split('/')
        data = data[2]+'-'+data[1]+'-'+data[0]
        data_venc = data
    return data_venc


def criar_acordo(dict_acordo):
    cpf                = dict_acordo['cpf']
    contrato           = dict_acordo['contrato_id']
    desconto_id        = dict_acordo['discount']
    email              = dict_acordo['email']
    telefone           = dict_acordo['telefone']
    primeiroVencimento = dict_acordo['dataPrimeiroVencimento']
    
    URL_RESOLVE_CONTAS = 'https://www.resolvecontas.com.br'
    URL_ACORDO_CRIAR   = URL_RESOLVE_CONTAS + f'/api/1.0/acordoeasy/acordo/{cpf}/create'
    payload = {
        "contrato_id"           : contrato,
        "discount"              : desconto_id,
        "email"                 : email,
        "telefone"              : telefone,
        'dataPrimeiroVencimento': primeiroVencimento
    }
    response = requests.post(URL_ACORDO_CRIAR, json=payload, headers=HEADERS) 
    return response


def quebra_acordo(id_acordo):
    URL_RESOLVE_CONTAS = 'https://www.resolvecontas.com.br'
    URL_ACORDO_QUEBRA  = URL_RESOLVE_CONTAS + f'/api/1.0/acordo/situacao/{id_acordo}'
    PAYLOAD            = {'situacao': 1}
    response           = requests.put(URL_ACORDO_QUEBRA, headers=HEADERS, data=PAYLOAD)
    return response



def criar_acordo_terceirizada(dict_acordo, sobescrever=True):
    cpf                = dict_acordo['cpf']
    closer_id          = dict_acordo['closer_id']
    sdr_id             = dict_acordo.get('sdr_id', 58)
    contrato_id        = dict_acordo['contrato_id']
    contrato_num       = dict_acordo['contrato_num']
    contratos_list     = dict_acordo['contrato_list']
    valorTotalAcordo   = dict_acordo['valorTotalAcordo']
    desconto           = dict_acordo['desconto']
    percDesconto       = dict_acordo['percDesconto']
    email              = dict_acordo['email']
    telefone           = dict_acordo['telefone']
    primeiroVencimento = dict_acordo['dataPrimeiroVencimento']
    carteira_id        = dict_acordo['carteira_id']
    qtd_parcelas       = dict_acordo['qtd_parcelas']
    dict_parcelas      = dict_acordo['parcelas']
    
    # CRIANDO LISTA DE PARCELAS
    parcelas_list  = []
    valor_acordo = 0
    for parcela in dict_parcelas:
        valor_parcela = float(parcela['valor'].replace('.', '').replace(',', '.'))
        valor_acordo += valor_parcela
        parcelas_list.append(
            {
                'numeroParcela' : parcela['numero'],
                'dataVencimento': formataData(parcela['dataVencimento']),
                'valorParcela'  : valor_parcela
            }
        )
    valorTotalAcordo = round(valor_acordo, 2)
        
    # GERANDO PAYLOAD
    contratos = contratos_list.split(',')
    list_contratos = []
    for contrato in contratos:
        list_contratos.append(str(contrato))

    
    contratos_inaptos = retorna_contrato_id(cpf, list_contratos)
    
    print('Contratos Inaptos: ', contratos_inaptos)
    if not sobescrever:
        if len(contratos_inaptos) > 0:
            return False, 'Um ou mais contratos desse acordo já possuem um acordo ativo! Deseja sobrescrever?'
    else:
        print('Quebrando contratos..')
        for acordo in contratos_inaptos:
            response_quebra = quebra_acordo(acordo['id'])
            print(response_quebra.json())
                
    int_contratos_list = []
    for contrato in contratos_list.split(','):
        int_contratos_list.append(int(contrato.strip()))
    contratos_list_ids = retorna_contrato_id_unico(cpf, int_contratos_list)
    contratos_list_ids = [int(x) for x in contratos_list_ids]

    payload_acordo = {
        'cpfCnpj'       : cpf,
        'sdr'           : sdr_id,
        'closer'        : closer_id, #60,
        'dataCriacao'   : datetime.date.today().strftime("%Y-%m-%d"),
        'parcelas'      : parcelas_list,
        'contratoList'  : contratos_list_ids,
        'qtdParcelas'   : qtd_parcelas,
        'contrato'      : contrato_num,
        'contrato_id'   : contrato_id,
        'email'         : email,
        'telefone'      : telefone,
        'tipoLegal'     : 'extra_judicial',
        'formaPagamento': 'parc',
        'desconto'      : desconto,
        'percDesconto'  : percDesconto,
        'carteira_id'   : carteira_id,
        'valorFinal'    : valorTotalAcordo,
        'entrada'       : 0,
        'observacao'    : '--',
        'sinal'         : 0,
        'statusSerasa'  : 0,
        'vencimento'    : primeiroVencimento,
        'motivoRejeicao': '--',
        'situacao'      : 0,
        'status'        : 3 
    }
    URL_RESOLVE_CONTAS = 'https://www.resolvecontas.com.br'
    URL_ACORDO_CRIAR   = URL_RESOLVE_CONTAS + f'/api/1.0/acordo'
    response           = requests.post(URL_ACORDO_CRIAR, json=payload_acordo, headers=HEADERS)
    return True, response



def retorna_contrato_id_unico(cpf, contratos_list):
    db = AcruxDB()
    new_contratos_list = []
    for contrato in contratos_list:
        contrato_id = db.retornaContratosPessoaUnico(cpf, contrato)
        new_contratos_list.append(str(contrato_id))
    return new_contratos_list


def retorna_contrato_id(cpf, contratos_list):
    db = AcruxDB()
    print("Procurando contratos: ", cpf)
    contratos_list = [str(x).strip() for x in contratos_list]
    contratos_aptos = db.retornaContratosPessoa(cpf, contratos_list)
    print(contratos_aptos)
    return contratos_aptos

    

def aceitar_acordo(dict_acordo):
    db          = AcruxDB()
    id_acordo   = dict_acordo['id_acordo']
    data_aceite = dict_acordo['data_aceite']
    cpf         = dict_acordo['cpf']
    parcelas    = dict_acordo['parcelas']
    print("Aceitando")
    URL_RESOLVE_CONTAS  = 'https://www.resolvecontas.com.br'
    URL_ACORDO_ACEITAR  = URL_RESOLVE_CONTAS + f'/api/1.0/acordoeasy/acordo/{cpf}/accept'
    payload = {
        "agreementId": id_acordo,
        "dueDate"    : data_aceite
    }
    response = requests.post(URL_ACORDO_ACEITAR, json=payload, headers=HEADERS) 
    print(response.json())
    try:
        db.corrige_parcelas(parcelas, id_acordo)
    except Exception as e:
        print('Erro Atualizar Parcelas', e)
    return response




def emitir_cobranca(dict_acordo):
    dict_boletos_carteiras = {
                1: 'eef9202f-e319-11ee-8853-42010a072019', #eef9202f-e319-11ee-8853-42010a072019
                2: 'eef91ee7-e319-11ee-8853-42010a072019', #eef91ee7-e319-11ee-8853-42010a072019
                3: 'eef91d07-e319-11ee-8853-42010a072019' #eef91d07-e319-11ee-8853-42010a072019
    }

    id_parcela         = dict_acordo['id_parcela']
    id_carteira_metodo = dict_boletos_carteiras.get(int(dict_acordo['carteira_id']))
    cpf                = dict_acordo['cpf']
    URL_RESOLVE_CONTAS = 'https://www.resolvecontas.com.br'
    URL_EMITE_COBRANCA = URL_RESOLVE_CONTAS + f'/api/1.0/acordoeasy/cobranca/{cpf}/create'
    payload = {
        'parcela_id'        : id_parcela,
        'carteira_metodo_id': id_carteira_metodo
    }

    response = requests.post(URL_EMITE_COBRANCA, json=payload, headers=HEADERS)
    return response



def pipeline_acordo_parceiro(dict_acordo, sobescrever, simulacao=False):
    ## CRIANDO ACORDO
    sobescrever = True
    success, response = criar_acordo_terceirizada(dict_acordo, sobescrever)
    if not success:
        print("Falhou")
        print(response.json())
        return None, response
    id_resolvecontas = response.json().get('id', None)
    
    ## ACEITANDO ACORDO
    #if id_resolvecontas and not simulacao:
    if id_resolvecontas:
        dict_aceite = {
            'id_acordo'  : id_resolvecontas,
            'cpf'        : dict_acordo['cpf'],
            'data_aceite': datetime.date.today().strftime("%Y-%m-%d"),
            'parcelas'   : dict_acordo['parcelas']
        }
        try:
            response = aceitar_acordo(dict_aceite)
            if 'errors' in response.json():
                return None, response.json()['message']
        except:
            return None, 'Erro ao aceitar acordo'
        
        
        # try:
        #     primeira_parcela = response.json()['data']['parcelas'][0]
        # except Exception as e:
        #     print(e)
        #     primeira_parcela = None
    
        # if primeira_parcela:
        #     dict_parcela = {
        #         'id_parcela'        : primeira_parcela.get('id', None),
        #         'cpf'               : dict_acordo['cpf'],
        #         'carteira_id'       : dict_acordo['carteira_id']
        #     }
        #     response = emitir_cobranca(dict_parcela)
            
    return id_resolvecontas, None