import pandas as pd
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import mysql.connector
import sqlalchemy
import warnings
warnings.filterwarnings("ignore")
from pathlib import Path
from dotenv import load_dotenv
import logging
import os

BASE_DIR = Path(__file__).resolve().parent.parent

try:
    load_dotenv(BASE_DIR / '.env')
except:
    print ('Cannot load dotenv variables. Is python-dotenv package installed?')
 
    
class BusinessDB:
    
    def __init__(self):
        self.host      = os.environ.get('HOST')
        self.database  = 'prd-parceiros-b2b'
        self.user      = os.environ.get('DATAHUB_USER')
        self.password  = os.environ.get('DATAHUB_PASS')
        self.data_hoje = datetime.today().date().strftime("%Y-%m-%d")
    
    
    def conecta_db(self):
        conn = sqlalchemy.create_engine(f"mysql+mysqlconnector://{self.user}:{self.password}@{self.host}:3306/{self.database}")
        return conn
    
    
    def conecta_update(self):
        conn = mysql.connector.connect(
                host=self.host, 
                database=self.database, 
                user=self.user, 
                password=self.password
            )
        return conn
    
    
    def buscaPessoasEmpresa(self, cpfs, empresa):
        try:
            conn = self.conecta_db()
            QUERY = f"""
                        SELECT * from business_pessoas
                        WHERE empresa_id = {empresa } AND cpf IN {cpfs}
                    """
        except Exception as e:
            return None
        pessoas = pd.read_sql(QUERY, conn)
        return pessoas  
    
    
    def buscaContratoEmpresa(self, contratos, empresa):
        try:
            conn = self.conecta_db()
            QUERY = f"""
                        SELECT * from business_contratos
                        WHERE empresa_id = {empresa } AND contrato IN {contratos}
                    """
        except Exception as e:
            return None
        pessoas = pd.read_sql(QUERY, conn)
        return pessoas  
    
    
    def buscaColunasDefault(self, tipo):
        try:
            conn = self.conecta_db()
            QUERY = f"""
                        SELECT * from business_camposimportacao
                        WHERE default_col = 1 AND import_type = '{tipo}'
                    """
        except Exception as e:
            return None
        colunas = pd.read_sql(QUERY, conn)
        return colunas 
    
    
    def buscaColunasEmpresa(self, empresa, tipo):
        try:
            conn = self.conecta_db()
            QUERY = f"""
                        SELECT * from business_camposimportacao
                        WHERE empresa_id = {empresa} AND import_type = '{tipo}'
                    """
        except Exception as e:
            return None
        colunas = pd.read_sql(QUERY, conn)
        return colunas 
    
    
    def buscaTelefonesPessoas(self, telefones, empresa):
        try:
            conn = self.conecta_db()
            QUERY = f"""
                        SELECT * from business_telefones
                        WHERE empresa_id = {empresa } AND telefone IN {telefones}
                    """
        except Exception as e:
            return None
        telefones = pd.read_sql(QUERY, conn)
        return telefones 
    
    
    def buscaEmailsPessoas(self, emails, empresa):
        try:
            conn = self.conecta_db()
            QUERY = f"""
                        SELECT * from business_emails
                        WHERE empresa_id = {empresa } AND email IN {emails}
                    """
        except Exception as e:
            return None
        emails = pd.read_sql(QUERY, conn)
        return emails 
    
    
    def deletaPessoas(self, cpfs, empresa):
        try:
            conn = self.conecta_update()
            cursor = conn.cursor()
            cursor.execute(f"""
                                DELETE FROM business_pessoas 
                                WHERE empresa_id = {empresa } AND cpf IN {cpfs}
                            """)
            conn.commit()
            
        except Exception as err:
            print(f"Erro ao deletar pessoas: {err}", 'error')
        finally:
            print("Pessoas deletadas")
            
            
    def deletaContratos(self, contratos, empresa):
        try:
            conn = self.conecta_update()
            cursor = conn.cursor()
            cursor.execute(f"""
                                DELETE FROM business_contratos 
                                WHERE empresa_id = {empresa } AND contrato IN {contratos}
                            """)
            conn.commit()
            
        except Exception as err:
            print(f"Erro ao deletar contratos: {err}", 'error')
        finally:
            print("Contratos deletados")
    
    