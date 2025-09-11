-- Structured table to hold flattened process records from BigDataCorp
-- Structured table to hold flattened process records from BigDataCorp
create table if not exists public.processes (
  id uuid primary key default gen_random_uuid(),
  -- FK to consultations is added conditionally later to avoid dependency errors
  consultation_id uuid,
  document text not null,
  dataset text not null,
  process_id text,
  publish_date timestamptz,
  capture_date timestamptz,
  title text,
  content text,
  court text,
  source text,
  url text,
  extra jsonb,
  created_at timestamptz default now()
);

alter table public.processes enable row level security;

-- Add FK to consultations only if the table exists
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'consultations'
  ) then
    -- ensure column exists without FK first
    alter table public.processes
      add constraint processes_consultation_id_fkey
      foreign key (consultation_id)
      references public.consultations(id)
      on delete set null;
  end if;
end $$;
