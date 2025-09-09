import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  UserCheck, 
  Activity, 
  Shield, 
  Calendar,
  Clock,
  Eye,
  Filter,
  RefreshCw,
  Download,
  Mail,
  Phone,
  CreditCard,
  Key,
  Building
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PortalUser {
  id: string;
  tenant_id: string;
  user_type: 'PF' | 'PJ';
  person_id?: string;
  company_id?: string;
  person?: {
    id: string;
    cpf: string;
    name: string;
    email?: string;
    phone?: string;
  };
  company?: {
    id: string;
    cnpj: string;
    company_name: string;
    email?: string;
    phone?: string;
  };
  created_at: string;
  last_login_at?: string;
  is_authenticated: boolean;
  auth_method?: string;
  contract_number?: string;
}

interface PortalSession {
  id: string;
  session_id: string;
  ip_address?: string | null;
  user_agent?: string | null;
  is_authenticated: boolean;
  auth_method?: string | null;
  started_at: string;
  last_activity_at: string;
  ended_at?: string | null;
  portal_user?: PortalUser | null;
  tenant_id: string;
}

interface PortalAuthentication {
  id: string;
  auth_method: string;
  auth_channel?: string;
  identifier?: string;
  success: boolean;
  failure_reason?: string;
  attempted_at: string;
  portal_user?: PortalUser;
  tenant_id: string;
}

