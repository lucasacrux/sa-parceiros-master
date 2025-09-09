-- Add missing columns to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS site_url text,
ADD COLUMN IF NOT EXISTS created_by uuid;

-- Update existing rows to use nome as name if name is null
UPDATE public.tenants SET name = nome WHERE name IS NULL;

-- Update existing rows to use site_oficial as site_url if site_url is null  
UPDATE public.tenants SET site_url = site_oficial WHERE site_url IS NULL;

-- Make name NOT NULL after migration
ALTER TABLE public.tenants ALTER COLUMN name SET NOT NULL;

-- Create portal_configs table
CREATE TABLE IF NOT EXISTS public.portal_configs (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('semi', 'full')),
  tokens jsonb NOT NULL,
  login_methods jsonb NOT NULL,
  payments jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on portal_configs
ALTER TABLE public.portal_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for portal_configs (allowing public access for portal functionality)
CREATE POLICY "Anyone can view portal configs" 
ON public.portal_configs 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage portal configs" 
ON public.portal_configs 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create storage bucket for tenant assets (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tenants', 'tenants', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies (if not exist)
DROP POLICY IF EXISTS "Anyone can view tenant assets" ON storage.objects;
CREATE POLICY "Anyone can view tenant assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'tenants');

DROP POLICY IF EXISTS "Authenticated users can upload tenant assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload tenant assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'tenants' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their tenant assets" ON storage.objects;  
CREATE POLICY "Users can update their tenant assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'tenants' AND auth.role() = 'authenticated');

-- Create trigger for portal_configs updated_at
DROP TRIGGER IF EXISTS update_portal_configs_updated_at ON public.portal_configs;
CREATE TRIGGER update_portal_configs_updated_at
  BEFORE UPDATE ON public.portal_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();