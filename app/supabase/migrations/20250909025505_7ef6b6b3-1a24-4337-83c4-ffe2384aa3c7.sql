-- Inserir dados do cliente Eduardo Carceroni baseado no JSON fornecido
INSERT INTO public.consumers (
  id,
  tenant_id,
  cpf,
  name,
  email,
  phone,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  t.id,
  '14743797888',
  'Eduardo Carceroni',
  'carceroni@me.com',
  '+5561994299973',
  now(),
  now()
FROM public.tenants t 
WHERE t.slug = 'acrux'
AND NOT EXISTS (
  SELECT 1 FROM public.consumers c 
  WHERE c.cpf = '14743797888' AND c.tenant_id = t.id
);

-- Inserir o contrato baseado no JSON
INSERT INTO public.contracts (
  id,
  tenant_id,
  consumer_id,
  number,
  original_value,
  current_value,
  status,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  t.id,
  c.id,
  '11862281',
  16165.51,
  43639.25,
  'active',
  '2020-10-28'::date,
  now()
FROM public.tenants t
CROSS JOIN public.consumers c
WHERE t.slug = 'acrux' 
  AND c.cpf = '14743797888' 
  AND c.tenant_id = t.id
  AND NOT EXISTS (
    SELECT 1 FROM public.contracts ct 
    WHERE ct.number = '11862281' AND ct.tenant_id = t.id
  );

-- Inserir a dívida baseada no contrato
INSERT INTO public.debts (
  id,
  tenant_id,
  contract_id,
  amount,
  due_date,
  status,
  meta,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  t.id,
  ct.id,
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
    'parcelas_contrato', 36,
    'parcelas_pagas', 2,
    'parcelas_nao_pagas', 34,
    'taxa_financeira', 0.0751,
    'valor_parcela_original', 1444.13,
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
    'acordo_info', jsonb_build_object(
      'acordo_id', 25426,
      'data_criacao', '2025-06-24',
      'status', 'ATIVO',
      'valor_total', 12000.0,
      'parcelas_acordo', 1,
      'forma_pagamento', 'avista',
      'percentual_amortizado', 100.0,
      'closer_nome', 'Brendon de Souza do Nascimento',
      'closer_telefone', '(21) 99021-2866',
      'parcela_detalhes', jsonb_build_object(
        'numero_parcela', '1',
        'valor', 12000.0,
        'data_vencimento', '2025-06-24',
        'data_pagamento', '2025-06-24',
        'situacao', 'LIQUIDADO',
        'identificador_boleto', '00034852651678154731',
        'linha_digitavel', '00190000090348526516378154731174111220001200000',
        'codigo_barras', '00191112200012000000000003485265167815473117',
        'plataforma_pagamento', 'Banco do Brasil',
        'data_limite_pagamento', '2025-07-09'
      )
    ),
    'contato_info', jsonb_build_object(
      'telefones', jsonb_build_array(
        jsonb_build_object(
          'numero', '61999886980',
          'origem', 'carteira',
          'whatsapp', true,
          'principal', true
        ),
        jsonb_build_object(
          'numero', '556194299973',
          'origem', 'msgs_seller_32',
          'whatsapp', true,
          'sucesso', true
        )
      ),
      'email_principal', 'carceroni@me.com',
      'canal_preferido', 'WHATSAPP',
      'ultimo_contato', '2025-08-27'
    )
  ),
  now(),
  now()
FROM public.tenants t
CROSS JOIN public.contracts ct
WHERE t.slug = 'acrux' 
  AND ct.number = '11862281' 
  AND ct.tenant_id = t.id
  AND NOT EXISTS (
    SELECT 1 FROM public.debts d 
    WHERE d.contract_id = ct.id
  );