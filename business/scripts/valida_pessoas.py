import pandas as pd
import re
from datetime import datetime
import sqlalchemy
import json
import warnings
from pathlib import Path
from dotenv import load_dotenv
from validate_docbr import CPF  
from ._dbbusiness import BusinessDB
warnings.filterwarnings("ignore")


def normaliza_cpf(cpf):
    cpf = str(cpf)
    while len(cpf) < 11:
        cpf = '0' + cpf
    return cpf


def retornaNulos(column):
    col = len(str(column).strip())
    if col == 0:
        return None
    return column


class ValidadorPessoas:
    
    def __init__(self, file, empresa, carteira, import_name, colunas, tipo):
        self.empresa          = empresa
        self.carteira         = carteira
        self.import_name      = import_name
        self.filename         = file
        self.df               = None
        self.qtd_registros    = 0
        self.erros            = []
        self.colunas          = colunas
        self.colunas_default  = []
        self.colunas_required = []
        self.colunas_empresa  = []
        self.colunas_criar    = []
        self.import_type      = tipo
        self.total_atualizar  = 0
        self.cpf_validator    = CPF()
        self.db_business      = BusinessDB()


    ### ---------------- FUNÇÕES
    def validar_colunas_obrigatorias(self):
        for col in self.colunas_required:
            if col not in self.df.columns:
                self.erros.append("Falta coluna obrigatória")
                
    
    def validar_cpf_vazio(self):
        if self.df["cpf"].isnull().sum() > 0:
            self.erros.append("Existe(m) CPF(s) vazio(s).")
        

    def validar_cpf_invalido(self):
        invalidos = self.df[~self.df["cpf"].astype(str).apply(self.cpf_validator.validate)]
        if not invalidos.empty:
            self.erros.append(f"Existe(m) {len(invalidos)} CPF(s) inválido(s).") 
            
            
    def corrigir_encoding_quebrado(self, texto):
        if isinstance(texto, str):
            try:
                return texto.encode('latin1').decode('utf-8')
            except (UnicodeEncodeError, UnicodeDecodeError):
                return texto  
        return texto
    ### ------------ FIM FUNÇÕES
    
    
    
    def merge_json(self, series):
        merged = {}
        for item in series.dropna(): 
            try:
                data = json.loads(item)
                if isinstance(data, dict): 
                    merged.update(data)  
            except json.JSONDecodeError:
                pass 
        return json.dumps(merged) if merged else None  


    def recuperaColunasDefault(self):
        df_colunas   = self.db_business.buscaColunasDefault(self.import_type)
            
        COLS_DEFAULT = list(df_colunas['name'].unique())
        self.colunas_default = COLS_DEFAULT
        
        COLS_REQUIRED = list(df_colunas[df_colunas['required']==1]['name'].unique())
        self.colunas_required = COLS_REQUIRED
        
        
    
    def recuperaColunasEmpresa(self):
        df_colunas   = self.db_business.buscaColunasEmpresa(self.empresa, self.import_type)
        COLS_DEFAULT = list(df_colunas['name'].unique())
        self.colunas_empresa = COLS_DEFAULT
        
        
    def ajusta_nomes_colunas(self):
        dict_rename = {}
        for col in self.colunas:
            dict_rename[col.get('coluna')] = col.get('slug_db')
        dict_rename['e-mail'] = 'email'    
        self.df  = self.df.rename(columns=dict_rename)
        low_cols = [x.lower() for x in self.df.columns ]
        self.df.columns = low_cols 
    

        
    def merge_database(self):
        pessoas_buscar = self.df['cpf'].unique()
        
        if len(pessoas_buscar) == 1:
            pessoas_buscar = f"('{pessoas_buscar[0]}')"
        else:
            pessoas_buscar = tuple(pessoas_buscar)
        
        df_banco = self.db_business.buscaPessoasEmpresa(pessoas_buscar, self.empresa)
    
        self.total_atualizar = df_banco.shape[0]
        if self.total_atualizar > 0:
            self.df = pd.concat([df_banco, self.df])
        
        dict_how_merge = {'custom_fields': self.merge_json}
        for col in self.colunas_default:
            if col != 'cpf':
                dict_how_merge[col] = 'last'
                
            if not col in self.df.columns:
                self.df[col] = None
        
        df_filled = self.df.groupby('cpf', as_index=False).apply(lambda group: group.ffill().bfill()).reset_index(drop=True)
        df_final  = df_filled.groupby('cpf', as_index=False).agg(dict_how_merge)        
        self.df   = df_final
    
    
    
    def busca_telefone_inserir(self, df_tel):
        df_tel = df_tel.drop_duplicates(subset='telefone')
        df_tel['telefone'] = df_tel['telefone'].astype(str).str.replace('.0', '')
        telefones_buscar = df_tel['telefone'].unique()
        if len(telefones_buscar) == 1:
            telefones_buscar = f"('{telefones_buscar[0]}')"
        else:
            telefones_buscar = tuple(telefones_buscar)
        
        df_tels_banco = self.db_business.buscaTelefonesPessoas(telefones_buscar, self.empresa)
        df_tels_banco['telefone'] = df_tels_banco['telefone'].astype(str).str.replace('.0', '')

        if df_tels_banco.shape[0] > 0:
            df_tel = df_tel[~df_tel['telefone'].isin(df_tels_banco['telefone'])]
        return df_tel
    
    
    def busca_email_inserir(self, df_email):
        df_email = df_email.drop_duplicates(subset='email')
        emails_buscar = df_email['email'].unique()
        if len(emails_buscar) == 1:
            emails_buscar = f"('{emails_buscar[0]}')"
        else:
            emails_buscar = tuple(emails_buscar)
            
        df_emails_banco = self.db_business.buscaEmailsPessoas(emails_buscar, self.empresa)
        if df_emails_banco.shape[0] > 0:
            df_email = df_email[~df_email['email'].isin(df_emails_banco['email'])]
        return df_email
        
    
    def inserir_telefones(self, df_tel):  
        dtype = {
            'cpf'       : sqlalchemy.VARCHAR(15),
            'telefone'  : sqlalchemy.VARCHAR(30),
            'empresa_id': sqlalchemy.Integer
        }    
        conn = self.db_business.conecta_db()
        df_tel['telefone'] = df_tel['telefone'].astype(str).str.replace('.0','')
        df_tel.to_sql(
                        'business_telefones',
                        conn,
                        if_exists='append',
                        index=False,
                        chunksize=500,
                        dtype=dtype
                    )
        
        
    def inserir_emails(self, df_email):  
        dtype = {
            'cpf'       : sqlalchemy.VARCHAR(15),
            'email'     : sqlalchemy.VARCHAR(250),
            'empresa_id': sqlalchemy.Integer
        }    
        conn = self.db_business.conecta_db()
        df_email.to_sql(
                        'business_emails',
                        conn,
                        if_exists='append',
                        index=False,
                        chunksize=500,
                        dtype=dtype
                    )
        
        
    
    def update_database(self):  
        dtype = {
            'cpf'                         : sqlalchemy.VARCHAR(15),
            'nome'                        : sqlalchemy.VARCHAR(250),
            'data_nascimento'             : sqlalchemy.DateTime,
            'estado_civil'                : sqlalchemy.VARCHAR(10),
            'uf'                          : sqlalchemy.VARCHAR(2),
            'nome_pai'                    : sqlalchemy.VARCHAR(250),
            'nome_mae'                    : sqlalchemy.VARCHAR(250),
            'sexo'                        : sqlalchemy.VARCHAR(2),
            'endereco'                    : sqlalchemy.VARCHAR(250),
            'custom_fields'               : sqlalchemy.JSON
        }
        
        INSERT_COLUMNS = ['custom_fields', 'empresa_id']
        for column in self.colunas_default:
            INSERT_COLUMNS.append(column)
            if column not in self.df.columns:
                self.df[column] = None    
                
        self.df['empresa_id']  = self.empresa
        self.df['carteira_id'] = self.carteira
        self.df['import_name'] = self.import_name
        self.df['nome']        = self.df['nome'].apply(self.corrigir_encoding_quebrado)

        
        pessoas_buscar = self.df['cpf'].unique()
        if len(pessoas_buscar) == 1:
            pessoas_buscar = f"('{pessoas_buscar[0]}')"
        else:
            pessoas_buscar = tuple(pessoas_buscar)
              
        self.db_business.deletaPessoas(pessoas_buscar, self.empresa)
        conn = self.db_business.conecta_db()
        self.df[INSERT_COLUMNS].to_sql(
                        'business_pessoas',
                        conn,
                        if_exists='append',
                        index=False,
                        chunksize=500,
                        dtype=dtype
                    )
     
    def convert_timestamp(self, value):
        if isinstance(value, pd.Timestamp):
            return value.isoformat() 
        return value

 
    def selecionaColunas(self):
        colunas_utilizar = [col.get('slug_db') for col in self.colunas]      
        if 'cpf' not in colunas_utilizar:
            colunas_utilizar.append('cpf')

        self.df = self.df[colunas_utilizar]
        columns        = []
        colunas_extras = []
        for column in colunas_utilizar:
            columns.append(column)
            self.df[column] = self.df[column].apply(retornaNulos)
            if column not in self.colunas_default:
                colunas_extras.append(column)
                if column not in self.colunas_empresa:
                    self.colunas_criar.append(column)
        
        print(self.df.columns)
        print(columns)
        self.df.columns = columns
        
        self.df["custom_fields"] = self.df[colunas_extras].apply(
            lambda row: json.dumps(row.dropna().apply(self.convert_timestamp).to_dict(), ensure_ascii=False), axis=1
        )
        self.df = self.df.drop(columns=colunas_extras)
        self.df['empresa_id'] = self.empresa
    
               
    
    def validar(self):
        self.recuperaColunasDefault()
        self.recuperaColunasEmpresa()
        
        try:
            if self.filename.endswith('.csv'):
                try:
                    data = pd.read_csv(self.filename)
                except:
                    data = pd.DataFrame()
            elif self.filename.endswith('.xls') or self.filename.endswith('.xlsx'):
                try:
                    data = pd.read_excel(self.filename)
                except:
                    data = pd.DataFrame()
            elif self.filename.endswith('.txt'):
                try:
                    data = pd.read_csv(self.filename, delimiter="\t")
                except:
                    data = pd.DataFrame()
                     
            self.df = data   
            self.ajusta_nomes_colunas()
            
            #VALIDAÇÃO    
            self.validar_colunas_obrigatorias()
            if self.erros:
                return {'success': False, 'total': self.qtd_registros, 'qtd_erros': len(self.erros), 'list_erros': self.erros }, []
            
            self.validar_cpf_vazio()
            if self.erros:
                return {'success': False, 'total': self.qtd_registros, 'qtd_erros': len(self.erros), 'list_erros': self.erros }, []
            
            self.df['cpf'] = self.df['cpf'].apply(normaliza_cpf)        
            self.validar_cpf_invalido()
            if self.erros:
                return {'success': False, 'total': self.qtd_registros, 'qtd_erros': len(self.erros), 'list_erros': self.erros }, []
            #################
            
            
            self.selecionaColunas()
            self.qtd_registros = self.df.shape[0]
            self.merge_database()
            self.update_database()
            self.qtd_registros = self.df.shape[0] - self.total_atualizar                
            
        except Exception as e:
            print(e)
            return {"error": f"Erro ao processar as etapas da importação: {str(e)}"}, []
        
        
        try:
            #TELEFONES
            if self.df['telefone'].isnull().sum() < self.df.shape[0]:
                df_telefones = self.df.dropna(subset='telefone')
                df_telefones = self.busca_telefone_inserir(df_telefones)
                if df_telefones.shape[0] > 0:
                    self.inserir_telefones(df_telefones[['cpf', 'telefone', 'empresa_id']])
        except Exception as e:
            print(e)
                
        try:    
            #EMAILS
            if self.df['email'].isnull().sum() < self.df.shape[0]:
                df_emails = self.df.dropna(subset='email')
                df_emails = self.busca_email_inserir(df_emails)
                if df_emails.shape[0] > 0:
                    self.inserir_emails(df_emails[['cpf', 'email', 'empresa_id']])
        except Exception as e:
            print(e)
                
        if not self.erros:
            return {'success': True, 'total': self.qtd_registros, 'total_atualizar': self.total_atualizar}, self.colunas_criar
        return {'success': False, 'total': self.qtd_registros, 'qtd_erros': len(self.erros), 'list_erros': self.erros }, []