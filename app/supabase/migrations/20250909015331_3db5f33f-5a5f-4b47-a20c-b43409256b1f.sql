-- Create tenants table
CREATE TABLE public.tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  site_url text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create portal_configs table  
CREATE TABLE public.portal_configs (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('semi', 'full')),
  tokens jsonb NOT NULL,
  login_methods jsonb NOT NULL,
  payments jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for tenants
CREATE POLICY "Users can view tenants they created" 
ON public.tenants 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create tenants" 
ON public.tenants 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their tenants" 
ON public.tenants 
FOR UPDATE 
USING (auth.uid() = created_by);

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

-- Create storage bucket for tenant assets
INSERT INTO storage.buckets (id, name, public) VALUES ('tenants', 'tenants', true);

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

-- Create trigger for updated_at
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portal_configs_updated_at
  BEFORE UPDATE ON public.portal_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();