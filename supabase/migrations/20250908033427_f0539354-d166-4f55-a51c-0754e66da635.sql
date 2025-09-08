-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tenants table
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  nome text NOT NULL,
  cnpj text,
  site_oficial text,
  theme jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create roles table for RBAC
CREATE TABLE public.roles (
  id serial PRIMARY KEY,
  key text UNIQUE NOT NULL,
  name text NOT NULL
);

-- Create user_roles junction table
CREATE TABLE public.user_roles (
  user_id uuid NOT NULL,
  role_id int NOT NULL REFERENCES public.roles(id),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, role_id, tenant_id)
);

-- Create portal_settings table
CREATE TABLE public.portal_settings (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  mode text DEFAULT 'subdomain' CHECK (mode IN ('subdomain', 'subpath', 'custom')),
  subpath text,
  subdomain text,
  custom_domain text,
  login_modes jsonb DEFAULT '["cpf_otp","contract","coupon"]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create consumers table
CREATE TABLE public.consumers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf text,
  name text,
  email text,
  phone text,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contracts table
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id uuid NOT NULL REFERENCES public.consumers(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  number text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  original_value numeric(10,2),
  current_value numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create debts table
CREATE TABLE public.debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  due_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'negotiating')),
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create analytics_events table
CREATE TABLE public.analytics_events (
  id bigserial PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  portal_user_id uuid,
  session_id text,
  name text NOT NULL,
  props jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default roles
INSERT INTO public.roles (key, name) VALUES 
  ('super_admin', 'Super Admin'),
  ('admin', 'Administrador'),
  ('manager', 'Gerente'),
  ('user', 'Usuário');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_portal_settings_updated_at BEFORE UPDATE ON public.portal_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_consumers_updated_at BEFORE UPDATE ON public.consumers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON public.debts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
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

-- Create RLS policies for tenants
CREATE POLICY "Users can view tenants they belong to" ON public.tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND tenant_id = tenants.id
    )
  );

CREATE POLICY "Admins can manage tenants" ON public.tenants
  FOR ALL USING (public.has_role(auth.uid(), 'admin', id) OR public.has_role(auth.uid(), 'super_admin'));

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin', tenant_id) OR public.has_role(auth.uid(), 'super_admin'));

-- Create RLS policies for portal_settings
CREATE POLICY "Users can view portal settings for their tenants" ON public.portal_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND tenant_id = portal_settings.tenant_id
    )
  );

CREATE POLICY "Admins can manage portal settings" ON public.portal_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin', tenant_id) OR public.has_role(auth.uid(), 'super_admin'));

-- Create RLS policies for consumers
CREATE POLICY "Users can view consumers for their tenants" ON public.consumers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND tenant_id = consumers.tenant_id
    )
  );

CREATE POLICY "Users can manage consumers for their tenants" ON public.consumers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND tenant_id = consumers.tenant_id
    )
  );

-- Create RLS policies for contracts
CREATE POLICY "Users can view contracts for their tenants" ON public.contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND tenant_id = contracts.tenant_id
    )
  );

CREATE POLICY "Users can manage contracts for their tenants" ON public.contracts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND tenant_id = contracts.tenant_id
    )
  );

-- Create RLS policies for debts
CREATE POLICY "Users can view debts for their tenants" ON public.debts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND tenant_id = debts.tenant_id
    )
  );

CREATE POLICY "Users can manage debts for their tenants" ON public.debts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND tenant_id = debts.tenant_id
    )
  );

-- Create RLS policies for analytics_events
CREATE POLICY "Users can view analytics for their tenants" ON public.analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND tenant_id = analytics_events.tenant_id
    )
  );

CREATE POLICY "Users can insert analytics for their tenants" ON public.analytics_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND tenant_id = analytics_events.tenant_id
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_tenant_id ON public.user_roles(tenant_id);
CREATE INDEX idx_consumers_tenant_id ON public.consumers(tenant_id);
CREATE INDEX idx_consumers_cpf ON public.consumers(cpf);
CREATE INDEX idx_contracts_tenant_id ON public.contracts(tenant_id);
CREATE INDEX idx_contracts_consumer_id ON public.contracts(consumer_id);
CREATE INDEX idx_debts_tenant_id ON public.debts(tenant_id);
CREATE INDEX idx_debts_contract_id ON public.debts(contract_id);
CREATE INDEX idx_analytics_events_tenant_id ON public.analytics_events(tenant_id);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);