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

-- Modify portal_users to reference either a person or company
ALTER TABLE public.portal_users 
ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
ADD CONSTRAINT check_person_or_company CHECK (
  (user_type = 'PF' AND person_id IS NOT NULL AND company_id IS NULL) OR
  (user_type = 'PJ' AND company_id IS NOT NULL AND person_id IS NOT NULL)
);

-- Enable RLS on new tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for companies
CREATE POLICY "Users can view companies for their tenants" 
ON public.companies 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND tenant_id = companies.tenant_id
));

CREATE POLICY "Users can manage companies for their tenants" 
ON public.companies 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND tenant_id = companies.tenant_id
));

-- Create RLS policies for persons
CREATE POLICY "Users can view persons for their tenants" 
ON public.persons 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND tenant_id = persons.tenant_id
));

CREATE POLICY "Users can manage persons for their tenants" 
ON public.persons 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND tenant_id = persons.tenant_id
));

-- Create RLS policies for company_members
CREATE POLICY "Users can view company members for their tenants" 
ON public.company_members 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND tenant_id = company_members.tenant_id
));

CREATE POLICY "Users can manage company members for their tenants" 
ON public.company_members 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND tenant_id = company_members.tenant_id
));

-- Add triggers for timestamp updates
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