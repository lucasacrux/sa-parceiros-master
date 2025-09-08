import time
import os
import mysql.connector
from datetime import datetime
import requests
import json
import pandas as pd
import warnings
warnings.filterwarnings("ignore")

from pathlib import Path
from dotenv import load_dotenv
import os


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

try:
    load_dotenv(BASE_DIR / '.env')
except:
    print ('Cannot load dotenv variables. Is python-dotenv package installed?')

HOST = os.environ.get('HOST')



class AcruxDB:
    
    def __init__(self):
        self.host     =  HOST
        self.database = 'prd-resolvecontas' #PRECISAR CRIAR NO .ENV
        self.user     = 'prd_user_powerbi'  #PRECISAR CRIAR NO .ENV
        self.password = '("rYLs+nER0i&Trc'  #PRECISAR CRIAR NO .ENV
        self.data_hoje = datetime.today().date().strftime("%Y-%m-%d")
        self.browser   = None
        
    
    
    def conecta_db(self):
        conn = mysql.connector.connect(
                host=self.host, 
                database=self.database, 
                user=self.user, 
                password=self.password
            )
        return conn

    
    def retornaUltimasSimulacoes(self):
        try:
            conn = self.conecta_db()
            # QUERY = f"""
            #             SELECT DISTINCT(d.cpfCnpj) FROM devedor d INNER JOIN contrato c
            #             ON c.devedor_id = d.id LEFT JOIN acordo a ON a.contrato_id = c.id WHERE a.id is null
            #         """
            QUERY = """
                        SELECT 
                        a.id as acordoId,
                        a.contrato_id,
                        a.contrato as numContrato,
                        a.dataCriacao,
                        a.qtdParcelas,
                        a.status as statusAcordo,
                        a.valor,
                        a.formaPagamento,
                        a.desconto,
                        a.sinal,
                        a.vencimento,
                        a.vencimentoDemaisBoletos,
                        a.entrada,
                        a.email,
                        a.telefone,
                        a.sdr_id,
                        a.closer_id,
                        c.saldoAPagar,
                        c.carteira_id,
                        d.nome as nomeCliente,
                        d.cpfCnpj as cpfCliente,
                        sdr.name as nomeSdr,
                        sdr.phone as telefoneSdr,
                        closer.name as nomeCoser,
                        closer.phone as telefoneCloser,
                        closer.email as emailCloser
                        FROM acordo a
                        INNER JOIN contrato c ON a.contrato_id = c.id
                        INNER JOIN devedor d ON c.devedor_id = d.id 
                        INNER JOIN users closer ON closer.id = a.closer_id
                        INNER JOIN users sdr ON sdr.id = a.sdr_id
                        WHERE a.status = 1 
                        ORDER BY a.id DESC 
                        LIMIT 10
                    """
        except Exception as e:
            return None
        simulacoes = pd.read_sql(QUERY, conn)
        return simulacoes
    
    
    
    def retornaContratosPessoa(self, cpf):
        
        try:
            conn = self.conecta_db()
            cursor = conn.cursor(dictionary=True)
            QUERY = f"""
                            SELECT 
                            c.saldoAPagar,
                            c.contrato as numeroContrato,
                            c.dataContratacao,
                            c.valorContratado,
                            c.carteira_id,
                            c.campanha_desconto,
                            d.nome as nomeCliente,
                            d.cpfCnpj as cpfCliente,
                            ca.nome as nomeCarteira
                            FROM contrato c
                            INNER JOIN devedor d ON c.devedor_id = d.id 
                            INNER JOIN carteira ca ON c.carteira_id = ca.id
                            WHERE d.cpfCnpj = '{cpf}'  
                    """
            cursor.execute(QUERY)
            contratos = cursor.fetchall()
        except Exception as e:
            print(e)
            return None
        conn.close()
        return contratos
    
    
    def retornaDescontosCampanha(self, campanha_id):
        
        try:
            conn = self.conecta_db()
            cursor = conn.cursor(dictionary=True)
            QUERY = f"""
                            SELECT 
                            * 
                            FROM descontos
                            WHERE desconto_campanha_id = {campanha_id}
                            LIMIT 3  
                    """
            cursor.execute(QUERY)
            descontos = cursor.fetchall()
        except Exception as e:
            print(e)
            return None
        conn.close()
        return descontos
    
    
    def retornaPagamentosRealizados(self, id_usuario_closer, id_usuario_sdr, inicio, fim, carteira_selecionada=99, tipo_legal=99):
        try:
            if carteira_selecionada != 99:
                filtro_carteira = f" AND c.carteira_id = {carteira_selecionada} "
            else:
                filtro_carteira = ''
                
            if tipo_legal != 99 and tipo_legal != 'Todos':
                filtro_tipo_legal = f" AND a.tipoLegal = '{tipo_legal}' "
            else:
                filtro_tipo_legal = ''
                
            if id_usuario_closer and id_usuario_closer != 'Todos':
                usuario_closer_selecionado = f"{id_usuario_closer} as usuario_closer_selecionado,"
                filtro_closer = f" AND (a.sdr_id = {id_usuario_closer} OR a.closer_id = {id_usuario_closer}) "
            else:
                usuario_closer_selecionado = ''
                filtro_closer = ''
            
            if id_usuario_sdr and id_usuario_sdr != 'Todos':
                usuario_sdr_selecionado = f"{id_usuario_sdr} as usuario_sdr_selecionado,"
                filtro_sdr = f" AND (a.sdr_id = {id_usuario_sdr} OR a.closer_id = {id_usuario_sdr}) "
            else:
                usuario_sdr_selecionado = ''
                filtro_sdr = ''
                
            conn = self.conecta_db()
            cursor = conn.cursor(dictionary=True)
            QUERY = f"""
                    SELECT 
                    {usuario_closer_selecionado}
                    {usuario_sdr_selecionado}
                    a.tipoLegal,
                    c.carteira_id,
                    a.id as idAcordo, 
                    a.formaPagamento,
                    a.qtdParcelas,
                    par.numeroParcela,
                    a.dataAceite,
                    a.sdr_id,
                    a.closer_id,
                    pag.situacao as situacaoPagamento, 
                    DATEDIFF(a.dataCriacao, c.proximoVencimentoEmAberto) AS aging, 
                    pag.id as idPagamento,
                    pag.valor_pago,
                    ROUND((a.valor / c.saldoAPagar) * 100, 1) as pctRecuperado,
                    pag.data_pagamento, 
                    par.dataVencimento,
                    rppm.alias,
                    rppm.nome,
                    c.contrato as numeroContrato,
                    RIGHT(c.cpf_devedor, 11) as cpfDevedor
                    FROM resolvecontas_pagamento pag
                    INNER JOIN resolvecontas_pagamento_plataforma_carteira_metodo rppcm ON rppcm.id = pag.id_metodo_pagamento
                    INNER JOIN resolvecontas_pagamento_plataforma_metodo rppm ON rppm.id = rppcm.id_metodo_pagamento 
                    INNER JOIN resolvecontas_parcela_cobranca par_cob ON pag.id_cobranca = par_cob.id_cobranca
                    INNER JOIN resolvecontas_parcela par ON par.id = par_cob.id_parcela 
                    INNER JOIN acordo a ON par.acordo_id = a.id
                    INNER JOIN contrato c ON a.contrato_id = c.id
                    WHERE (pag.data_pagamento >= '{inicio}' AND pag.data_pagamento < '{fim}')
                    AND par_cob.status = 'ATIVO'
                    AND pag.situacao = 'LIQUIDADO'
                    AND (rppm.alias = 'boleto_bb' OR rppm.alias = 'cc_assas')
                    {filtro_tipo_legal}
                    {filtro_closer}
                    {filtro_sdr}
                    {filtro_carteira}
                    ORDER BY pag.data_pagamento DESC
            """
            # print(QUERY)
            cursor.execute(QUERY)
            acordos = cursor.fetchall()
        except Exception as e:
            print(e)
            return None
        conn.close()
        return acordos
    
    
    
    def retornaPagamentosPrevistos(self, id_usuario_closer, id_usuario_sdr, inicio, fim, carteira_selecionada=99, tipo_legal=99):
        
        try:
            if carteira_selecionada != 99:
                filtro_carteira = f" AND c.carteira_id = {carteira_selecionada} "
            else:
                filtro_carteira = ''
                
            if tipo_legal != 99 and tipo_legal != 'Todos':
                filtro_tipo_legal = f" AND a.tipoLegal = '{tipo_legal}' "
            else:
                filtro_tipo_legal = ''
                
            if id_usuario_closer and id_usuario_closer != 'Todos':
                usuario_closer_selecionado = f"{id_usuario_closer} as usuario_closer_selecionado,"
                filtro_closer = f" AND (a.sdr_id = {id_usuario_closer} OR a.closer_id = {id_usuario_closer}) "
            else:
                usuario_closer_selecionado = ''
                filtro_closer = ''
            
            if id_usuario_sdr and id_usuario_sdr != 'Todos':
                usuario_sdr_selecionado = f"{id_usuario_sdr} as usuario_sdr_selecionado,"
                filtro_sdr = f" AND (a.sdr_id = {id_usuario_sdr} OR a.closer_id = {id_usuario_sdr}) "
            else:
                usuario_sdr_selecionado = ''
                filtro_sdr = ''
                
            conn = self.conecta_db()
            cursor = conn.cursor(dictionary=True)
            QUERY = f"""
                    SELECT 
                    {usuario_closer_selecionado}
                    {usuario_sdr_selecionado}
                    a.tipoLegal,
                    c.carteira_id,
                    a.id as idAcordo, 
                    a.dataAceite,
                    a.formaPagamento,
                    a.qtdParcelas,
                    par.numeroParcela,
                    a.sdr_id,
                    a.closer_id,
                    par.situacao as situacaoPagamento, 
                    DATEDIFF(a.dataCriacao, c.proximoVencimentoEmAberto) AS aging, 
                    par.id as idPagamento,
                    par.valor as valor_pago,
                    par.valor,
                    ROUND((a.valor / c.saldoAPagar) * 100, 1) as pctRecuperado,
                    NULL as data_pagamento, 
                    par.dataVencimento,
                    c.contrato as numeroContrato,
                    RIGHT(c.cpf_devedor, 11) as cpfDevedor
                    FROM resolvecontas_parcela par
                    INNER JOIN acordo a ON par.acordo_id = a.id
                    INNER JOIN contrato c ON a.contrato_id = c.id
                    WHERE (par.dataVencimento >= '{inicio}')
                    AND a.active = 'ATIVO'
                    AND a.situacao IN (0,3)
                    AND par.situacao != 'LIQUIDADO' AND par.situacao != 'BAIXADO'
                    {filtro_tipo_legal}
                    {filtro_closer}
                    {filtro_sdr}
                    {filtro_carteira}
                    ORDER BY par.dataVencimento ASC
                    """
            # print(QUERY)

            cursor.execute(QUERY)
            acordos = cursor.fetchall()
        except Exception as e:
            print(e)
            return None
        conn.close()
        return acordos
    
    
    
    def retornaPagamentosPendentes(self, id_usuario_closer, id_usuario_sdr, inicio, fim, carteira_selecionada=99, tipo_legal=99):
        
        try:
            if carteira_selecionada != 99:
                filtro_carteira = f" AND c.carteira_id = {carteira_selecionada} "
            else:
                filtro_carteira = ''
                
            if tipo_legal != 99 and tipo_legal != 'Todos':
                filtro_tipo_legal = f" AND a.tipoLegal = '{tipo_legal}' "
            else:
                filtro_tipo_legal = ''
                
            if id_usuario_closer and id_usuario_closer != 'Todos':
                usuario_closer_selecionado = f"{id_usuario_closer} as usuario_closer_selecionado,"
                filtro_closer = f" AND (a.sdr_id = {id_usuario_closer} OR a.closer_id = {id_usuario_closer}) "
            else:
                usuario_closer_selecionado = ''
                filtro_closer = ''
            
            if id_usuario_sdr and id_usuario_sdr != 'Todos':
                usuario_sdr_selecionado = f"{id_usuario_sdr} as usuario_sdr_selecionado,"
                filtro_sdr = f" AND (a.sdr_id = {id_usuario_sdr} OR a.closer_id = {id_usuario_sdr}) "
            else:
                usuario_sdr_selecionado = ''
                filtro_sdr = ''
                
            conn = self.conecta_db()
            cursor = conn.cursor(dictionary=True)
            QUERY = f"""
                    SELECT 
                    {usuario_closer_selecionado}
                    {usuario_sdr_selecionado}
                    a.tipoLegal,
                    c.carteira_id,
                    a.id as idAcordo, 
                    a.dataAceite,
                    a.formaPagamento,
                    a.qtdParcelas,
                    par.numeroParcela,
                    a.sdr_id,
                    a.closer_id,
                    pag.situacao as situacaoPagamento, 
                    par.situacao as situacaoParcela,
                    DATEDIFF(a.dataCriacao, c.proximoVencimentoEmAberto) AS aging, 
                    pag.id as idPagamento,
                    pag.valor_pago,
                    par.valor,
                    ROUND((a.valor / c.saldoAPagar) * 100, 1) as pctRecuperado,
                    pag.data_pagamento, 
                    par.dataVencimento,
                    rppm.alias,
                    rppm.nome,
                    c.contrato as numeroContrato,
                    pag.identificador,
                    RIGHT(c.cpf_devedor, 11) as cpfDevedor
                    FROM resolvecontas_pagamento pag
                    INNER JOIN resolvecontas_pagamento_plataforma_carteira_metodo rppcm ON rppcm.id = pag.id_metodo_pagamento
                    INNER JOIN resolvecontas_pagamento_plataforma_metodo rppm ON rppm.id = rppcm.id_metodo_pagamento 
                    INNER JOIN resolvecontas_parcela_cobranca par_cob ON pag.id_cobranca = par_cob.id_cobranca
                    INNER JOIN resolvecontas_parcela par ON par.id = par_cob.id_parcela 
                    INNER JOIN acordo a ON par.acordo_id = a.id
                    INNER JOIN contrato c ON a.contrato_id = c.id
                    WHERE (par.dataVencimento >= '{inicio}')
                    AND par_cob.status = 'ATIVO'
                    AND a.status NOT IN (1, 2, 4, 6)
                    and a.situacao NOT IN (1, 6)
                    AND a.active = 'ATIVO'
                    AND par.situacao != 'LIQUIDADO'
                    AND (rppm.alias = 'boleto_bb' OR rppm.alias = 'cc_assas')
                    {filtro_tipo_legal}
                    {filtro_closer}
                    {filtro_sdr}
                    {filtro_carteira}
                    ORDER BY par.dataVencimento ASC
                    """
            # print(QUERY)

            cursor.execute(QUERY)
            acordos = cursor.fetchall()
        except Exception as e:
            print(e)
            return None
        conn.close()
        return acordos
    
    
    
    def retornaAcordosPessoa(self, cpf):
        
        try:
            conn = self.conecta_db()
            cursor = conn.cursor(dictionary=True)
            QUERY = f"""
                         WITH _dados_acordos AS (
                            SELECT 
                            a.id as acordoId,
                            a.contrato_id,
                            a.contrato as numContrato,
                            a.dataCriacao,
                            a.qtdParcelas,
                            a.situacao as situacaoAcordo,
                            a.valor,
                            a.formaPagamento,
                            a.desconto,
                            a.sinal,
                            a.vencimento,
                            a.vencimentoDemaisBoletos,
                            a.entrada,
                            a.email,
                            a.telefone,
                            a.sdr_id,
                            a.closer_id,
                            c.saldoAPagar,
                            c.carteira_id,
                            d.nome as nomeCliente,
                            d.cpfCnpj as cpfCliente,
                            sdr.name as nomeSdr,
                            sdr.phone as telefoneSdr,
                            closer.name as nomeCloser,
                            closer.phone as telefoneCloser,
                            closer.email as emailCloser,
                            pagamentos.NumeroParcela,
                            pagamentos.valor as ValorParcela,
                            pagamentos.percentual_amortizado,
                            pagamentos.dataVencimento,
                            pagamentos.data_pagamento,
                            pagamentos.ordem,
                            FLOOR(ROUND(pagamentos.NumeroParcela * pagamentos.percentual_amortizado, 0)) as totalAmortizado,
                            row_number() OVER (PARTITION BY a.id ORDER BY pagamentos.ordem DESC) as row_num
                            FROM acordo a
                            INNER JOIN contrato c ON a.contrato_id = c.id
                            INNER JOIN devedor d ON c.devedor_id = d.id 
                            INNER JOIN users closer ON closer.id = a.closer_id
                            INNER JOIN users sdr ON sdr.id = a.sdr_id
                            LEFT JOIN (SELECT par.acordo_id, par.ordem, par.NumeroParcela, par.valor, par.percentual_amortizado, par.dataVencimento, pag.data_pagamento FROM resolvecontas_parcela par
                            LEFT JOIN resolvecontas_parcela_cobranca parcob ON par.id = parcob.id_parcela
                            LEFT JOIN resolvecontas_pagamento pag ON parcob.id_cobranca = pag.id_cobranca) AS pagamentos
                            ON pagamentos.acordo_id = a.id
                            WHERE d.cpfCnpj = '{cpf}'  
                            ) SELECT * FROM _dados_acordos
                            WHERE row_num = 1;
                    """
            cursor.execute(QUERY)
            acordos = cursor.fetchall()
        except Exception as e:
            print(e)
            return None
        conn.close()
        return acordos
    
    
        try:
            conn = self.conecta_db()
            # QUERY = f"""
            #             SELECT DISTINCT(d.cpfCnpj) FROM devedor d INNER JOIN contrato c
            #             ON c.devedor_id = d.id LEFT JOIN acordo a ON a.contrato_id = c.id WHERE a.id is null
            #         """
            QUERY = """
                        SELECT 
                        a.id as acordoId,
                        a.contrato_id,
                        a.contrato as numContrato,
                        a.dataCriacao,
                        a.qtdParcelas,
                        a.status as statusAcordo,
                        a.valor,
                        a.formaPagamento,
                        a.desconto,
                        a.sinal,
                        a.vencimento,
                        a.vencimentoDemaisBoletos,
                        a.entrada,
                        a.email,
                        a.telefone,
                        a.sdr_id,
                        a.closer_id,
                        c.saldoAPagar,
                        c.carteira_id,
                        d.nome as nomeCliente,
                        d.cpfCnpj as cpfCliente,
                        sdr.name as nomeSdr,
                        sdr.phone as telefoneSdr,
                        closer.name as nomeCoser,
                        closer.phone as telefoneCloser,
                        closer.email as emailCloser
                        FROM acordo a
                        INNER JOIN contrato c ON a.contrato_id = c.id
                        INNER JOIN devedor d ON c.devedor_id = d.id 
                        INNER JOIN users closer ON closer.id = a.closer_id
                        INNER JOIN users sdr ON sdr.id = a.sdr_id
                        WHERE a.status = 1 
                        ORDER BY a.id DESC 
                        LIMIT 10
                    """
        except Exception as e:
            return None
        simulacoes = pd.read_sql(QUERY, conn)
        return simulacoes
    
    
    
    def retornaAcordosPeriodo(self, inicio, fim, closer_id):
        try:
            conn = self.conecta_db()
            # QUERY = f"""
            #             SELECT DISTINCT(d.cpfCnpj) FROM devedor d INNER JOIN contrato c
            #             ON c.devedor_id = d.id LEFT JOIN acordo a ON a.contrato_id = c.id WHERE a.id is null
            #         """
            QUERY = f"""
                        SELECT 
                        a.id as acordoId,
                        a.contrato_id,
                        a.contrato as numContrato,
                        a.dataCriacao,
                        a.tipoLegal,
                        a.dataAceite,
                        a.qtdParcelas,
                        a.status as statusAcordo,
                        a.valor,
                        a.formaPagamento,
                        a.desconto,
                        a.sinal,
                        a.vencimento,
                        a.vencimentoDemaisBoletos,
                        a.entrada,
                        a.email,
                        a.telefone,
                        a.sdr_id,
                        a.closer_id,
                        a.active,
                        c.saldoAPagar,
                        c.carteira_id,
                        d.nome as nomeCliente,
                        d.cpfCnpj as cpfCliente,
                        sdr.name as nomeSdr,
                        sdr.id as idSdr,
                        closer.name as nomeCoser,
                        closer.id as idCloser,
                        rp.valor as valorParcela
                        FROM acordo a
                        INNER JOIN contrato c ON a.contrato_id = c.id
                        INNER JOIN devedor d ON c.devedor_id = d.id 
                        INNER JOIN users closer ON closer.id = a.closer_id
                        INNER JOIN users sdr ON sdr.id = a.sdr_id
                        LEFT JOIN (
                            SELECT * FROM resolvecontas_parcela
                            WHERE updated_at  BETWEEN '{inicio} 00:00:00' and '{fim} 23:59:59'
                            AND numeroParcela = 1
                        ) as rp ON rp.acordo_id = a.id 
                        WHERE 
                        a.closer_id = {closer_id}
                        AND a.dataAceite BETWEEN '{inicio} 00:00:00' and '{fim} 23:59:59'
                    """
        except Exception as e:
            print(e)
            return None
        acordos = pd.read_sql(QUERY, conn)
        return acordos
    
    
    def retornaParcelas(self, id_acordo):
        try:
            conn = self.conecta_db()
            # QUERY = f"""
            #             SELECT DISTINCT(d.cpfCnpj) FROM devedor d INNER JOIN contrato c
            #             ON c.devedor_id = d.id LEFT JOIN acordo a ON a.contrato_id = c.id WHERE a.id is null
            #         """
            QUERY = f"""
                        SELECT * FROM resolvecontas_parcela WHERE acordo_id = {id_acordo}
                    """
        except Exception as e:
            return None
        parcelas = pd.read_sql(QUERY, conn)
        return parcelas
    
    
     
    def retornaSimulacaoPessoa(self, data, cpf, valor):
        try:
            conn = self.conecta_db()
            # QUERY = f"""
            #             SELECT DISTINCT(d.cpfCnpj) FROM devedor d INNER JOIN contrato c
            #             ON c.devedor_id = d.id LEFT JOIN acordo a ON a.contrato_id = c.id WHERE a.id is null
            #         """
            QUERY = f"""
                        SELECT acordo.*, devedor.cpfCnpj FROM acordo
                        INNER JOIN contrato ON acordo.contrato_id = contrato.id
                        INNER JOIN devedor ON contrato.devedor_id = devedor.id
                        WHERE acordo.dataCriacao = '{data}' AND devedor.cpfCnpj = '{cpf}' AND valor = {valor}
                        ORDER BY id DESC
                    """
        except Exception as e:
            return None
        simulacao = pd.read_sql(QUERY, conn)
        return simulacao
    
  
    

