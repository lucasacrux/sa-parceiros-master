-- Settings table for provider credentials (stored via backend service key)
create table if not exists public.integration_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  token_id text,
  access_token text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.integration_settings enable row level security;
