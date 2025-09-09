-- Create portal_configs table (tenants already exists)
CREATE TABLE public.portal_configs (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('semi', 'full')),
  tokens jsonb NOT NULL,
  login_methods jsonb NOT NULL,
  payments jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on portal_configs
ALTER TABLE public.portal_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for portal_configs
CREATE POLICY "Users can view portal configs for their tenants" 
ON public.portal_configs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.tenants 
  WHERE tenants.id = portal_configs.tenant_id 
  AND tenants.created_by = auth.uid()
));

CREATE POLICY "Users can manage portal configs for their tenants" 
ON public.portal_configs 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.tenants 
  WHERE tenants.id = portal_configs.tenant_id 
  AND tenants.created_by = auth.uid()
));

-- Create storage bucket for tenant assets (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tenants', 'tenants', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Anyone can view tenant assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'tenants');

CREATE POLICY "Authenticated users can upload tenant assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'tenants' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their tenant assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'tenants' AND auth.role() = 'authenticated');

-- Create trigger for portal_configs updated_at
CREATE TRIGGER update_portal_configs_updated_at
  BEFORE UPDATE ON public.portal_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();