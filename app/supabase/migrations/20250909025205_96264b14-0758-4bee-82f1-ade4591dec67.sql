-- Adicionar constraints únicos necessários para ON CONFLICT
ALTER TABLE public.consumers 
ADD CONSTRAINT consumers_cpf_tenant_unique 
UNIQUE (cpf, tenant_id);

ALTER TABLE public.contracts 
ADD CONSTRAINT contracts_number_tenant_unique 
UNIQUE (number, tenant_id);

-- Inserir dados do cliente Eduardo Carceroni baseado no JSON fornecido
INSERT INTO public.consumers (
  tenant_id,
  cpf,
  name,
  email,
  phone
) VALUES (
  (SELECT id FROM public.tenants WHERE slug = 'acrux' LIMIT 1),
  '14743797888',
  'Eduardo Carceroni',
  'carceroni@me.com',
  '+5561994299973'
) ON CONFLICT (cpf, tenant_id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  updated_at = now();

-- Inserir o contrato baseado no JSON
INSERT INTO public.contracts (
  tenant_id,
  consumer_id,
  number,
  original_value,
  current_value,
  status,
  created_at
) VALUES (
  (SELECT id FROM public.tenants WHERE slug = 'acrux' LIMIT 1),
  (SELECT id FROM public.consumers WHERE cpf = '14743797888' AND tenant_id = (SELECT id FROM public.tenants WHERE slug = 'acrux' LIMIT 1)),
  '11862281',
  16165.51,
  43639.25,
  'active',
  '2020-10-28'::timestamp
) ON CONFLICT (number, tenant_id) DO UPDATE SET
  original_value = EXCLUDED.original_value,
  current_value = EXCLUDED.current_value,
  status = EXCLUDED.status,
  updated_at = now();

-- Inserir a dívida baseada no contrato
INSERT INTO public.debts (
  tenant_id,
  contract_id,
  amount,
  due_date,
  status,
  meta
) VALUES (
  (SELECT id FROM public.tenants WHERE slug = 'acrux' LIMIT 1),
  (SELECT id FROM public.contracts WHERE number = '11862281' AND tenant_id = (SELECT id FROM public.tenants WHERE slug = 'acrux' LIMIT 1)),
  43639.25,
  '2023-10-20'::date,
  'pending',
  jsonb_build_object(
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
      )
    ),
    'contato_info', jsonb_build_object(
      'telefones', jsonb_build_array('61999886980', '556194299973'),
      'email_principal', 'carceroni@me.com',
      'canal_preferido', 'WHATSAPP'
    )
  )
) ON CONFLICT (contract_id) DO UPDATE SET
  amount = EXCLUDED.amount,
  due_date = EXCLUDED.due_date,
  status = EXCLUDED.status,
  meta = EXCLUDED.meta,
  updated_at = now();