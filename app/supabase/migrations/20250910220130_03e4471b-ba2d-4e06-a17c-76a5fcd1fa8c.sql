create table wallets (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text check (type in ('CPF','CNPJ')),
  tenant_id uuid references tenants(id),
  created_at timestamptz default now()
);

create table wallet_clients (
  id uuid primary key default uuid_generate_v4(),
  wallet_id uuid references wallets(id) on delete cascade,
  document text not null,
  created_at timestamptz default now()
);
