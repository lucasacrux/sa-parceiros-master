import pandas as pd
import re
from datetime import datetime
from validate_docbr import CPF 
import os
import mysql

class ValidadorCadastro:
    
    def __init__(self, df):
        self.df = df
        self.erros = []
        self.existente = False
        self.cpf_validator = CPF()
        self.host       = os.environ.get('HOST')
        self.database   = os.environ.get('DEFAULT_NAME')
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
    
    def cpf_check(self, cpf):
        try:
            conn = self.conecta_db()
            cursor = conn.cursor()
            QUERY = f"SELECT * FROM terceirizada_pessoas tp WHERE tp.cpf = {cpf}"
            cursor.execute(QUERY)
            resultado       = cursor.fetchall()
            print(resultado)                
            if resultado != []: 
                self.existente = True               

        except Exception as e:
            print(f'O erro foi {e}')
            return e

    def validar_cpf_vazio(self):
        if self.df["cpf"].isnull().sum() > 0:
            self.erros.append("Existe(m) CPF(s) vazio(s).")

    def validar_nome_vazio(self):
        if self.df["nome"].isnull().sum() > 0:
            self.erros.append("Existe(m) nome(s) vazio(s).")

    def validar_cpf_invalido(self):
        invalidos = self.df[~self.df["cpf"].astype(str).apply(self.cpf_validator.validate)]
        if not invalidos.empty:
            self.erros.append(f"Existe(m) {len(invalidos)} CPF(s) inválido(s).")


    def validar_cpf_nomes_diferentes(self):
        inconsistencias = self.df.groupby("cpf")["nome"].nunique()
        erros = inconsistencias[inconsistencias > 1]
        if not erros.empty:
            self.erros.append(f"CPF(s) associados a mais de um nome: {len(erros)} caso(s).")


    def validar(self):
        self.validar_cpf_vazio()
        self.validar_cpf_invalido()
        self.validar_nome_vazio()
        if self.existente:
            self.validar_cpf_nomes_diferentes()
        
        if not self.erros:
            return "Arquivo válido."
        return f"Arquivo inválido. {len(self.erros)} erros encontrados:\n" + "\n".join(self.erros)


# df = pd.read_excel("cadastro.xlsx") 
# validador = ValidadorCadastro(df)
# resultado = validador.validar()
# print(resultado)
