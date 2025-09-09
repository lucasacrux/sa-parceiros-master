import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Edit, Globe, Palette, Shield, CreditCard, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTenantBySlug } from "@/lib/tenant";
import type { TenantConfig } from "@/types/portal";

export default function PortalManage() {
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPortalConfig();
  }, []);

  const loadPortalConfig = async () => {
    try {
      // For demo, loading Acrux portal
      const tenantConfig = await getTenantBySlug("acrux");
      setConfig(tenantConfig);
    } catch (error) {
      console.error("Erro ao carregar configuração do portal:", error);
      toast({
        title: "Erro ao carregar portal",
        description: "Não foi possível carregar as configurações do portal.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copiada!",
      description: "A URL do portal foi copiada para a área de transferência.",
    });
  };

  const handleOpenPortal = () => {
    if (config) {
      window.open(`/portal/${config.slug}`, '_blank');
    }
  };

  const handleEditPortal = () => {
    // Redirect to edit mode (reuse the creation form with existing data)
    window.location.href = "/app/portal/create";
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Meu Portal</h1>
          <p className="text-muted-foreground mt-2">Carregando configurações...</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-muted rounded-lg"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Meu Portal</h1>
          <p className="text-muted-foreground mt-2">Portal não encontrado</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Nenhum portal foi encontrado.</p>
            <Button onClick={() => window.location.href = "/app/portal/create"}>
              Criar Novo Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const portalUrl = `https://saiuacordo.com.br/${config.slug}`;
  const localUrl = `${window.location.origin}/portal/${config.slug}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Meu Portal</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seu portal de autoatendimento
        </p>
      </div>

      {/* Portal URL Card */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Portal de Autoatendimento
              </CardTitle>
              <CardDescription>
                Seu portal está ativo e disponível para seus clientes
              </CardDescription>
            </div>
            <Badge variant="success" className="bg-green-500/10 text-green-600 border-green-500/20">
              <Check className="h-3 w-3 mr-1" />
              Ativo
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Production URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">URL de Produção</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm">
                {portalUrl}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleCopyUrl(portalUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Local URL for testing */}
          <div className="space-y-2">
            <label className="text-sm font-medium">URL de Desenvolvimento</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm">
                {localUrl}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleCopyUrl(localUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button onClick={handleOpenPortal} className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Portal
            </Button>
            <Button variant="outline" onClick={handleEditPortal} className="flex-1">
              <Edit className="h-4 w-4 mr-2" />
              Editar Portal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Portal Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuration Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Configuração
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nome</span>
              <span className="text-sm font-medium">{config.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Slug</span>
              <span className="text-sm font-medium">{config.slug}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tipo</span>
              <Badge variant={config.type === "full" ? "default" : "secondary"}>
                {config.type === "full" ? "Full White Label" : "Semi"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cor Primária</span>
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: config.tokens.primary }}
                />
                <span className="text-sm font-mono">{config.tokens.primary}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Recursos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">Métodos de Login</span>
              <div className="flex flex-wrap gap-2">
                {config.login_methods.cpfOtp && (
                  <Badge variant="outline">CPF + OTP</Badge>
                )}
                {config.login_methods.contrato && (
                  <Badge variant="outline">Contrato</Badge>
                )}
                {config.login_methods.cupom && (
                  <Badge variant="outline">Cupom</Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <span className="text-sm font-medium">Canais de Comunicação</span>
              <div className="flex flex-wrap gap-2">
                {config.login_methods.channels.email && (
                  <Badge variant="outline">Email</Badge>
                )}
                {config.login_methods.channels.whatsapp && (
                  <Badge variant="outline">WhatsApp</Badge>
                )}
                {config.login_methods.channels.sms && (
                  <Badge variant="outline">SMS</Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Métodos de Pagamento</span>
              <div className="flex flex-wrap gap-2">
                {config.payments.pix && (
                  <Badge variant="outline">PIX</Badge>
                )}
                {config.payments.cartao && (
                  <Badge variant="outline">Cartão</Badge>
                )}
                {config.payments.boleto && (
                  <Badge variant="outline">Boleto</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}