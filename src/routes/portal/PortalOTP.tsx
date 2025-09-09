import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getTenantBySlug, applyTheme } from "@/lib/tenant";
import { supabase } from "@/integrations/supabase/client";
import type { TenantConfig } from "@/types/portal";
import { Shield, Mail, Smartphone, ArrowLeft, Check } from "lucide-react";
import { Link } from "react-router-dom";

export default function PortalOTP() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");

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
    
    // Get email from session storage
    const loginData = JSON.parse(sessionStorage.getItem('portalLoginData') || '{}');
    if (loginData.email) {
      setEmail(loginData.email);
    }
  }, [slug]);

  const handleSendCode = async () => {
    if (!email) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, informe seu email para receber o código.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    
    // Para demo, simular envio de código sem chamar Supabase
    setTimeout(() => {
      setCodeSent(true);
      toast({
        title: "Código enviado! (Demo)",
        description: "Use qualquer código de 6 dígitos para continuar.",
      });
      setSending(false);
    }, 1000);
  };

  const handleVerifyCode = async () => {
    if (!otp || otp.length < 6) {
      toast({
        title: "Código inválido",
        description: "Por favor, digite o código de 6 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setVerifying(true);
    
    // Para demo, aceitar qualquer código de 6 dígitos
    setTimeout(() => {
      // Store 2FA status in session
      sessionStorage.setItem('has2fa', 'true');
      
      // Store mock user session for demo
      sessionStorage.setItem('demoSession', JSON.stringify({
        user: { email, id: 'demo-user-id' },
        authenticated: true
      }));

      toast({
        title: "Verificação concluída! (Demo)",
        description: "Redirecionando para o dashboard...",
      });

      // Check if intent was 2via
      const loginData = JSON.parse(sessionStorage.getItem('portalLoginData') || '{}');
      if (loginData.intent === "2via") {
        setTimeout(() => navigate(`/t/${slug}/faturas`), 1000);
      } else {
        setTimeout(() => navigate(`/t/${slug}/dashboard`), 1000);
      }
      
      setVerifying(false);
    }, 1000);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10">
      {/* Header */}
      <header className="p-4">
        <div className="container mx-auto">
          <Button variant="ghost" asChild>
            <Link to={`/t/${slug}/pre-home`} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
          </Button>
        </div>
      </header>

      {/* Verification Form */}
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader className="text-center">
            {config.tokens.logoUrl ? (
              <img 
                src={config.tokens.logoUrl} 
                alt={config.name}
                className="h-12 w-auto mx-auto mb-4"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">
                  {config.name.charAt(0)}
                </span>
              </div>
            )}
            <CardTitle>Verificação de segurança</CardTitle>
            <CardDescription>
              Para sua proteção, confirme sua identidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!codeSent ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail para verificação</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Escolha como receber o código:</h3>
                  
                  {config.login_methods.channels.email && (
                    <Card className="p-4 cursor-pointer hover:bg-accent transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">E-mail</p>
                          <p className="text-sm text-muted-foreground">
                            Envio rápido e seguro
                          </p>
                        </div>
                        <Check className="w-5 h-5 text-primary" />
                      </div>
                    </Card>
                  )}

                  {config.login_methods.channels.whatsapp && (
                    <Card className="p-4 opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-muted-foreground">WhatsApp</p>
                          <p className="text-sm text-muted-foreground">
                            Via mensagem instantânea
                          </p>
                        </div>
                        <Badge variant="outline">Em breve</Badge>
                      </div>
                    </Card>
                  )}

                  {config.login_methods.channels.sms && (
                    <Card className="p-4 opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-muted-foreground">SMS</p>
                          <p className="text-sm text-muted-foreground">
                            Mensagem de texto
                          </p>
                        </div>
                        <Badge variant="outline">Em breve</Badge>
                      </div>
                    </Card>
                  )}
                </div>

                <Button 
                  onClick={handleSendCode} 
                  className="w-full" 
                  size="lg"
                  disabled={sending || !email}
                >
                  {sending ? "Enviando..." : "Enviar código"}
                </Button>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Código enviado!</h3>
                  <p className="text-sm text-muted-foreground">
                    Enviamos um código de 6 dígitos para <strong>{email}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Código de verificação</Label>
                  <Input
                    id="otp"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-xl tracking-widest"
                    maxLength={6}
                  />
                   <p className="text-xs text-muted-foreground">
                     <strong>Demo:</strong> Digite qualquer código de 6 dígitos (ex: 123456)
                   </p>
                </div>

                <Button 
                  onClick={handleVerifyCode} 
                  className="w-full" 
                  size="lg"
                  disabled={verifying || otp.length < 6}
                >
                  {verifying ? "Verificando..." : "Verificar código"}
                </Button>

                <div className="text-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setCodeSent(false);
                      setOtp("");
                    }}
                    className="text-sm"
                  >
                    Não recebeu? Enviar novamente
                  </Button>
                </div>
              </>
            )}

            <div className="text-center text-sm text-muted-foreground">
              <p>
                O código é válido por 10 minutos e só pode ser usado uma vez.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}