-- Update portal_configs to include the new authentication methods
UPDATE public.portal_configs 
SET login_methods = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        login_methods,
        '{email}', 'true'::jsonb
      ),
      '{sms}', 'true'::jsonb  
    ),
    '{whatsapp}', 'true'::jsonb
  ),
  '{google}', 'true'::jsonb
)
WHERE tenant_id = '1bf4dc32-eb3e-4115-9094-a567803563f0';