class AcruxDBDataLake:
    
    def __init__(self):
        self.host     = HOST
        self.database = 'data_stage_3'
        self.user     = os.environ.get('DATAHUB_USER')
        self.password = os.environ.get('DATAHUB_PASS')
        self.data_hoje = datetime.today().date().strftime("%Y-%m-%d")
        self.browser   = None
    
    
    def conecta_db(self):
        conn = mysql.connector.connect(
                host=self.host, 
                database=self.database, 
                user=self.user, 
                password=self.password
            )
        return conn

    
    def retornaMensagens(self, remetente, canal, tipo, status, agendado):
        try:
            conn = self.conecta_db()
            cursor = conn.cursor(dictionary=True)
            QUERY = f"""
                        SELECT *
                        FROM msg_mensagens
                        WHERE
                            remetente  = '{remetente}'
                        AND canal      = '{canal}'
                        AND tipo       = '{tipo}'
                        AND status     = {status}
                        AND agendado >= '{agendado}'
                    """
            cursor.execute(QUERY)
            mensagens = cursor.fetchall()
        except Exception as e:
            return None
        conn.close()
        return mensagens
    
    
    def retornaPessoa(self, cpf):
        try:
            conn = self.conecta_db()
            cursor = conn.cursor(dictionary=True)
            QUERY = f"""
                        SELECT *
                        FROM pss_pessoas
                        WHERE
                            cpf  = '{cpf}'
                    """
            cursor.execute(QUERY)
            pessoas = cursor.fetchall()
        except Exception as e:
            return None
        conn.close()
        return pessoas
    
    
    def retornaTelefones(self, cpf):
        try:
            conn = self.conecta_db()
            cursor = conn.cursor(dictionary=True)
            QUERY = f"""
                        SELECT *
                        FROM pss_telefones
                        WHERE
                            cpf  = '{cpf}'
                        ORDER BY hotness DESC
                    """
            cursor.execute(QUERY)
            pessoas = cursor.fetchall()
        except Exception as e:
            return None
        conn.close()
        return pessoas
    
    
    
    def retornaCadastrosSaiuAcordo(self):
        try:
            conn = self.conecta_db()
            cursor = conn.cursor(dictionary=True)
            QUERY = f"""
                        SELECT *
                        FROM log_saiuacordo
                        ORDER BY hora_cadastro DESC
                    """
            cursor.execute(QUERY)
            cadastros = cursor.fetchall()
        except Exception as e:
            print(e)
            return None
        conn.close()
        return cadastros    
    
    
    
    
    def retornaEmails(self, cpf):
        try:
            conn = self.conecta_db()
            cursor = conn.cursor(dictionary=True)
            QUERY = f"""
                        SELECT *
                        FROM pss_emails
                        WHERE
                            cpf  = '{cpf}'
                        ORDER BY hotness DESC
                    """
            cursor.execute(QUERY)
            pessoas = cursor.fetchall()
        except Exception as e:
            return None
        conn.close()
        return pessoas
    
    
    def agendarMensagem(self, remetente, pessoa, destino, canal, tipo, mensagem, data):
        try:
            conn = self.conecta_db()
            cursor = conn.cursor()
            QUERY = f"""
                        INSERT INTO msg_mensagens
                        (remetente, pessoa, destino, canal, tipo, status, mensagem, agendado)
                        VALUES ('{remetente}', '{pessoa}', '{destino}', '{canal}', '{tipo}', 0, '{mensagem}', '{data}')
                    """
            cursor.execute(QUERY)
            conn.commit()
            conn.close()
        except Exception as e:
            print(e)
            return False
        return True
    
    
    def atualizaMensagem(self, id, status, data):
        try:
            conn = self.conecta_db()
            cursor = conn.cursor()
            QUERY = f"""
                        UPDATE msg_mensagens
                        SET status = {status}, enviado = '{data}' WHERE id = {id}
                    """
            cursor.execute(QUERY)
            conn.commit()
            conn.close()
        except Exception as e:
            print(e)
            return False
        return True
    
    
    def retornaOportunidadesData(self, inicio, fim, carteira=None, dono=None):
        try:
            conn = self.conecta_db()
            cursor = conn.cursor(dictionary=True)
            QUERY = f"""
                        SELECT * FROM ppr_oportunidades ppr 
                        LEFT JOIN pss_pessoas pss ON ppr.person_id = pss.id_piperun
                        WHERE ppr.in_date BETWEEN '{inicio} 00:00:00' and '{fim} 23:59:59'
                        and name_stage LIKE '%Agendado%'

                        ORDER BY in_date DESC
                    """
            if dono:
                COMPLEMENTO = f"""
                                AND ppr.owner_id IN (dono)  
                               """
            cursor.execute(QUERY)
            pprs = cursor.fetchall()
        except Exception as e:
            print(e)
            return None
        conn.close()
        return pprs
    
    
    def retornaLogsMensagens(self, cpfs=None):
        try:
            conn = self.conecta_db()
            cursor = conn.cursor(dictionary=True)
            QUERY = f"""
                        SELECT twl.data_envio, twl.destino, twl.status, twl.tipo, pss.cpf FROM twl_logstwilio twl 
                        LEFT JOIN pss_telefones pst ON SUBSTR(twl.destino, 3) = pst.telefone
                        INNER JOIN pss_pessoas pss ON pss.cpf = pst.cpf 
                        WHERE pss.cpf IN ({cpfs})
                    """
            cursor.execute(QUERY)
            pprs = cursor.fetchall()
        except Exception as e:
            print(e)
            return None
        conn.close()
        return pprs
    

