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



class ValidadorContratos:
    
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
            
            
    def validar_numero_contrato_vazio(self):
        if self.df["contrato"].isnull().sum() > 0:
            self.erros.append("Existe(m) Número(s) de Contrato(s) vazio(s).")
            
            
    def validar_saldo_a_pagar_vazio(self):
        if self.df["saldo_a_pagar"].isnull().sum() > 0:
            self.erros.append("Existe(m) Saldo(s) a Pagar vazio(s).")
              

    def validar_cpf_invalido(self):
        invalidos = self.df[~self.df["cpf"].astype(str).apply(self.cpf_validator.validate)]
        if not invalidos.empty:
            self.erros.append(f"Existe(m) {len(invalidos)} CPF(s) inválido(s).") 

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
        
    
    def merge_database(self):
        contratos_buscar = self.df['contrato'].astype(str).unique()
        
        if len(contratos_buscar) == 1:
            contratos_buscar = f"('{contratos_buscar[0]}')"
        else:
            contratos_buscar = tuple(contratos_buscar)
        
        df_banco = self.db_business.buscaContratoEmpresa(contratos_buscar, self.empresa)
    
        self.total_atualizar = df_banco.shape[0]
        if self.total_atualizar > 0:
            self.df = pd.concat([df_banco, self.df])
        
        dict_how_merge = {'custom_fields': self.merge_json}
        for col in self.colunas_default:
            if col != 'contrato':
                dict_how_merge[col] = 'last'
                
            if not col in self.df.columns:
                self.df[col] = None
        
        df_filled = self.df.groupby('contrato', as_index=False).apply(lambda group: group.ffill().bfill()).reset_index(drop=True)
        df_final  = df_filled.groupby('contrato', as_index=False).agg(dict_how_merge)        
        self.df   = df_final
    
    
    def update_database(self):  
        dtype = {
            'cpf'                         : sqlalchemy.VARCHAR(15),
            'contrato'                    : sqlalchemy.VARCHAR(50),
            'saldo_a_pagar'               : sqlalchemy.Float,
            'custom_fields'               : sqlalchemy.JSON
        }
        
        INSERT_COLUMNS = ['custom_fields', 'empresa_id']
        for column in self.colunas_default:
            INSERT_COLUMNS.append(column)
            if column not in self.df.columns:
                self.df[column] = None    
                
        self.df['empresa_id'] = self.empresa   
        
        contratos_buscar = self.df['contrato'].astype(str).unique()
        if len(contratos_buscar) == 1:
            contratos_buscar = f"('{contratos_buscar[0]}')"
        else:
            contratos_buscar = tuple(contratos_buscar)
              
        self.db_business.deletaContratos(contratos_buscar, self.empresa)
        conn = self.db_business.conecta_db()
        self.df[INSERT_COLUMNS].to_sql(
                        'business_contratos',
                        conn,
                        if_exists='append',
                        index=False,
                        chunksize=500,
                        dtype=dtype
                    )
        
    def ajusta_nomes_colunas(self):
        dict_rename = {}
        for col in self.colunas:
            dict_rename[col.get('coluna')] = col.get('name')        
        self.df  = self.df.rename(columns=dict_rename)
        low_cols = [x.lower() for x in self.df.columns ]
        self.df.columns = low_cols 
        print(self.df)
        
    
    def selecionaColunas(self):
        colunas_utilizar = [col.get('coluna') for col in self.colunas]
        
        if 'contrato' not in colunas_utilizar:
            colunas_utilizar.append('contrato')
        self.df = self.df[colunas_utilizar]

        columns        = []
        colunas_extras = []
        for column in colunas_utilizar:
            column = column.lower()
            columns.append(column)
            self.df[column] = self.df[column].apply(retornaNulos)
            if column not in self.colunas_default:
                colunas_extras.append(column)
                if column not in self.colunas_empresa:
                    self.colunas_criar.append(column)
        
        self.df.columns = columns
        
        self.df["custom_fields"] = self.df[colunas_extras].apply(
            lambda row: json.dumps(row.dropna().to_dict(), ensure_ascii=False), axis=1
        )
        self.df = self.df.drop(columns=colunas_extras)
        self.df['empresa_id']  = self.empresa
        self.df['carteira_id'] = self.carteira
        self.df['import_name'] = self.import_name
    

    
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
            
            self.validar_numero_contrato_vazio()
            if self.erros:
                return {'success': False, 'total': self.qtd_registros, 'qtd_erros': len(self.erros), 'list_erros': self.erros }, []
            
            self.validar_saldo_a_pagar_vazio()
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
            return {"error": f"Erro ao processar as etapas da importação: {str(e)}"}, []
        
        
        if not self.erros:
            return {'success': True, 'total': self.qtd_registros, 'total_atualizar': self.total_atualizar}, self.colunas_criar
        return {'success': False, 'total': self.qtd_registros, 'qtd_erros': len(self.erros), 'list_erros': self.erros }, []
    