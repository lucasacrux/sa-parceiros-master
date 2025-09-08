-- Fix the security issues identified by the linter

-- 1. Fix function search path mutable issue by ensuring proper search_path setting
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text, _tenant_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
      AND r.key = _role
      AND (_tenant_id IS NULL OR ur.tenant_id = _tenant_id)
  )
$$;

-- 2. Make sure RLS is enabled on the roles table (this was missing)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Add basic policies for roles table (read-only for authenticated users)
CREATE POLICY "Authenticated users can view roles" ON public.roles
  FOR SELECT TO authenticated
  USING (true);

-- Allow admins to manage roles
CREATE POLICY "Admins can manage roles" ON public.roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));