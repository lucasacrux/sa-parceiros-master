-- Remove existing constraints and data
DELETE FROM public.portal_authentications;
DELETE FROM public.portal_sessions;  
DELETE FROM public.portal_users;

-- Drop existing constraint
ALTER TABLE public.portal_users DROP CONSTRAINT IF EXISTS check_person_or_company;

-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  cnpj TEXT NOT NULL,
  company_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT companies_tenant_cnpj_unique UNIQUE (tenant_id, cnpj)
);

-- Create persons table 
CREATE TABLE IF NOT EXISTS public.persons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  cpf TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT persons_tenant_cpf_unique UNIQUE (tenant_id, cpf)
);

-- Create company_members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.company_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('socio', 'representante_legal', 'administrador', 'procurador')),
  is_main_contact BOOLEAN DEFAULT false,
  percentage DECIMAL(5,2), -- For partners, their ownership percentage
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT company_members_unique UNIQUE (tenant_id, company_id, person_id, role)
);

-- Add foreign key columns to portal_users if they don't exist
ALTER TABLE public.portal_users 
ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Add RLS policies with public access for demo
CREATE POLICY "Allow public read access for demo companies" 
ON public.companies FOR SELECT USING (true);

CREATE POLICY "Allow demo data insertion for companies" 
ON public.companies FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access for demo persons" 
ON public.persons FOR SELECT USING (true);

CREATE POLICY "Allow demo data insertion for persons" 
ON public.persons FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access for demo company_members" 
ON public.company_members FOR SELECT USING (true);

CREATE POLICY "Allow demo data insertion for company_members" 
ON public.company_members FOR INSERT WITH CHECK (true);

-- Add triggers
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_persons_updated_at
  BEFORE UPDATE ON public.persons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_members_updated_at
  BEFORE UPDATE ON public.company_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();