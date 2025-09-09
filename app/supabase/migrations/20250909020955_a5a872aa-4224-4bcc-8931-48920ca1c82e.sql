-- Broaden RLS for preview V1: allow public access to create and manage tenants and portal configs

-- Tenants policies
CREATE POLICY IF NOT EXISTS "Public can view tenants (preview)"
ON public.tenants
FOR SELECT
USING (true);

CREATE POLICY IF NOT EXISTS "Public can insert tenants (preview)"
ON public.tenants
FOR INSERT
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Public can update tenants (preview)"
ON public.tenants
FOR UPDATE
USING (true);

CREATE POLICY IF NOT EXISTS "Public can delete tenants (preview)"
ON public.tenants
FOR DELETE
USING (true);

-- Portal configs policies
CREATE POLICY IF NOT EXISTS "Public can insert portal configs (preview)"
ON public.portal_configs
FOR INSERT
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Public can update portal configs (preview)"
ON public.portal_configs
FOR UPDATE
USING (true);

CREATE POLICY IF NOT EXISTS "Public can delete portal configs (preview)"
ON public.portal_configs
FOR DELETE
USING (true);