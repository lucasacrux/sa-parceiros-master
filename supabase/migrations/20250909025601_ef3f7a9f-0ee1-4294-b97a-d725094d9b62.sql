-- Atualizar dados do cliente Eduardo Carceroni com informações do JSON
UPDATE public.consumers 
SET 
  name = 'Eduardo Carceroni',
  email = 'carceroni@me.com',
  phone = '+5561994299973',
  updated_at = now()
WHERE cpf = '14743797888' 
  AND tenant_id = (SELECT id FROM public.tenants WHERE slug = 'acrux' LIMIT 1);

-- Atualizar o contrato baseado no JSON
UPDATE public.contracts 
SET 
  original_value = 16165.51,
  current_value = 43639.25,
  status = 'active',
  updated_at = now()
WHERE number = '11862281' 
  AND tenant_id = (SELECT id FROM public.tenants WHERE slug = 'acrux' LIMIT 1);

-- Atualizar a dívida baseada no contrato
UPDATE public.debts 
SET 
  amount = 43639.25,
  due_date = '2023-10-20'::date,
  status = 'pending',
  meta = jsonb_build_object(
    'credor', 'Open Co/Rebel',
    'carteira', 'Open Co/Rebel', 
    'origem', 'Empréstimo pessoal',
    'risco_ajuizamento', 'médio',
    'ajuizado_polo_ativo', true,
    'data_prescricao', '2028-10-20',
    'endereco', jsonb_build_object(
      'logradouro', 'Condomínio Residencial Mansões Itaipu',
      'numero', '74',
      'bairro', 'Setor Habitacional Jardim Botânico',
      'cidade', 'BRASILIA',
      'uf', 'DF',
      'cep', '71680373'
    ),
    'dados_cliente', jsonb_build_object(
      'data_nascimento', '1973-04-13',
      'sexo', 'M',
      'nome_mae', 'Sonia Regina Silva Carceroni',
      'estado_civil', 'Civil_uniao',
      'uf_nascimento', 'DF'
    ),
    'acordo_info', jsonb_build_object(
      'acordo_id', 25426,
      'data_criacao', '2025-06-24',
      'status', 'ATIVO',
      'valor_total', 12000.0,
      'parcelas_acordo', 1,
      'forma_pagamento', 'avista',
      'percentual_amortizado', 100.0,
      'closer_nome', 'Brendon de Souza do Nascimento',
      'closer_telefone', '(21) 99021-2866'
    ),
    'ofertas_desconto', jsonb_build_array(
      jsonb_build_object(
        'tipo', 'à vista',
        'nome', '20% à vista',
        'valor', 34911.4,
        'desconto_pct', 20.0,
        'parcelas', 1
      ),
      jsonb_build_object(
        'tipo', 'parcelado',
        'nome', '15% parcelado',
        'valor', 37093.36,
        'desconto_pct', 15.0,
        'parcelas', 12,
        'valor_parcela', 3091.11
      ),
      jsonb_build_object(
        'tipo', 'parcelado',
        'nome', '10% parcelado',
        'valor', 39275.32,
        'desconto_pct', 10.0,
        'parcelas', 24,
        'valor_parcela', 1636.47
      )
    ),
    'contato_info', jsonb_build_object(
      'telefones', jsonb_build_array('61999886980', '556194299973'),
      'email_principal', 'carceroni@me.com',
      'canal_preferido', 'WHATSAPP'
    )
  ),
  updated_at = now()
WHERE contract_id = (
  SELECT id FROM public.contracts 
  WHERE number = '11862281' 
    AND tenant_id = (SELECT id FROM public.tenants WHERE slug = 'acrux' LIMIT 1)
);