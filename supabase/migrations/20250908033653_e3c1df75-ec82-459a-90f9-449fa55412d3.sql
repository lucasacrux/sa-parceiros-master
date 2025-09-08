-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tenants_updated_at') THEN
        CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_portal_settings_updated_at') THEN
        CREATE TRIGGER update_portal_settings_updated_at BEFORE UPDATE ON public.portal_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_consumers_updated_at') THEN
        CREATE TRIGGER update_consumers_updated_at BEFORE UPDATE ON public.consumers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_contracts_updated_at') THEN
        CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_debts_updated_at') THEN
        CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON public.debts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

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

-- Drop existing policies if they exist and create new ones
DO $$ 
BEGIN
    -- Tenants policies
    DROP POLICY IF EXISTS "Users can view tenants they belong to" ON public.tenants;
    DROP POLICY IF EXISTS "Admins can manage tenants" ON public.tenants;
    
    CREATE POLICY "Users can view tenants they belong to" ON public.tenants
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND tenant_id = tenants.id
        )
      );

    CREATE POLICY "Admins can manage tenants" ON public.tenants
      FOR ALL USING (public.has_role(auth.uid(), 'admin', id) OR public.has_role(auth.uid(), 'super_admin'));

    -- Profiles policies
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
    
    CREATE POLICY "Users can view their own profile" ON public.profiles
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can update their own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own profile" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    -- User roles policies
    DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
    
    CREATE POLICY "Users can view their own roles" ON public.user_roles
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Admins can manage user roles" ON public.user_roles
      FOR ALL USING (public.has_role(auth.uid(), 'admin', tenant_id) OR public.has_role(auth.uid(), 'super_admin'));

    -- Portal settings policies
    DROP POLICY IF EXISTS "Users can view portal settings for their tenants" ON public.portal_settings;
    DROP POLICY IF EXISTS "Admins can manage portal settings" ON public.portal_settings;
    
    CREATE POLICY "Users can view portal settings for their tenants" ON public.portal_settings
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND tenant_id = portal_settings.tenant_id
        )
      );

    CREATE POLICY "Admins can manage portal settings" ON public.portal_settings
      FOR ALL USING (public.has_role(auth.uid(), 'admin', tenant_id) OR public.has_role(auth.uid(), 'super_admin'));

    -- Consumers policies
    DROP POLICY IF EXISTS "Users can view consumers for their tenants" ON public.consumers;
    DROP POLICY IF EXISTS "Users can manage consumers for their tenants" ON public.consumers;
    
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

    -- Contracts policies
    DROP POLICY IF EXISTS "Users can view contracts for their tenants" ON public.contracts;
    DROP POLICY IF EXISTS "Users can manage contracts for their tenants" ON public.contracts;
    
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

    -- Debts policies
    DROP POLICY IF EXISTS "Users can view debts for their tenants" ON public.debts;
    DROP POLICY IF EXISTS "Users can manage debts for their tenants" ON public.debts;
    
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

    -- Analytics events policies
    DROP POLICY IF EXISTS "Users can view analytics for their tenants" ON public.analytics_events;
    DROP POLICY IF EXISTS "Users can insert analytics for their tenants" ON public.analytics_events;
    
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
END $$;

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON public.user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_consumers_tenant_id ON public.consumers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_consumers_cpf ON public.consumers(cpf);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_id ON public.contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_consumer_id ON public.contracts(consumer_id);
CREATE INDEX IF NOT EXISTS idx_debts_tenant_id ON public.debts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_debts_contract_id ON public.debts(contract_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant_id ON public.analytics_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);