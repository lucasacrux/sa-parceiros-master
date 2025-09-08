import mysql.connector
from dotenv import load_dotenv
import os

class ResolveDB:
    def __init__(self):
        
        self.host_db     = os.environ.get('HOST')
        self.db          = os.environ.get('LARAVEL_NAME')
        self.user_db     = os.environ.get('LARAVEL_USER')
        self.senha_db    = os.environ.get('LARAVEL_PASS')
        self.db_contrato = 'contratos'

    def conectar_rc(self):
        try:
            self.conn = mysql.connector.connect(
                host=self.host_db,
                database=self.db,
                password=self.senha_db,
                user=self.user_db
            )
            self.cursor = self.conn.cursor()
        except mysql.connector.Error as e:
            print(f'Falha de conexão: {e}')
    
    def conectar_contratos(self):
        try:
            self.conn = mysql.connector.connect(
                host=self.host_db,
                database=self.db,
                password=self.senha_db,
                user=self.user_db
            )
            self.cursor = self.conn.cursor()
        except mysql.connector.Error as e:
            print(f'Falha de conexão: {e}')

    def consulta_original(self, contrato):
        try:
            self.conectar_rc()
            query = f"""SELECT  c.contrato_orig, 
                                d.nome, 
                                d.cpfCnpj,
                                c.carteira_id
                                from contrato c
                                inner join devedor d on c.devedor_id = d.id 
                                WHERE c.contrato = {contrato}"""
            self.cursor.execute(query)
            resultado = self.cursor.fetchall()
            return resultado
        except mysql.connector.Error as e:
            print(f'Falha de conexão {e}')

    def info_extrato(self, contrato):
        try:
            self.conectar_contratos()
            contrato_original = self.consulta_original(contrato)
            query = f"""SELECT * FROM contrato_parcelas cp where cp.NumeroContrato = {contrato_original[0][0]} ORDER BY AnoMesContrato, NumeroParcela"""
            self.cursor.execute(query)
            result = self.cursor.fetchall()
            # infos_contrato = {
            #     'contrato_info':{
            #                     'cpf':result[0][0],
            #                     'ano_contrato':result[0][1][0:4],
            #                     'mes_contrato':result[0][1][4:7],
            #                     'contrato':result[0][2],
            #                     'data_inicio_contrato':result[0][3],
            #                     'data_fim_contrato':result[0][4],
            #                     'num_ct_int':result[0][5],#Numero de contrato interno
            #                     'num_ct_int_prev':result[0][6],#Numero de contrato interno anterior
            #                     'num_ct_int_new':result[0][7],#Numero de contrato interno novo
            #                     'cod_convenio':result[0][8],
            #                     'type_convenio':result[0][9],
            #                     'convenio':result[0][10],
            #                     'matricula':result[0][11],
            #                     'agrup_prod':result[0][12],
            #                     'grupo_prod':result[0][13],
            #                     'produto':result[0][14],#até o 19 pular pois faz parte das parcelas
            #                     'qtd_parcelas':result[0][20],#até o 23 pular
            #                     'origem_cont':result[0][23],
            #                     'tx_anual':result[0][26],
            #                     'tx_mensal':result[0][27],
            #                     'valor_financiado':result[0][28],
            #                     'valor_liberado':result[0][29],
            #                     'cet_am':result[0][35],
            #                     'cet_aa':result[0][36],
            #                     },#Tudo que tá faltando é referente as linhas do extrato, as informações acima são referentes ao HEADER do extrato
            #     'parcelas_info':[]
            # }
            # for info in range(len(result)):
            #     json_retorno = {
            #         'contrato':result[info][0]
            #     }
            #     print(json_retorno)

            return result
        except mysql.connector.Error as e:
            print(f'Falha de conexão {e}')

    
# po = ResolveDB()    
# sa =po.consulta_original('223625013')
# print(sa[0][0])
