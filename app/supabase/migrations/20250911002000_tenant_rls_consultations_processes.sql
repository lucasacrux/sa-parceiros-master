-- Add tenant scoping and RLS for consultations and processes

-- Ensure consultations has tenant_id and supporting columns
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'consultations' and column_name = 'tenant_id'
  ) then
    alter table public.consultations add column tenant_id uuid;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'consultations' and column_name = 'document_type'
  ) then
    alter table public.consultations add column document_type text check (document_type in ('CPF','CNPJ'));
  end if;
end $$;

-- Backfill tenant_id from wallets if possible
update public.consultations c
set tenant_id = w.tenant_id
from public.wallets w
where c.wallet_id = w.id and c.tenant_id is null;

-- Make tenant_id not null if table not empty and all rows filled
do $$
declare v_missing int;
begin
  select count(*) into v_missing from public.consultations where tenant_id is null;
  if v_missing = 0 then
    alter table public.consultations alter column tenant_id set not null;
  end if;
exception when undefined_table then null; end $$;

-- Processes table: add tenant_id
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'processes' and column_name = 'tenant_id'
  ) then
    alter table public.processes add column tenant_id uuid;
  end if;
end $$;

-- Optional: infer tenant from linked consultation
update public.processes p
set tenant_id = c.tenant_id
from public.consultations c
where p.consultation_id = c.id and p.tenant_id is null;

-- Enable RLS (already enabled for processes in its migration; ensure consultations too)
alter table if exists public.consultations enable row level security;

-- RLS: only allow access to rows within user's tenants using existing user_roles
create policy if not exists "tenant_select_consultations" on public.consultations
  for select using (
    exists (
      select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.tenant_id = consultations.tenant_id
    )
  );

create policy if not exists "tenant_crud_consultations" on public.consultations
  for all using (
    exists (
      select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.tenant_id = consultations.tenant_id
    )
  ) with check (
    exists (
      select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.tenant_id = consultations.tenant_id
    )
  );

create policy if not exists "tenant_select_processes" on public.processes
  for select using (
    exists (
      select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.tenant_id = processes.tenant_id
    )
  );

create policy if not exists "tenant_crud_processes" on public.processes
  for all using (
    exists (
      select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.tenant_id = processes.tenant_id
    )
  ) with check (
    exists (
      select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.tenant_id = processes.tenant_id
    )
  );

-- Indexes for performance
create index if not exists idx_consultations_tenant_document on public.consultations(tenant_id, document);
create index if not exists idx_consultations_tenant_dataset on public.consultations(tenant_id, dataset);
create index if not exists idx_processes_tenant_publish on public.processes(tenant_id, publish_date);
create index if not exists idx_processes_tenant_dataset on public.processes(tenant_id, dataset);
