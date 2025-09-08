import requests
import datetime

HEADERS = {
        "accept": "application/json",
        "Authorization": "Bearer 5|uDqGUTkaBDdEsEvzWDWEUi97OkBkpvmSEBqzVCTN"
    }


def criar_acordo(dict_acordo):
    cpf         = dict_acordo['cpf']
    contrato    = dict_acordo['contrato_id']
    desconto_id = dict_acordo['discount']
    email       = dict_acordo['email']
    telefone    = dict_acordo['phone']
    
    URL_RESOLVE_CONTAS = 'https://www.resolvecontas.com.br'
    URL_ACORDO_CRIAR   = URL_RESOLVE_CONTAS + f'/api/1.0/acordoeasy/acordo/{cpf}/create'
    payload = {
        "contrato_id": contrato,
        "discount"   : desconto_id,
        "email"      : email,
        "telefone"   : telefone
    }
    response = requests.post(URL_ACORDO_CRIAR, json=payload, headers=HEADERS) 
    return response



def aceitar_acordo(dict_acordo):
    cpf         = dict_acordo['cpf']
    acordo_id   = dict_acordo['acordo_id']
    dueDate     = datetime.date.today().strftime("%Y-%m-%d") 
    
    URL_RESOLVE_CONTAS = 'https://www.resolvecontas.com.br'
    URL_ACORDO_CRIAR   = URL_RESOLVE_CONTAS + f'/api/1.0/acordoeasy/acordo/{cpf}/accept'
    payload = {
        'agreementId': acordo_id,
        'dueDate'    : dueDate
    }
    response = requests.post(URL_ACORDO_CRIAR, json=payload, headers=HEADERS) 
    return response
    
    
    
    

    
        # $customer = Auth::user();
        # $createAgreementRequest = new CreateAgreementRequest();
        # $createAgreementRequest->contractId=$request->input('contrato_id');
        # $createAgreementRequest->discountId=$request->input('discount');
        # $createAgreementRequest->email=$customer->email;
        # $createAgreementRequest->telefone=$customer->phone;
        # $createAgreementRequest->cpfcnpj=$customer->document;
        # $agreement = $this->agreementRepository->createAgreement($createAgreementRequest);
        # return new JsonResponse($agreement, 201);
        
        #     $response = Http::resolvecontas()->post(
        #     "/api/1.0/acordoeasy/acordo/{$agreementData->cpfcnpj}/create",
        #     [
        #         "contrato_id" => $agreementData->contractId,
        #         "discount" => $agreementData->discountId,
        #         "email" => $agreementData->email,
        #         "telefone" => $agreementData->telefone
        #     ]
        # );

        # $response->throw();
        # if ($response->status() != 200 && $response->status() != 201) {
        #     throw new Exception("Ocorreu um erro inesperado");
        # }

        # $data = $response->object();
        # return $data;
        
        
        ## Aceitar Acordo
        # {
        #     $customer = Auth::user();
        #     $agreementId = $request->input('agreementId');
        #     $dueDate = $request->input('dueDate');
        #     $agreement = $this->agreementRepository->acceptAgreement($agreementId, $dueDate);
        #     return new AgreementResource($agreement);
        # }
        
        #         $customer = Auth::user();
        # $response = Http::resolvecontas()->post(
        #     "/api/1.0/acordoeasy/acordo/{$customer->document}/accept",
        #     [
        #         'agreementId' => $agreementId,
        #         'dueDate' => $dueDate
        #     ]
        # );
    
    pass


def emite_parcelas():
    pass
   
def criar_cobranca(parcela_id, cpf):
    URL_RESOLVE_CONTAS = 'https://www.resolvecontas.com.br'
    URL_ACORDO_ACEITAR = URL_RESOLVE_CONTAS + f'/api/1.0/acordoeasy/cobranca/{cpf}/create'
    payload = {
        'parcela_id': parcela_id
    }
    response = requests.post(URL_ACORDO_ACEITAR, json=payload, headers=HEADERS) 
    return response
    