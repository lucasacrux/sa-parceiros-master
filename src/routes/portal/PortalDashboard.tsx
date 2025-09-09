import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTenantBySlug, applyTheme } from "@/lib/tenant";
import { supabase } from "@/integrations/supabase/client";
import type { TenantConfig } from "@/types/portal";
import { customer, dividas, acordos, faturas } from "@/mock";
import { 
  Home, 
  FileText, 
  CreditCard, 
  HelpCircle, 
  User, 
  LogOut,
  TrendingUp,
  DollarSign,
  FileCheck,
  AlertTriangle
} from "lucide-react";

export default function PortalDashboard() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTenant = async () => {
      if (!slug) return;
      
      try {
        const tenantConfig = await getTenantBySlug(slug);
        if (tenantConfig) {
          setConfig(tenantConfig);
          applyTheme(tenantConfig);
        }
      } catch (error) {
        console.error("Error loading tenant:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTenant();

    // Check 2FA status
    const has2fa = sessionStorage.getItem('has2fa');
    if (!has2fa) {
      navigate(`/t/${slug}/pre-home`);
    }
  }, [slug, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('has2fa');
    sessionStorage.removeItem('portalLoginData');
    navigate(`/t/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Portal não encontrado</h1>
          <p className="text-muted-foreground">O portal solicitado não existe ou não está disponível.</p>
        </div>
      </div>
    );
  }

  const totalDividas = dividas.reduce((sum, d) => sum + d.saldoAtual, 0);
  const totalAcordos = acordos.filter(a => a.status === "ativo").length;
  const totalFaturas = faturas.filter(f => f.status === "em aberto").length;
  const totalDescontoDisponivel = dividas.reduce((sum, d) => {
    const melhorOferta = d.ofertas.reduce((min, o) => o.valor < min.valor ? o : min, d.ofertas[0]);
    return sum + (d.saldoAtual - melhorOferta.valor);
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {config.tokens.logoUrl ? (
              <img 
                src={config.tokens.logoUrl} 
                alt={config.name}
                className="h-8 w-auto"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {config.name.charAt(0)}
                </span>
              </div>
            )}
            <span className="font-semibold text-lg">{config.name}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{customer.nome}</p>
              <p className="text-xs text-muted-foreground">{customer.cpf}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Menu</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  <Link 
                    to={`/t/${slug}/dashboard`}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium bg-primary/10 text-primary border-r-2 border-primary"
                  >
                    <Home className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link 
                    to={`/t/${slug}/dividas`}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Dívidas
                  </Link>
                  <Link 
                    to={`/t/${slug}/acordos`}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
                  >
                    <FileCheck className="w-4 h-4" />
                    Acordos
                  </Link>
                  <Link 
                    to={`/t/${slug}/faturas`}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    Faturas
                  </Link>
                  <Link 
                    to={`/t/${slug}/faq`}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                    FAQ
                  </Link>
                  <Link 
                    to={`/t/${slug}/perfil`}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Perfil
                  </Link>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            {/* Welcome */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Olá, {customer.nome.split(' ')[0]}! 👋</h1>
              <p className="text-muted-foreground">
                Bem-vindo ao seu portal de autoatendimento. Aqui você pode gerenciar todas as suas informações financeiras.
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total em Dívidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-red-500" />
                    <div>
                      <div className="text-2xl font-bold">R$ {totalDividas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      <p className="text-xs text-muted-foreground">
                        {dividas.length} débito{dividas.length !== 1 ? 's' : ''} em aberto
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Acordos Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold">{totalAcordos}</div>
                      <p className="text-xs text-muted-foreground">
                        acordo{totalAcordos !== 1 ? 's' : ''} em andamento
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Faturas Pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-orange-500" />
                    <div>
                      <div className="text-2xl font-bold">{totalFaturas}</div>
                      <p className="text-xs text-muted-foreground">
                        fatura{totalFaturas !== 1 ? 's' : ''} em aberto
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Economia Disponível</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold">R$ {totalDescontoDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      <p className="text-xs text-muted-foreground">
                        em descontos
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Latest Debts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Dívidas Recentes</span>
                    <Link to={`/t/${slug}/dividas`}>
                      <Button variant="ghost" size="sm">Ver todas</Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dividas.slice(0, 3).map((divida) => (
                    <div key={divida.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{divida.credor}</p>
                        <p className="text-sm text-muted-foreground">{divida.origem}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={divida.riscoAjuizamento === "alto" ? "destructive" : 
                                   divida.riscoAjuizamento === "médio" ? "default" : "secondary"}
                          >
                            {divida.riscoAjuizamento} risco
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">R$ {divida.saldoAtual.toFixed(2)}</p>
                        <p className="text-sm text-green-600">
                          -{divida.ofertas[0]?.desconto}% de desconto
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Agreements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Acordos Ativos</span>
                    <Link to={`/t/${slug}/acordos`}>
                      <Button variant="ghost" size="sm">Ver todos</Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {acordos.filter(a => a.status === "ativo").map((acordo) => (
                    <div key={acordo.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{acordo.contrato}</p>
                        <p className="text-sm text-muted-foreground">
                          {acordo.parcelas.filter(p => p.status === "pago").length} de {acordo.parcelas.length} pagas
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {acordo.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">R$ {acordo.total.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">total</p>
                      </div>
                    </div>
                  ))}
                  
                  {acordos.filter(a => a.quebrado).map((acordo) => (
                    <div key={acordo.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                      <div>
                        <p className="font-medium">{acordo.contrato}</p>
                        <p className="text-sm text-muted-foreground">Acordo quebrado</p>
                        <Badge variant="destructive" className="mt-1">
                          Renegociar
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">R$ {acordo.total.toFixed(2)}</p>
                        <AlertTriangle className="w-4 h-4 text-red-500 ml-auto" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>
                  Acesse rapidamente as funcionalidades mais utilizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link to={`/t/${slug}/dividas`} className="flex flex-col items-center gap-2">
                      <FileText className="w-6 h-6" />
                      <span>Negociar Dívidas</span>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link to={`/t/${slug}/faturas`} className="flex flex-col items-center gap-2">
                      <CreditCard className="w-6 h-6" />
                      <span>Emitir 2ª Via</span>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link to={`/t/${slug}/acordos`} className="flex flex-col items-center gap-2">
                      <FileCheck className="w-6 h-6" />
                      <span>Antecipar Parcelas</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}