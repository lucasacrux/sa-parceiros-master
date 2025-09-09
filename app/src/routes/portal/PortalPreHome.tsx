import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTenantBySlug, applyTheme } from "@/lib/tenant";
import type { TenantConfig } from "@/types/portal";
import { dividas, acordos, faturas } from "@/mock";
import { Shield, CreditCard, FileText, TrendingUp, Unlock } from "lucide-react";
import { Link } from "react-router-dom";

export default function PortalPreHome() {
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
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando portal...</p>
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

  // Get login data from session storage
  const loginData = JSON.parse(sessionStorage.getItem('portalLoginData') || '{}');

  const totalDividas = dividas.reduce((sum, d) => sum + d.saldoAtual, 0);
  const totalAcordos = acordos.filter(a => a.status === "ativo").length;
  const totalFaturas = faturas.filter(f => f.status === "em aberto").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10">
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
          <Badge variant="outline">
            <Shield className="w-4 h-4 mr-1" />
            Verificação pendente
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Pronto, {loginData.email?.split('@')[0] || 'Cliente'}!</h1>
          <p className="text-muted-foreground">
            Aqui estão as informações encontradas para você.
          </p>
        </div>

        {/* Blurred Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Minhas Dívidas */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center">
                <Unlock className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Bloqueado</p>
              </div>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Minhas dívidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalDividas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">
                {dividas.length} débito{dividas.length !== 1 ? 's' : ''} em aberto
              </p>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {dividas.filter(d => d.riscoAjuizamento === "alto").length} de risco alto
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Meus Acordos */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center">
                <Unlock className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Bloqueado</p>
              </div>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Meus acordos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAcordos}</div>
              <p className="text-xs text-muted-foreground">
                {totalAcordos} acordo{totalAcordos !== 1 ? 's' : ''} ativo{totalAcordos !== 1 ? 's' : ''}
              </p>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {acordos.filter(a => a.quebrado).length} quebrado{acordos.filter(a => a.quebrado).length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Faturas em Aberto */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center">
                <Unlock className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Bloqueado</p>
              </div>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Faturas em aberto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFaturas}</div>
              <p className="text-xs text-muted-foreground">
                {totalFaturas} fatura{totalFaturas !== 1 ? 's' : ''} pendente{totalFaturas !== 1 ? 's' : ''}
              </p>
              <div className="mt-2">
                <Badge variant="destructive" className="text-xs">
                  Vencimento próximo
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Score/Serasa */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center">
                <Unlock className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Bloqueado</p>
              </div>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Score de crédito</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">?</div>
              <p className="text-xs text-muted-foreground">
                Consulte seu CPF e score
              </p>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  Em breve
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Negotiation Options */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Negociações disponíveis:</h2>
          <div className="grid gap-4">
            {dividas.slice(0, 2).map((divida) => (
              <Card key={divida.id} className="relative overflow-hidden">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10" />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{divida.credor}</h3>
                      <p className="text-sm text-muted-foreground">{divida.origem}</p>
                      <p className="text-xs text-muted-foreground">Venceu em {divida.vencimento}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Valor atualizado: R$ {divida.saldoAtual.toFixed(2)}</p>
                      <p className="text-lg font-bold">
                        À vista: R$ {divida.ofertas[0]?.valor.toFixed(2)}
                      </p>
                      <Badge variant="secondary">
                        {divida.ofertas[0]?.desconto}% de desconto
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="text-center p-8 bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent>
            <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              Você tem ofertas liberadas te esperando
            </h2>
            <p className="text-muted-foreground mb-6">
              Para sua segurança, precisamos confirmar sua identidade antes de liberar o acesso completo.
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-3">
              <Link to={`/t/${slug}/otp`}>
                <Unlock className="w-5 h-5 mr-2" />
                Desbloquear com código
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Enviaremos um código de verificação por {config.login_methods.channels.email && "e-mail"}
              {config.login_methods.channels.whatsapp && config.login_methods.channels.email && " ou "}
              {config.login_methods.channels.whatsapp && "WhatsApp"}
            </p>
          </CardContent>
        </Card>

        {/* Notice */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Se uma nova dívida entrar em nosso sistema, enviaremos um alerta via
            e-mail ou SMS sobre os débitos em aberto.
          </p>
        </div>
      </div>
    </div>
  );
}