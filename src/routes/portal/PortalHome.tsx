import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTenantBySlug, applyTheme } from "@/lib/tenant";
import type { TenantConfig } from "@/types/portal";
import { Shield, CreditCard, FileText, CheckCircle, Phone, Mail } from "lucide-react";

export default function PortalHome() {
  const { slug } = useParams();
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

  return (
    <div className="min-h-screen">
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
          <nav className="hidden md:flex items-center gap-6">
            <Link to={`/t/${slug}`} className="text-sm font-medium text-primary">Início</Link>
            <Link to={`/t/${slug}/login`} className="text-sm hover:text-foreground">Minhas dívidas</Link>
            <Link to={`/t/${slug}/login`} className="text-sm hover:text-foreground">Meus acordos</Link>
            <Link to={`/t/${slug}/login`} className="text-sm hover:text-foreground">Crédito</Link>
            <Link to={`/t/${slug}/login`} className="text-sm hover:text-foreground">Score e CPF</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            {config.tokens.logoUrl ? (
              <img 
                src={config.tokens.logoUrl} 
                alt={config.name}
                className="h-16 w-auto mx-auto mb-6"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {config.name.charAt(0)}
                </span>
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Olá, bem-vindo(a)!
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Temos propostas especiais para você! Negocie suas dívidas de forma rápida e segura.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Button asChild size="lg" className="flex-1">
              <Link to={`/t/${slug}/login`}>
                <Shield className="w-5 h-5 mr-2" />
                Entrar
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex-1">
              <Link to={`/t/${slug}/login?intent=2via`}>
                <FileText className="w-5 h-5 mr-2" />
                Solicitar 2ª via
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Como funciona</h2>
            <p className="text-muted-foreground text-lg">
              Processo simples e seguro em 3 passos
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>1. Identifique-se</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  {config.login_methods.cpfOtp && "Use seu CPF"}
                  {config.login_methods.contrato && config.login_methods.cpfOtp && " ou "}
                  {config.login_methods.contrato && "número do contrato"}
                  {config.login_methods.cupom && " ou link mágico"}
                  {" "}para acessar suas informações com segurança.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>2. Consulte suas dívidas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Veja todas as suas pendências, valores atualizados e ofertas exclusivas de negociação.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>3. Negocie e quite</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Escolha a melhor condição e realize o pagamento 
                  {config.payments.pix && " via PIX"}
                  {config.payments.cartao && config.payments.pix && ", "}
                  {config.payments.cartao && "cartão"}
                  {config.payments.boleto && " ou boleto"}.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What you can do */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">O que você pode fazer</h2>
            <p className="text-muted-foreground text-lg">
              Todas as funcionalidades em um só lugar
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <FileText className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Ver suas dívidas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Consulte todas as suas pendências com valores atualizados e detalhes completos.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CreditCard className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Renegociar débitos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Acesse ofertas exclusivas com descontos especiais para quitar suas dívidas.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CheckCircle className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Antecipar parcelas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Antecipe parcelas dos seus acordos e obtenha condições ainda melhores.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <FileText className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Emitir 2ª via</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Gere boletos e comprovantes sempre que precisar, de forma rápida e prática.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow opacity-60">
              <CardHeader>
                <Shield className="w-8 h-8 text-muted-foreground mb-2" />
                <CardTitle className="text-lg text-muted-foreground">
                  Consultar CPF/Score
                  <Badge variant="outline" className="ml-2">Em breve</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Verifique seu score de crédito e situação no CPF gratuitamente.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CreditCard className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Pagar online</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Realize pagamentos de forma segura 
                  {config.payments.pix && " via PIX"}
                  {config.payments.cartao && config.payments.pix && " ou "}
                  {config.payments.cartao && "cartão"}.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Perguntas frequentes</h2>
            <p className="text-muted-foreground text-lg">
              Tire suas dúvidas sobre o portal
            </p>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como faço para acessar minhas informações?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Você pode acessar usando seu CPF{config.login_methods.contrato && ", número do contrato"}
                  {config.login_methods.cupom && " ou link mágico enviado por email"}. 
                  Para sua segurança, enviamos um código de verificação por {config.login_methods.channels.email && "email"}.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Os pagamentos são seguros?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sim, utilizamos criptografia de ponta e parceiros certificados para garantir a segurança de todas as transações.
                  Seus dados estão sempre protegidos.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Posso parcelar meu acordo?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sim, oferecemos diferentes opções de parcelamento para que você encontre a condição que melhor se adapta ao seu orçamento.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
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
                <span className="font-semibold">{config.name}</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Portal de autoatendimento para negociação de dívidas e gestão financeira.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Contato</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>Em breve</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>contato@{config.site_url?.replace(/https?:\/\//, '') || 'empresa.com.br'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Links úteis</h3>
              <div className="space-y-2 text-sm">
                <Link to={`/t/${slug}/login`} className="block text-muted-foreground hover:text-foreground">
                  Acessar portal
                </Link>
                <Link to={`/t/${slug}/faq`} className="block text-muted-foreground hover:text-foreground">
                  Perguntas frequentes
                </Link>
                {config.site_url && (
                  <a 
                    href={config.site_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block text-muted-foreground hover:text-foreground"
                  >
                    Site oficial
                  </a>
                )}
              </div>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 {config.name}. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}