export default function AdminPortal() {
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([]);
  const [portalSessions, setPortalSessions] = useState<PortalSession[]>([]);
  const [portalAuths, setPortalAuths] = useState<PortalAuthentication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [authFilter, setAuthFilter] = useState("all");
  const [hasImportedWallets, setHasImportedWallets] = useState(false);
  const [creatingDemo, setCreatingDemo] = useState(false);

  const DEMO_TENANT_ID = "1bf4dc32-eb3e-4115-9094-a567803563f0";

  // Check if wallets have been imported
  const checkImportedWallets = async () => {
    try {
      // Check if there are any contracts/debts that indicate imported wallets
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('id')
        .eq('tenant_id', DEMO_TENANT_ID)
        .limit(1);

      if (error) throw error;
      setHasImportedWallets((contracts && contracts.length > 0) || false);
    } catch (error) {
      console.error("Erro ao verificar carteiras importadas:", error);
      setHasImportedWallets(false);
    }
  };

  const getAuthMethodIcon = (method: string) => {
    switch (method) {
      case 'email':
        return <Mail className="h-3 w-3" />;
      case 'sms':
        return <Phone className="h-3 w-3" />;
      case 'whatsapp':
        return <Phone className="h-3 w-3" />;
      case 'google':
        return <Shield className="h-3 w-3" />;
      case 'cpf_otp':
        return <Key className="h-3 w-3" />;
      case 'cnpj_otp':
        return <Building className="h-3 w-3" />;
      case 'contract':
        return <CreditCard className="h-3 w-3" />;
      default:
        return <Shield className="h-3 w-3" />;
    }
  };

  const getAuthMethodName = (method: string) => {
    switch (method) {
      case 'email':
        return 'E-mail';
      case 'sms':
        return 'SMS';
      case 'whatsapp':
        return 'WhatsApp';
      case 'google':
        return 'Google';
      case 'cpf_otp':
        return 'CPF + OTP';
      case 'cnpj_otp':
        return 'CNPJ + OTP';
      case 'contract':
        return 'Contrato';
      default:
        return method;
    }
  };

  const loadPortalUsers = async () => {
    try {
      const { data: users, error } = await supabase
        .from('portal_users')
        .select(`
          *,
          person:persons(*),
          company:companies(*)
        `)
        .eq('tenant_id', DEMO_TENANT_ID)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPortalUsers((users || []).map(user => ({
        ...user,
        user_type: (user.user_type || 'PF') as 'PF' | 'PJ'
      })));
    } catch (error) {
      console.error("Erro ao carregar usuários do portal:", error);
      // Create demo data if no users exist
      await createDemoData();
      // Retry loading
      const { data: users, error: retryError } = await supabase
        .from('portal_users')
        .select(`
          *,
          person:persons(*),
          company:companies(*)
        `)
        .eq('tenant_id', DEMO_TENANT_ID)
        .order('created_at', { ascending: false });
      
      if (!retryError) {
        setPortalUsers((users || []).map(user => ({
          ...user,
          user_type: (user.user_type || 'PF') as 'PF' | 'PJ'
        })));
      }
    }
  };

  const loadPortalSessions = async () => {
    try {
      const { data: sessions, error } = await supabase
        .from('portal_sessions')
        .select(`
          *,
          portal_user:portal_users(
            *,
            person:persons(*),
            company:companies(*)
          )
        `)
        .eq('tenant_id', DEMO_TENANT_ID)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPortalSessions((sessions || []).map(session => ({
        ...session,
        ip_address: session.ip_address as string | null,
        user_agent: session.user_agent as string | null,
        portal_user: session.portal_user ? {
          ...session.portal_user,
          user_type: (session.portal_user.user_type || 'PF') as 'PF' | 'PJ',
          person: session.portal_user.person as any,
          company: session.portal_user.company as any
        } : null
      })));
    } catch (error) {
      console.error("Erro ao carregar sessões do portal:", error);
    }
  };

  const loadPortalAuthentications = async () => {
    try {
      const { data: auths, error } = await supabase
        .from('portal_authentications')
        .select(`
          *,
          portal_user:portal_users(
            *,
            person:persons(*),
            company:companies(*)
          )
        `)
        .eq('tenant_id', DEMO_TENANT_ID)
        .order('attempted_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPortalAuths((auths || []).map(auth => ({
        ...auth,
        portal_user: auth.portal_user ? {
          ...auth.portal_user,
          user_type: (auth.portal_user.user_type || 'PF') as 'PF' | 'PJ',
          person: auth.portal_user.person as any,
          company: auth.portal_user.company as any
        } : undefined
      })));
    } catch (error) {
      console.error("Erro ao carregar autenticações do portal:", error);
    }
  };

  const createDemoData = async () => {
    if (hasImportedWallets) {
      alert("Demo data não pode ser criado após a importação de carteiras. Use a função de usuário admin para teste.");
      return;
    }

    setCreatingDemo(true);
    try {
      console.log("Iniciando criação de dados demo...");
      
      // Clear existing demo data using the secure reset function
      console.log("Limpando dados existentes...");
      
      try {
        // Use the secure function to reset demo data
        const { error: resetError } = await supabase.rpc('reset_demo_data', {
          _tenant_id: DEMO_TENANT_ID
        });
        
        if (resetError) {
          console.error("Erro ao limpar dados via RPC:", resetError);
          throw resetError;
        }
        
        console.log("Dados limpos com sucesso");
      } catch (cleanupError) {
        console.error("Erro na limpeza:", cleanupError);
        throw cleanupError;
      }

      console.log("Dados existentes limpos");

      // Create demo persons with globally unique CPFs
      console.log("Criando pessoas...");
      const { data: persons, error: personsError } = await supabase
        .from('persons')
        .insert([
          {
            tenant_id: DEMO_TENANT_ID,
            cpf: '147.437.978-88',
            name: 'Eduardo Carceroni',
            email: 'eduardo.carceroni@email.com',
            phone: '+5511999999999',
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            tenant_id: DEMO_TENANT_ID,
            cpf: '123.456.789-01', // Changed to unique CPF
            name: 'Maria Silva',
            email: 'maria.silva@email.com',
            phone: '+5511999999998',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            tenant_id: DEMO_TENANT_ID,
            cpf: '987.654.321-02', // Changed to unique CPF
            name: 'João Santos',
            email: 'joao.santos@email.com',
            phone: '+5511988888888',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            tenant_id: DEMO_TENANT_ID,
            cpf: '456.789.123-03', // Changed to unique CPF
            name: 'Ana Costa',
            email: 'ana.costa@email.com',
            phone: '+5511977777777',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          }
        ])
        .select();

      if (personsError) {
        console.error("Erro ao criar pessoas:", personsError);
        throw personsError;
      }
      console.log("Pessoas criadas:", persons);

      // Create demo companies

      console.log("Criando empresas...");
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .insert([
          {
            tenant_id: DEMO_TENANT_ID,
            cnpj: '12.345.678/0001-90',
            company_name: 'Tech Solutions Ltda',
            email: 'contato@techsolutions.com',
            phone: '+5511977777777',
            created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            tenant_id: DEMO_TENANT_ID,
            cnpj: '98.765.432/0001-10',
            company_name: 'Comércio ABC S.A.',
            email: 'comercial@comercioabc.com',
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          }
        ])
        .select();

      if (companiesError) {
        console.error("Erro ao criar empresas:", companiesError);
        throw companiesError;
      }
      console.log("Empresas criadas:", companies);

      // Create company members relationships
      if (companies && persons) {
        await supabase
          .from('company_members')
          .insert([
            // João Santos como sócio de Tech Solutions (70%)
            {
              tenant_id: DEMO_TENANT_ID,
              company_id: companies[0].id,
              person_id: persons[2].id, // João Santos
              role: 'socio',
              percentage: 70.00,
              is_main_contact: true,
            },
            // Ana Costa como sócia de Tech Solutions (30%)
            {
              tenant_id: DEMO_TENANT_ID,
              company_id: companies[0].id,
              person_id: persons[3].id, // Ana Costa
              role: 'socio',
              percentage: 30.00,
            },
            // João Santos como representante legal de Comércio ABC
            {
              tenant_id: DEMO_TENANT_ID,
              company_id: companies[1].id,
              person_id: persons[2].id, // João Santos (mesmo CPF, empresa diferente)
              role: 'representante_legal',
              is_main_contact: true,
            },
            // Ana Costa como sócia de Comércio ABC
            {
              tenant_id: DEMO_TENANT_ID,
              company_id: companies[1].id,
              person_id: persons[3].id, // Ana Costa (mesma pessoa, empresa diferente)
              role: 'socio',
              percentage: 50.00,
            }
          ]);

        // Create portal_users
        console.log("Criando portal_users...");
        const { data: portalUsers, error: portalUsersError } = await supabase
          .from('portal_users')
          .insert([
            // Pessoa Física - Eduardo (baseado no JSON original)
            {
              tenant_id: DEMO_TENANT_ID,
              user_type: 'PF',
              person_id: persons[0].id,
              cpf: persons[0].cpf,
              name: persons[0].name,
              email: persons[0].email,
              phone: persons[0].phone,
              is_authenticated: true,
              auth_method: 'email',
              contract_number: '11862281',
              last_login_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
            // Pessoa Física - Maria
            {
              tenant_id: DEMO_TENANT_ID,
              user_type: 'PF',
              person_id: persons[1].id,
              cpf: persons[1].cpf,
              name: persons[1].name,
              email: persons[1].email,
              phone: persons[1].phone,
              is_authenticated: true,
              auth_method: 'sms',
              contract_number: '11862282',
              last_login_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            },
            // Pessoa Jurídica - Tech Solutions (João como representante)
            {
              tenant_id: DEMO_TENANT_ID,
              user_type: 'PJ',
              company_id: companies[0].id,
              person_id: persons[2].id, // João Santos
              cnpj: companies[0].cnpj,
              company_name: companies[0].company_name,
              legal_representative_name: persons[2].name,
              email: companies[0].email,
              phone: companies[0].phone,
              is_authenticated: true,
              auth_method: 'whatsapp',
              contract_number: '11862283',
              last_login_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
              created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            },
            // Pessoa Jurídica - Comércio ABC (Ana como representante) 
            {
              tenant_id: DEMO_TENANT_ID,
              user_type: 'PJ',
              company_id: companies[1].id,
              person_id: persons[3].id, // Ana Costa
              cnpj: companies[1].cnpj,
              company_name: companies[1].company_name,
              legal_representative_name: persons[3].name,
              email: companies[1].email,
              phone: companies[1].phone,
              is_authenticated: true,
              auth_method: 'google',
              contract_number: '11862284',
              last_login_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
              created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            }
          ])
          .select();

        if (portalUsersError) {
          console.error("Erro ao criar portal_users:", portalUsersError);
          throw portalUsersError;
        }
        console.log("Portal users criados:", portalUsers);

        // Create some demo sessions
        console.log("Criando sessões demo...");
        await supabase
          .from('portal_sessions')
          .insert([
            {
              tenant_id: DEMO_TENANT_ID,
              portal_user_id: portalUsers[0].id,
              session_id: 'sess_demo_eduardo',
              ip_address: '192.168.1.100',
              user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              is_authenticated: true,
              auth_method: 'email',
              started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              last_activity_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            },
            {
              tenant_id: DEMO_TENANT_ID,
              portal_user_id: portalUsers[2].id,
              session_id: 'sess_demo_tech',
              ip_address: '192.168.1.101',
              user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
              is_authenticated: true,
              auth_method: 'whatsapp',
              started_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
              last_activity_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            }
          ]);

        // Create some demo authentications
        console.log("Criando autenticações demo...");
        await supabase
          .from('portal_authentications')
          .insert([
            {
              tenant_id: DEMO_TENANT_ID,
              portal_user_id: portalUsers[0].id,
              auth_method: 'email',
              auth_channel: 'email',
              identifier: 'eduardo.carceroni@email.com',
              success: true,
              attempted_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            },
            {
              tenant_id: DEMO_TENANT_ID,
              portal_user_id: portalUsers[1].id,
              auth_method: 'sms',
              auth_channel: 'sms',
              identifier: '+5511999999998',
              success: true,
              attempted_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              tenant_id: DEMO_TENANT_ID,
              portal_user_id: portalUsers[2].id,
              auth_method: 'whatsapp',
              auth_channel: 'whatsapp',
              identifier: '+5511988888888',
              success: true,
              attempted_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            },
            {
              tenant_id: DEMO_TENANT_ID,
              portal_user_id: portalUsers[3].id,
              auth_method: 'google',
              auth_channel: 'oauth',
              identifier: 'ana.costa@email.com',
              success: true,
              attempted_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            },
            // Algumas tentativas de falha
            {
              tenant_id: DEMO_TENANT_ID,
              auth_method: 'email',
              auth_channel: 'email',
              identifier: 'usuario.inexistente@email.com',
              success: false,
              failure_reason: 'Email não encontrado',
              attempted_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            },
            {
              tenant_id: DEMO_TENANT_ID,
              portal_user_id: portalUsers[0].id,
              auth_method: 'sms',
              auth_channel: 'sms',
              identifier: '+5511999999999',
              success: false,
              failure_reason: 'Código OTP inválido',
              attempted_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            }
          ]);
      }

      console.log("Dados demo criados com sucesso!");
      
      // Reload data after creation
      await loadData();
    } catch (error) {
      console.error("Erro ao criar dados demo:", error);
      alert("Erro ao criar dados demo. Verifique o console para mais detalhes.");
    } finally {
      setCreatingDemo(false);
    }
  };

  const createAdminTestUser = async () => {
    try {
      setCreatingDemo(true);
      console.log("Criando usuário admin teste...");
      
      // Create a test admin user for portal testing
      const { data: adminPerson, error: personError } = await supabase
        .from('persons')
        .insert({
          tenant_id: DEMO_TENANT_ID,
          cpf: '000.000.000-01', // Unique admin test CPF
          name: 'Admin Teste',
          email: 'admin@teste.com',
        })
        .select()
        .single();

      if (personError) throw personError;

      const { data: adminUser, error: userError } = await supabase
        .from('portal_users')
        .insert({
          tenant_id: DEMO_TENANT_ID,
          user_type: 'PF',
          person_id: adminPerson.id,
          cpf: adminPerson.cpf,
          name: adminPerson.name,
          email: adminPerson.email,
          is_authenticated: true,
          auth_method: 'email',
          contract_number: 'ADMIN_TEST',
        })
        .select()
        .single();

      if (userError) throw userError;

      console.log("Usuário admin teste criado:", adminUser);
      alert("Usuário admin teste criado! CPF: 000.000.000-01 | Senha: master");
      await loadData();
    } catch (error) {
      console.error("Erro ao criar usuário admin:", error);
      alert("Erro ao criar usuário admin. Verifique o console para mais detalhes.");
    } finally {
      setCreatingDemo(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadPortalUsers(),
      loadPortalSessions(),
      loadPortalAuthentications(),
      checkImportedWallets()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter users based on search term and auth filter
  const filteredUsers = portalUsers.filter(user => {
    const displayName = user.user_type === 'PJ' 
      ? user.company?.company_name 
      : user.person?.name;
    const cpf = user.person?.cpf;
    const cnpj = user.company?.cnpj;
    const email = user.user_type === 'PJ' 
      ? user.company?.email 
      : user.person?.email;

    const matchesSearch = !searchTerm || 
      displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cpf?.includes(searchTerm) ||
      cnpj?.includes(searchTerm) ||
      email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAuthFilter = 
      authFilter === "all" ||
      (authFilter === "authenticated" && user.is_authenticated) ||
      (authFilter === "not_authenticated" && !user.is_authenticated);

    return matchesSearch && matchesAuthFilter;
  });

  // Calculate stats
  const totalUsers = portalUsers.length;
  const authenticatedUsers = portalUsers.filter(u => u.is_authenticated).length;
  const activeSessions = portalSessions.filter(s => !s.ended_at).length;
  const successfulAuths = portalAuths.filter(a => a.success).length;

  const getUserDisplayInfo = (user: PortalUser) => {
    if (user.user_type === 'PJ') {
      return {
        name: user.company?.company_name || "Empresa não informada",
        subtitle: user.person?.name ? `Rep. Legal: ${user.person.name}` : "",
        document: user.company?.cnpj ? `CNPJ: ${user.company.cnpj}` : "CNPJ não informado",
        email: user.company?.email || user.person?.email || "Não informado"
      };
    } else {
      return {
        name: user.person?.name || "Nome não informado", 
        subtitle: "",
        document: user.person?.cpf ? `CPF: ${user.person.cpf}` : "CPF não informado",
        email: user.person?.email || "Não informado"
      };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-blue-500" />
          Admin Portal
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie usuários e acessos do portal de autoatendimento - Estrutura Multi-Sócio
        </p>
        {hasImportedWallets && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <Shield className="h-4 w-4 inline mr-1" />
              Carteiras já foram importadas. Use "Criar Admin Teste" para acessar o portal como usuário teste.
            </p>
          </div>
        )}
        {!hasImportedWallets && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <Users className="h-4 w-4 inline mr-1" />
              Dados demo disponíveis. Use "Recriar Demo" para gerar usuários de teste com dados completos.
            </p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {authenticatedUsers} autenticados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Autenticados</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{authenticatedUsers}</div>
            <p className="text-xs text-muted-foreground">
              {totalUsers > 0 ? Math.round((authenticatedUsers / totalUsers) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões Ativas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessions}</div>
            <p className="text-xs text-muted-foreground">
              {portalSessions.length} total de sessões
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Autenticações OK</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successfulAuths}</div>
            <p className="text-xs text-muted-foreground">
              {portalAuths.length} total de tentativas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="authentications">Autenticações</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Buscar por nome, CPF/CNPJ ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-80"
            />
            <Select value={authFilter} onValueChange={setAuthFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="authenticated">Autenticados</SelectItem>
                <SelectItem value="not_authenticated">Não autenticados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            {!hasImportedWallets ? (
              <Button 
                onClick={createDemoData} 
                variant="outline" 
                disabled={loading || creatingDemo}
              >
                <Users className="h-4 w-4 mr-2" />
                {creatingDemo ? "Criando..." : "Recriar Demo"}
              </Button>
            ) : (
              <Button 
                onClick={createAdminTestUser} 
                variant="outline" 
                disabled={loading || creatingDemo}
              >
                <Shield className="h-4 w-4 mr-2" />
                {creatingDemo ? "Criando..." : "Criar Admin Teste"}
              </Button>
            )}
            <Button onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const displayInfo = getUserDisplayInfo(user);
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{displayInfo.name}</div>
                          {displayInfo.subtitle && (
                            <div className="text-sm text-muted-foreground">
                              {displayInfo.subtitle}
                            </div>
                          )}
                          {user.contract_number && (
                            <div className="text-sm text-muted-foreground">
                              Contrato: {user.contract_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.user_type === 'PJ' ? 'default' : 'secondary'}>
                          {user.user_type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {displayInfo.document}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {displayInfo.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.is_authenticated ? (
                          <Badge variant="default" className="bg-green-500/10 text-green-600">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Autenticado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Users className="h-3 w-3 mr-1" />
                            Não autenticado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.auth_method ? (
                          <div className="flex items-center gap-2">
                            {getAuthMethodIcon(user.auth_method)}
                            <span className="text-sm">{getAuthMethodName(user.auth_method)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.last_login_at ? (
                          <div className="text-sm">
                            {new Date(user.last_login_at).toLocaleDateString('pt-BR')}
                            <div className="text-xs text-muted-foreground">
                              {new Date(user.last_login_at).toLocaleTimeString('pt-BR')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          <div className="text-xs text-muted-foreground">
                            {new Date(user.created_at).toLocaleTimeString('pt-BR')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Sessões do Portal</h3>
            <Button onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Sessão</TableHead>
                  <TableHead>IP / Localização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Iniciado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portalSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {session.portal_user?.person?.name || 
                           session.portal_user?.company?.company_name || 
                           "Usuário anônimo"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {session.portal_user?.person?.cpf && `CPF: ${session.portal_user.person.cpf}`}
                          {session.portal_user?.company?.cnpj && `CNPJ: ${session.portal_user.company.cnpj}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">
                        {session.session_id.substring(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {session.ip_address || "IP não disponível"}
                        <div className="text-xs text-muted-foreground">
                          {session.user_agent?.substring(0, 50)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {session.ended_at ? (
                        <Badge variant="secondary">Finalizada</Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-500/10 text-green-600">
                          <Activity className="h-3 w-3 mr-1" />
                          Ativa
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {session.ended_at ? (
                          format(
                            new Date(new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()),
                            'HH:mm:ss'
                          )
                        ) : (
                          format(
                            new Date(new Date().getTime() - new Date(session.started_at).getTime()),
                            'HH:mm:ss'
                          )
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(session.started_at).toLocaleDateString('pt-BR')}
                        <div className="text-xs text-muted-foreground">
                          {new Date(session.started_at).toLocaleTimeString('pt-BR')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {portalSessions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhuma sessão encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Authentications Tab */}
        <TabsContent value="authentications" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Tentativas de Autenticação</h3>
            <Button onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Identificador</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tentativa em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portalAuths.map((auth) => (
                  <TableRow key={auth.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {auth.portal_user?.person?.name || 
                           auth.portal_user?.company?.company_name || 
                           "Usuário não identificado"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {auth.portal_user?.person?.cpf && `CPF: ${auth.portal_user.person.cpf}`}
                          {auth.portal_user?.company?.cnpj && `CNPJ: ${auth.portal_user.company.cnpj}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">
                        {auth.identifier || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getAuthMethodIcon(auth.auth_method)}
                        <span className="text-sm">{getAuthMethodName(auth.auth_method)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {auth.auth_channel || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {auth.success ? (
                        <Badge variant="default" className="bg-green-500/10 text-green-600">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Sucesso
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <Shield className="h-3 w-3 mr-1" />
                          Falha
                        </Badge>
                      )}
                      {auth.failure_reason && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {auth.failure_reason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(auth.attempted_at).toLocaleDateString('pt-BR')}
                        <div className="text-xs text-muted-foreground">
                          {new Date(auth.attempted_at).toLocaleTimeString('pt-BR')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {portalAuths.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhuma autenticação encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}