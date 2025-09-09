-- Remove the previous CPF unique constraint
ALTER TABLE public.portal_users DROP CONSTRAINT IF EXISTS portal_users_tenant_cpf_key;

-- Add new columns to support PF/PJ distinction
ALTER TABLE public.portal_users 
ADD COLUMN IF NOT EXISTS user_type TEXT CHECK (user_type IN ('PF', 'PJ')) DEFAULT 'PF',
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS legal_representative_name TEXT;

-- Allow CPF to be nullable again (for PJ cases where we only have CNPJ)
ALTER TABLE public.portal_users ALTER COLUMN cpf DROP NOT NULL;

-- Create unique constraints based on user type
-- For PF: unique CPF per tenant
CREATE UNIQUE INDEX IF NOT EXISTS portal_users_pf_unique 
ON public.portal_users (tenant_id, cpf) 
WHERE user_type = 'PF' AND cpf IS NOT NULL;

-- For PJ: unique CNPJ + CPF combination per tenant (same CPF can be in multiple PJs)
CREATE UNIQUE INDEX IF NOT EXISTS portal_users_pj_unique 
ON public.portal_users (tenant_id, cnpj, cpf) 
WHERE user_type = 'PJ' AND cnpj IS NOT NULL AND cpf IS NOT NULL;

-- Ensure either CPF or CNPJ is provided
ALTER TABLE public.portal_users 
ADD CONSTRAINT check_cpf_or_cnpj 
CHECK ((user_type = 'PF' AND cpf IS NOT NULL) OR (user_type = 'PJ' AND cnpj IS NOT NULL));

-- Update portal_configs to support PJ login methods
UPDATE public.portal_configs 
SET login_methods = jsonb_set(
  login_methods, 
  '{cnpjOtp}', 
  'true'::jsonb
) 
WHERE login_methods IS NOT NULL;

-- Add trigger to update timestamps
DROP TRIGGER IF EXISTS update_portal_users_updated_at ON public.portal_users;
CREATE TRIGGER update_portal_users_updated_at
  BEFORE UPDATE ON public.portal_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();