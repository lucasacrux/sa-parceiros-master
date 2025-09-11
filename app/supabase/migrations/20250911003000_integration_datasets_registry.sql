-- Registry of external datasets for dynamic integration
create table if not exists public.integration_datasets (
  id uuid primary key default gen_random_uuid(),
  key text unique not null, -- e.g., 'processes', 'registration_data', 'addresses_extended'
  display_name text not null,
  url_template text not null, -- may contain placeholders like {{document}}
  method text default 'GET' check (method in ('GET','POST')),
  headers jsonb default '{}'::jsonb,
  body_template text, -- optional template for POST bodies
  enabled boolean default true,
  doc_type text default 'CNPJ' check (doc_type in ('CPF','CNPJ','BOTH')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_integration_datasets_key on public.integration_datasets(key);

-- Seed common BigDataCorp CNPJ datasets (editable later via UI)
insert into public.integration_datasets (key, display_name, url_template, doc_type)
values
  ('processes','Processos Judiciais e Administrativos','https://api.bigdata.example/processes?cnpj={{document}}','CNPJ'),
  ('registration_data','Dados Cadastrais','https://api.bigdata.example/registration?cnpj={{document}}','CNPJ'),
  ('addresses_extended','Endereços - Estendidos','https://api.bigdata.example/addresses/extended?cnpj={{document}}','CNPJ')
on conflict (key) do nothing;
