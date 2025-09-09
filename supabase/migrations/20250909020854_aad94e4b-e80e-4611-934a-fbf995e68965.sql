-- Update RLS policies for tenants table to allow authenticated users to create tenants
-- without requiring created_by to match auth.uid() during creation

DROP POLICY IF EXISTS "Users can view tenants they created" ON public.tenants;
DROP POLICY IF EXISTS "Users can create tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can update their tenants" ON public.tenants;

-- Allow authenticated users to view all tenants (for admin functionality)
CREATE POLICY "Authenticated users can view tenants" 
ON public.tenants 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow authenticated users to create tenants
CREATE POLICY "Authenticated users can create tenants" 
ON public.tenants 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update tenants
CREATE POLICY "Authenticated users can update tenants" 
ON public.tenants 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete tenants
CREATE POLICY "Authenticated users can delete tenants" 
ON public.tenants 
FOR DELETE 
USING (auth.role() = 'authenticated');