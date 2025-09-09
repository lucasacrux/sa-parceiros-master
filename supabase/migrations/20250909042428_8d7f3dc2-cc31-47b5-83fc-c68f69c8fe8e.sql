-- 1) Ensure CPF is globally unique across the entire system (not per-tenant)
-- Deduplicate existing persons by CPF before adding unique constraint
WITH duplicates AS (
  SELECT cpf, MIN(id) AS keep_id
  FROM public.persons
  GROUP BY cpf
  HAVING COUNT(*) > 1
)
DELETE FROM public.persons p
USING duplicates d
WHERE p.cpf = d.cpf
  AND p.id <> d.keep_id;

-- Drop old per-tenant unique constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'persons_tenant_cpf_unique'
  ) THEN
    ALTER TABLE public.persons DROP CONSTRAINT persons_tenant_cpf_unique;
  END IF;
END $$;

-- Add global unique constraint on CPF
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'persons_cpf_unique'
  ) THEN
    ALTER TABLE public.persons
      ADD CONSTRAINT persons_cpf_unique UNIQUE (cpf);
  END IF;
END $$;

-- 2) Ensure CNPJ is globally unique across the entire system
-- Deduplicate companies by CNPJ
WITH dup_cnpj AS (
  SELECT cnpj, MIN(id) AS keep_id
  FROM public.companies
  GROUP BY cnpj
  HAVING COUNT(*) > 1
)
DELETE FROM public.companies c
USING dup_cnpj d
WHERE c.cnpj = d.cnpj
  AND c.id <> d.keep_id;

-- Add unique constraint on CNPJ if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'companies_cnpj_unique'
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_cnpj_unique UNIQUE (cnpj);
  END IF;
END $$;

-- 3) Provide a secure reset function for demo data that bypasses RLS safely
-- This avoids relying on client-side DELETE permissions
CREATE OR REPLACE FUNCTION public.reset_demo_data(_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Safety guard: only allow the known demo tenant id
  IF _tenant_id::text <> '1bf4dc32-eb3e-4115-9094-a567803563f0' THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  -- Delete dependent records first
  DELETE FROM public.portal_authentications WHERE tenant_id = _tenant_id;
  DELETE FROM public.portal_sessions WHERE tenant_id = _tenant_id;
  DELETE FROM public.company_members WHERE tenant_id = _tenant_id;
  DELETE FROM public.portal_users WHERE tenant_id = _tenant_id;

  -- Then main entities
  DELETE FROM public.companies WHERE tenant_id = _tenant_id;
  DELETE FROM public.persons WHERE tenant_id = _tenant_id;
END;
$$;

-- Grant execute to anon and authenticated so the app can call it via RPC
GRANT EXECUTE ON FUNCTION public.reset_demo_data(uuid) TO anon, authenticated;