class ParceirosDB:

    def __init__(self):
        self.host       = HOST
        self.database   = os.environ.get('BUSINESS_NAME')
        self.user       = os.environ.get('DEFAULT_USER')
        self.password   = os.environ.get('DEFAULT_PASS')
        self.data_hoje  = datetime.today().date().strftime("%Y-%m-%d")

    def conecta_db(self):
        conn = mysql.connector.connect(
                host=self.host, 
                database=self.database, 
                user=self.user, 
                password=self.password
            )
        return conn

    def get_id_acordo(self, cpf): #PEGA O ID AUTO-INCREMENT DO DB
        try:
            conn            = self.conecta_db()
            cursor          = conn.cursor()
            QUERY           = f'SELECT * FROM core_acordo ca WHERE ca.cpf = {cpf} ORDER BY ca.id DESC'
            cursor.execute(QUERY)
            resultado       = cursor.fetchall()          
        except Exception as e:
            print(e)
            return None
        conn.close()
        return resultado[0][0]


    def consulta_campos_pessoas(self):
        try:
            conn = self.conecta_db()
            # cursor = conn.cursor()
            QUERY = 'SELECT * FROM business_pessoas tp WHERE 1 = 1'
            # cursor.execute(QUERY)
            resultado = pd.read_sql(QUERY, conn)
            campos = [{"campo": coluna, "tipo": str(resultado[coluna].dtype)} for coluna in resultado.keys()]
            conn.close()
            return campos
        except Exception as e:
            print(e)
            return []

    def consulta_campos_contratos(self):
        try:
            conn = self.conecta_db()
            # cursor = conn.cursor()
            QUERY = 'SELECT * FROM business_contratos tp WHERE 1 = 1'
            # cursor.execute(QUERY)
            resultado = pd.read_sql(QUERY, conn)
            campos = [{"campo": coluna, "tipo": str(resultado[coluna].dtype)} for coluna in resultado.keys()]
            conn.close()
            return campos
        except Exception as e:
            print(e)
            return []
                
    def consulta_pessoas(self, query):
        try:
            conn = self.conecta_db()
            QUERY = query
            resultado = pd.read_sql(QUERY, conn)
            lista = pd.DataFrame(resultado)
            return lista
        except Exception as e:
            print(f'O erro foi: {e}')
            return e
        
    def consulta_query_dinamica(self, query):
        try:
            conn = self.conecta_db()
            resultado = pd.read_sql(query, conn)
            return resultado
        except Exception as e:
            print(f"Erro ao executar query dinâmica: {e}")
            return pd.DataFrame()
        
    def cpf_check(self, cpf):
        try:
            conn = self.conecta_db()
            cursor = conn.cursor()
            QUERY = f"SELECT * FROM business_pessoas tp WHERE tp.cpf = {cpf}"
            cursor.execute(QUERY)
            resultado       = cursor.fetchall()
            print(resultado)                
            if resultado != []:                
                return True
            else:
                return False
        except Exception as e:
            print(f'O erro foi {e}')
            return e