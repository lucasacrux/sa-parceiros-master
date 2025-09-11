import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Zap, 
  CreditCard, 
  Search, 
  Database, 
  MessageSquare, 
  Mail,
  Settings,
  CheckCircle,
  AlertCircle,
  Plus
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const integrations = [
  {
    name: "ASAAS",
    description: "Gateway de pagamento brasileiro",
    icon: CreditCard,
    status: "configured",
    category: "Pagamentos",
  },
  {
    name: "SERASA",
    description: "Consultas e negativação",
    icon: Search,
    status: "pending",
    category: "Consultas",
  },
  {
    name: "BIGDATACORP",
    description: "Enriquecimento de dados",
    icon: Database,
    status: "not_configured",
    category: "Dados",
  },
  {
    name: "Z-API",
    description: "WhatsApp Business API",
    icon: MessageSquare,
    status: "configured",
    category: "Mensagens",
  },
  {
    name: "SENDGRID",
    description: "Envio de emails transacionais",
    icon: Mail,
    status: "not_configured",
    category: "Mensagens",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "configured":
      return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Configurado</Badge>;
    case "pending":
      return <Badge variant="warning" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />Pendente</Badge>;
    default:
      return <Badge variant="outline">Não configurado</Badge>;
  }
};

export default function Integracoes() {
  const [bdc, setBdc] = useState<{ token_id?: string; access_token?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load from backend (which reads Supabase service config)
    fetch('/api/integrations/bigdatacorp/')
      .then(r => r.json())
      .then(d => {
        const row = Array.isArray(d?.data) && d.data.length ? d.data[0] : null;
        if (row) setBdc({ token_id: row.token_id, access_token: row.access_token });
      })
      .catch(() => {});
  }, []);

  const saveBdc = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/integrations/bigdatacorp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_id: bdc?.token_id, access_token: bdc?.access_token })
      });
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrações</h1>
          <p className="text-muted-foreground mt-2">
            Configure integrações com serviços externos
          </p>
        </div>
        <Button variant="pill">
          <Plus className="h-4 w-4 mr-2" />
          Nova Integração
        </Button>
      </div>

      {/* Integration Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration, index) => (
          <Card 
            key={index} 
            variant={integration.status === "configured" ? "feature" : "elevated"}
            className="group cursor-pointer hover:shadow-brand-strong transition-all"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <integration.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <Badge variant="chip" className="text-xs mt-1">
                      {integration.category}
                    </Badge>
                  </div>
                </div>
                {getStatusBadge(integration.status)}
              </div>
              <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Button 
                  variant={integration.status === "configured" ? "outline" : "default"} 
                  size="sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {integration.status === "configured" ? "Configurar" : "Conectar"}
                </Button>
                {integration.status === "configured" && (
                  <Button variant="ghost" size="sm">
                    Testar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* BigDataCorp Configuration */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configuração BigDataCorp
          </CardTitle>
          <CardDescription>Defina suas credenciais para habilitar consultas de CNPJ/CPF e listar datasets.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveBdc} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bdc-token-id">Token ID</Label>
                <Input id="bdc-token-id" value={bdc?.token_id ?? ''} onChange={(e) => setBdc({ ...(bdc ?? {}), token_id: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bdc-access-token">Access Token</Label>
                <Input id="bdc-access-token" type="password" value={bdc?.access_token ?? ''} onChange={(e) => setBdc({ ...(bdc ?? {}), access_token: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="pill" disabled={saving}>{saving ? 'Salvando...' : 'Salvar & Conectar'}</Button>
              <Button type="button" variant="outline" onClick={async () => {
                // Quick test: call the CNPJ endpoint with a known doc (masked input not needed here)
                await fetch('/api/consultas/cnpj/', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ cnpjs: ['00000000000000'], datasets: ['lawsuits'] }) });
              }}>Testar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Configuration Example */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Configuração ASAAS
          </CardTitle>
          <CardDescription>
            Configure suas credenciais do gateway ASAAS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="asaas-api-key">API Key</Label>
              <Input
                id="asaas-api-key"
                placeholder="$aact_YTU5YjRlM2..."
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asaas-wallet">Wallet ID</Label>
              <Input
                id="asaas-wallet"
                placeholder="12345678"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              placeholder="https://seudominio.com/webhooks/asaas"
              value="https://api.saiuacordo.com.br/webhooks/asaas"
              readOnly
            />
          </div>
          <div className="flex gap-2">
            <Button variant="pill">
              Salvar Configuração
            </Button>
            <Button variant="outline">
              Testar Conexão
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
