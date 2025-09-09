-- Tabela para usuários do portal de autoatendimento
CREATE TABLE public.portal_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cpf TEXT,
  email TEXT,
  phone TEXT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_authenticated BOOLEAN DEFAULT false,
  auth_method TEXT, -- 'cpf_otp', 'contract', 'coupon', 'google', etc
  contract_number TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabela para sessões de acesso ao portal (visitantes + autenticados)
CREATE TABLE public.portal_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  portal_user_id UUID REFERENCES public.portal_users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  is_authenticated BOOLEAN DEFAULT false,
  auth_method TEXT,
  pages_visited JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Tabela para histórico de autenticações
CREATE TABLE public.portal_authentications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  portal_user_id UUID REFERENCES public.portal_users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.portal_sessions(id) ON DELETE CASCADE,
  auth_method TEXT NOT NULL, -- 'cpf_otp', 'contract', 'coupon', 'google'
  auth_channel TEXT, -- 'email', 'sms', 'whatsapp' para OTP
  identifier TEXT, -- CPF, email, contract number, etc
  success BOOLEAN NOT NULL DEFAULT true,
  failure_reason TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_authentications ENABLE ROW LEVEL SECURITY;

-- RLS Policies para portal_users
CREATE POLICY "Users can view portal users for their tenants" 
ON public.portal_users 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.tenant_id = portal_users.tenant_id
));

CREATE POLICY "Users can manage portal users for their tenants" 
ON public.portal_users 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.tenant_id = portal_users.tenant_id
));

-- RLS Policies para portal_sessions
CREATE POLICY "Users can view portal sessions for their tenants" 
ON public.portal_sessions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.tenant_id = portal_sessions.tenant_id
));

CREATE POLICY "Users can manage portal sessions for their tenants" 
ON public.portal_sessions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.tenant_id = portal_sessions.tenant_id
));

-- RLS Policies para portal_authentications
CREATE POLICY "Users can view portal authentications for their tenants" 
ON public.portal_authentications 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.tenant_id = portal_authentications.tenant_id
));

CREATE POLICY "Users can manage portal authentications for their tenants" 
ON public.portal_authentications 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.tenant_id = portal_authentications.tenant_id
));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_portal_users_updated_at
BEFORE UPDATE ON public.portal_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes para performance
CREATE INDEX idx_portal_users_tenant_id ON public.portal_users(tenant_id);
CREATE INDEX idx_portal_users_cpf ON public.portal_users(cpf);
CREATE INDEX idx_portal_users_email ON public.portal_users(email);
CREATE INDEX idx_portal_sessions_tenant_id ON public.portal_sessions(tenant_id);
CREATE INDEX idx_portal_sessions_portal_user_id ON public.portal_sessions(portal_user_id);
CREATE INDEX idx_portal_sessions_started_at ON public.portal_sessions(started_at);
CREATE INDEX idx_portal_authentications_tenant_id ON public.portal_authentications(tenant_id);
CREATE INDEX idx_portal_authentications_attempted_at ON public.portal_authentications(attempted_at);