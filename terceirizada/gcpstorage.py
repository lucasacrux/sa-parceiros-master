from google.cloud import storage
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import mysql.connector
import datetime
from dotenv import load_dotenv
import os


# PATH_CREDENTIAL = "/var/www/html/data-hub-portal/scripts/mythical-runner-350501-79f85db1d3dd.json"
#PATH_CREDENTIAL = "./mythical-runner-350501-79f85db1d3dd.json"
PATH = os.environ.get('ROOTPATH')
#PATH = '' 

class StorageGCP:
    
    def __init__(self):
        self.bucket_name = "resolve-contas-docs" #
        self.credentials = PATH + 'mythical-runner-350501-79f85db1d3dd.json'
        self.client = storage.Client()  # usa GOOGLE_APPLICATION_CREDENTIALS
        self.bucket      = self.client.bucket(self.bucket_name)
    
    
    def list(self, prefix):
        blobs_list = []
        blobs = self.client.list_blobs(self.bucket_name, prefix=prefix, delimiter='/')
        for blob in blobs:
            blobs_list.append(blob.name)
        return blobs_list
    
    
    def upload(self, source, destination):
        blob = self.bucket.blob(destination)
        blob.upload_from_filename(source)
        print(f"File {source} uploaded to gs://{self.bucket_name}/{destination}")
    
        
    def download(self, source, destination):
        blob = self.bucket.blob(source)
        blob.download_to_filename(destination)
        print(f"File gs://{self.bucket_name}/{source} downloaded to {destination}")
    
    
    def check(self, source): #Verifica a existencia do 'SOURCE'
        blob = self.bucket.blob(source)
        result = blob.exists()
        return result
    
    def generate_url(self, source): #Gera a URL para abrir o source na web
        blob = self.bucket.blob(source)
        url = blob.generate_signed_url(2538065454) #Duração de 5 anos, talvez seja bom diminuir essa duração
        return url
    
class SheetsGCP:

    def __init__(self):
        self.credentials    = PATH + 'mythical-runner-350501-79f85db1d3dd.json'
        self.cred           = ServiceAccountCredentials.from_json_keyfile_name(self.credentials)
        self.client         = gspread.authorize(self.cred)

    def sheet_update(self, url, content):#Só colocar a URL da planilha e uma lista de conteudo a ser inserido
        sheet       = self.client.open_by_url(url).sheet1
        for x in range(2, 41):
            vaiza   = sheet.row_values(x)
            if vaiza != []:
                continue
            else:
                range_cell      = sheet.range(f'A{x}:D{x}')
                for cell, value in zip(range_cell, content):
                    cell.value  = value
                sheet.update_cells(range_cell)
                break
        return 'Contrato solicitado'


class DbCON:

    def __init__(self):
        self.host_db  = os.environ.get('HOST')
        self.db       = os.environ.get('LARAVEL_NAME')
        self.user_db  = os.environ.get('LARAVEL_USER')
        self.senha_db = os.environ.get('LARAVEL_PASS')

    def consulta_db(self, contrato):
        try:
            conector        = mysql.connector.connect(
                host        = self.host_db,
                database    = self.db,
                password    = self.senha_db,
                user        = self.user_db,
            )
        except:
            print('falha de conexão no banco')
        
        cursor  = conector.cursor()
        query   = f"""
                        SELECT d.nome, d.cpfCnpj, c.contrato_orig  from devedor d 
                                inner join contrato c on d.id = c.devedor_id 
                                WHERE c.contrato = {contrato}
            """#Precisa ser o c.contrago_orig pois tem contratos que são diferentes
        cursor.execute(query)
        dev_info        = cursor.fetchall()
        nome_dev        = dev_info[0][0]
        cpf_dev         = dev_info[0][1]
        contrato_dev    = dev_info[0][2]
        data_atual      = datetime.date.strftime(datetime.date.today(), '%d/%m/%Y')
        infos_contrato = [data_atual, nome_dev, cpf_dev, contrato_dev]
        return infos_contrato

            


        