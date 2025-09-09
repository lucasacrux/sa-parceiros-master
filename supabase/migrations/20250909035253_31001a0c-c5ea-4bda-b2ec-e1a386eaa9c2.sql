-- Deduplicate nearly-identical users by CPF per tenant (keep most recent)
WITH ranked AS (
  SELECT id, tenant_id, cpf, created_at,
         ROW_NUMBER() OVER (PARTITION BY tenant_id, cpf ORDER BY created_at DESC, id DESC) AS rn
  FROM public.portal_users
  WHERE cpf IS NOT NULL
)
DELETE FROM public.portal_users pu
USING ranked r
WHERE pu.id = r.id AND r.rn > 1;

-- Remove records without CPF to enforce new rule
DELETE FROM public.portal_users WHERE cpf IS NULL;

-- Enforce CPF presence
ALTER TABLE public.portal_users ALTER COLUMN cpf SET NOT NULL;

-- Enforce CPF uniqueness per tenant (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'portal_users_tenant_cpf_key'
  ) THEN
    ALTER TABLE public.portal_users
    ADD CONSTRAINT portal_users_tenant_cpf_key UNIQUE (tenant_id, cpf);
  END IF;
END $$;