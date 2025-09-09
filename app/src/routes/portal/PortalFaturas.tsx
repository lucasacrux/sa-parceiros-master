import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getTenantBySlug, applyTheme } from "@/lib/tenant";
import { useToast } from "@/hooks/use-toast";
import type { TenantConfig } from "@/types/portal";
import { customer, faturas } from "@/mock";
import { 
  ArrowLeft, 
  CreditCard, 
  Download, 
  Copy,
  QrCode
} from "lucide-react";

export default function PortalFaturas() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFatura, setSelectedFatura] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("");

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

  const handleCopyBarcode = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    toast({
      title: "Código copiado!",
      description: "O código de barras foi copiado para a área de transferência.",
    });
  };

  const handleDownloadPDF = (faturaId: string) => {
    // Mock PDF generation
    toast({
      title: "Download iniciado",
      description: "Sua 2ª via está sendo gerada e será baixada em instantes.",
    });
  };

  const handlePayment = (method: string) => {
    toast({
      title: `Pagamento via ${method}`,
      description: "Redirecionando para a página de pagamento...",
    });
    setSelectedFatura(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando faturas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to={`/t/${slug}/dashboard`} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Link>
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <span className="font-semibold">Faturas</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{customer.nome}</p>
            <p className="text-xs text-muted-foreground">{customer.cpf}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Faturas em Aberto</h1>
          <p className="text-muted-foreground">
            Emita 2ª via ou realize o pagamento das suas faturas pendentes.
          </p>
        </div>

        <div className="space-y-6">
          {faturas.map((fatura) => (
            <Card key={fatura.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Parcela {fatura.parcela}</CardTitle>
                    <CardDescription>
                      Vencimento: {fatura.vencimento}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">R$ {fatura.valor.toFixed(2)}</p>
                    <Badge variant={fatura.status === "em aberto" ? "destructive" : "default"}>
                      {fatura.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Barcode */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <Label className="text-sm font-medium">Código de barras</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input 
                      value={fatura.codigoBarras} 
                      readOnly 
                      className="font-mono text-sm"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopyBarcode(fatura.codigoBarras)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => handleDownloadPDF(fatura.id)}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Baixar 2ª via (PDF)
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => setSelectedFatura(fatura)}
                        className="flex items-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Pagar agora
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Pagar Fatura</DialogTitle>
                        <DialogDescription>
                          Escolha a forma de pagamento para a parcela {fatura?.parcela}
                        </DialogDescription>
                      </DialogHeader>
                      
                      {fatura && (
                        <div className="space-y-6">
                          {/* Payment summary */}
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span>Valor da parcela</span>
                              <span className="text-xl font-bold">R$ {fatura.valor.toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Payment methods */}
                          <div className="space-y-3">
                            <h4 className="font-semibold">Formas de pagamento:</h4>
                            
                            {config?.payments.pix && (
                              <Card className="cursor-pointer hover:bg-accent transition-colors p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <QrCode className="w-6 h-6 text-primary" />
                                    <div>
                                      <p className="font-medium">PIX</p>
                                      <p className="text-sm text-muted-foreground">Pagamento instantâneo</p>
                                    </div>
                                  </div>
                                  <Button onClick={() => handlePayment("PIX")}>
                                    Pagar via PIX
                                  </Button>
                                </div>
                              </Card>
                            )}

                            {config?.payments.cartao && (
                              <Card className="cursor-pointer hover:bg-accent transition-colors p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <CreditCard className="w-6 h-6 text-primary" />
                                    <div>
                                      <p className="font-medium">Cartão de Crédito/Débito</p>
                                      <p className="text-sm text-muted-foreground">Visa, Mastercard, Elo</p>
                                    </div>
                                  </div>
                                  <Button onClick={() => handlePayment("Cartão")}>
                                    Pagar com cartão
                                  </Button>
                                </div>
                              </Card>
                            )}

                            {config?.payments.boleto && (
                              <Card className="cursor-pointer hover:bg-accent transition-colors p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <CreditCard className="w-6 h-6 text-primary" />
                                    <div>
                                      <p className="font-medium">Boleto Bancário</p>
                                      <p className="text-sm text-muted-foreground">Vencimento em 3 dias úteis</p>
                                    </div>
                                  </div>
                                  <Button onClick={() => handlePayment("Boleto")}>
                                    Gerar boleto
                                  </Button>
                                </div>
                              </Card>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedFatura(null)}>
                          Fechar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {faturas.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma fatura pendente</h3>
              <p className="text-muted-foreground">
                Você está em dia com seus pagamentos!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}