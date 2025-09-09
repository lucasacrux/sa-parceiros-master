-- Drop existing restrictive policies and create public access for V1 demo
DROP POLICY IF EXISTS "Authenticated users can view tenants" ON public.tenants;
DROP POLICY IF EXISTS "Authenticated users can create tenants" ON public.tenants;
DROP POLICY IF EXISTS "Authenticated users can update tenants" ON public.tenants;
DROP POLICY IF EXISTS "Authenticated users can delete tenants" ON public.tenants;

-- Create public policies for tenants (V1 demo only)
CREATE POLICY "Public can view tenants"
ON public.tenants
FOR SELECT
USING (true);

CREATE POLICY "Public can insert tenants"
ON public.tenants
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update tenants"
ON public.tenants
FOR UPDATE
USING (true);

CREATE POLICY "Public can delete tenants"
ON public.tenants
FOR DELETE
USING (true);

-- Add similar policies for portal configs
CREATE POLICY "Public can insert portal configs"
ON public.portal_configs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update portal configs"
ON public.portal_configs
FOR UPDATE
USING (true);

CREATE POLICY "Public can delete portal configs"
ON public.portal_configs
FOR DELETE
USING (true);