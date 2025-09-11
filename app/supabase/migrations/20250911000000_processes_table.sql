-- Structured table to hold flattened process records from BigDataCorp
create table if not exists public.processes (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid references public.consultations(id) on delete set null,
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
