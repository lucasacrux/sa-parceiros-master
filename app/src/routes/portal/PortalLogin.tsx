import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTenantBySlug, applyTheme } from "@/lib/tenant";
import type { TenantConfig } from "@/types/portal";
import { Shield, FileKey, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function PortalLogin() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const intent = searchParams.get("intent");
  const token = searchParams.get("token");
  
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    cpf: "",
    contrato: "",
    cupom: "",
    email: "",
    celular: ""
  });

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

  useEffect(() => {
    // If there's a token in the URL, bypass 2FA (mock)
    if (token) {
      // Mock: simulate token validation and redirect to dashboard
      navigate(`/t/${slug}/dashboard`);
    }
  }, [token, slug, navigate]);

  const handleSubmit = () => {
    // Store form data in sessionStorage for the next step
    sessionStorage.setItem('portalLoginData', JSON.stringify({
      ...formData,
      intent,
      slug
    }));
    
    if (intent === "2via") {
      // For 2nd copy intent, go directly to pre-home then faturas
      navigate(`/t/${slug}/pre-home`);
    } else {
      navigate(`/t/${slug}/pre-home`);
    }
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

  // Determine available login methods
  const availableMethods = [];
  if (config.login_methods.cpfOtp) availableMethods.push("cpf");
  if (config.login_methods.contrato) availableMethods.push("contrato");
  if (config.login_methods.cupom) availableMethods.push("cupom");

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10">
      {/* Header */}
      <header className="p-4">
        <div className="container mx-auto">
          <Button variant="ghost" asChild>
            <Link to={`/t/${slug}`} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao início
            </Link>
          </Button>
        </div>
      </header>

      {/* Login Form */}
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
            <CardTitle>
              {intent === "2via" ? "Solicitar 2ª via" : "Entrar no portal"}
            </CardTitle>
            <CardDescription>
              {intent === "2via" 
                ? "Identifique-se para emitir uma segunda via"
                : "Identifique-se para acessar suas informações"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {availableMethods.length > 1 ? (
              <Tabs defaultValue={availableMethods[0]} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  {config.login_methods.cpfOtp && (
                    <TabsTrigger value="cpf" className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      CPF
                    </TabsTrigger>
                  )}
                  {config.login_methods.contrato && (
                    <TabsTrigger value="contrato" className="flex items-center gap-2">
                      <FileKey className="w-4 h-4" />
                      Contrato
                    </TabsTrigger>
                  )}
                  {config.login_methods.cupom && (
                    <TabsTrigger value="cupom" className="flex items-center gap-2">
                      <FileKey className="w-4 h-4" />
                      Cupom
                    </TabsTrigger>
                  )}
                </TabsList>
                
                {config.login_methods.cpfOtp && (
                  <TabsContent value="cpf" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                      />
                    </div>
                  </TabsContent>
                )}
                
                {config.login_methods.contrato && (
                  <TabsContent value="contrato" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contrato">Número do contrato</Label>
                      <Input
                        id="contrato"
                        placeholder="Digite o número do contrato"
                        value={formData.contrato}
                        onChange={(e) => setFormData(prev => ({ ...prev, contrato: e.target.value }))}
                      />
                    </div>
                  </TabsContent>
                )}
                
                {config.login_methods.cupom && (
                  <TabsContent value="cupom" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cupom">Cupom/Token</Label>
                      <Input
                        id="cupom"
                        placeholder="Digite o código do cupom"
                        value={formData.cupom}
                        onChange={(e) => setFormData(prev => ({ ...prev, cupom: e.target.value }))}
                      />
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            ) : (
              <div className="space-y-4">
                {config.login_methods.cpfOtp && (
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                    />
                  </div>
                )}
                
                {config.login_methods.contrato && (
                  <div className="space-y-2">
                    <Label htmlFor="contrato">Número do contrato</Label>
                    <Input
                      id="contrato"
                      placeholder="Digite o número do contrato"
                      value={formData.contrato}
                      onChange={(e) => setFormData(prev => ({ ...prev, contrato: e.target.value }))}
                    />
                  </div>
                )}
                
                {config.login_methods.cupom && (
                  <div className="space-y-2">
                    <Label htmlFor="cupom">Cupom/Token</Label>
                    <Input
                      id="cupom"
                      placeholder="Digite o código do cupom"
                      value={formData.cupom}
                      onChange={(e) => setFormData(prev => ({ ...prev, cupom: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Contact information for 2FA */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail para verificação</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="celular">Celular (opcional)</Label>
                <Input
                  id="celular"
                  placeholder="(11) 99999-9999"
                  value={formData.celular}
                  onChange={(e) => setFormData(prev => ({ ...prev, celular: e.target.value }))}
                />
              </div>
            </div>

            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              size="lg"
              disabled={!formData.email}
            >
              Continuar
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                Ao continuar, você concorda com nossos termos de uso e 
                confirma que possui autorização para acessar estas informações.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}