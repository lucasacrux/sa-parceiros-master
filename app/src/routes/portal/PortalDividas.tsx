import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getTenantBySlug, applyTheme } from "@/lib/tenant";
import { useToast } from "@/hooks/use-toast";
import type { TenantConfig } from "@/types/portal";
import { customer, dividas } from "@/mock";
import { 
  ArrowLeft, 
  FileText, 
  CreditCard, 
  TrendingDown, 
  AlertTriangle,
  DollarSign,
  Calendar
} from "lucide-react";

export default function PortalDividas() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDivida, setSelectedDivida] = useState<any>(null);

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

  const handleNegociar = (oferta: any) => {
    toast({
      title: "Negociação iniciada!",
      description: `Oferta de R$ ${oferta.valor.toFixed(2)} selecionada. Em breve você receberá as instruções de pagamento.`,
    });
    setSelectedDivida(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dívidas...</p>
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
              <FileText className="w-5 h-5" />
              <span className="font-semibold">Minhas Dívidas</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{customer.nome}</p>
            <p className="text-xs text-muted-foreground">{customer.cpf}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total em Dívidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {dividas.reduce((sum, d) => sum + d.saldoAtual, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">{dividas.length} débitos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Maior Desconto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Math.max(...dividas.flatMap(d => d.ofertas.map(o => o.desconto)))}%
              </div>
              <p className="text-xs text-muted-foreground">economia disponível</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Risco Alto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {dividas.filter(d => d.riscoAjuizamento === "alto").length}
              </div>
              <p className="text-xs text-muted-foreground">débitos urgentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Debts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Dívidas em Aberto</CardTitle>
            <CardDescription>
              Clique em "Negociar" para ver as ofertas disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Credor</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Valor Atual</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Risco</TableHead>
                  <TableHead>Melhor Oferta</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dividas.map((divida) => {
                  const melhorOferta = divida.ofertas.reduce((min, o) => o.valor < min.valor ? o : min, divida.ofertas[0]);
                  return (
                    <TableRow key={divida.id}>
                      <TableCell className="font-medium">{divida.credor}</TableCell>
                      <TableCell>{divida.origem}</TableCell>
                      <TableCell>R$ {divida.saldoAtual.toFixed(2)}</TableCell>
                      <TableCell>{divida.vencimento}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={divida.riscoAjuizamento === "alto" ? "destructive" : 
                                 divida.riscoAjuizamento === "médio" ? "default" : "secondary"}
                        >
                          {divida.riscoAjuizamento}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-green-600">R$ {melhorOferta.valor.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{melhorOferta.desconto}% desconto</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedDivida(divida)}
                            >
                              Negociar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Negociar Dívida - {divida?.credor}</DialogTitle>
                              <DialogDescription>
                                Escolha a melhor condição para quitar sua dívida
                              </DialogDescription>
                            </DialogHeader>
                            
                            {divida && (
                              <div className="space-y-6">
                                {/* Debt info */}
                                <div className="p-4 bg-muted/50 rounded-lg">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Contrato</p>
                                      <p className="font-medium">{divida.contrato}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Valor original</p>
                                      <p className="font-medium">R$ {divida.saldoAtual.toFixed(2)}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Offers */}
                                <div className="space-y-3">
                                  <h4 className="font-semibold">Ofertas disponíveis:</h4>
                                  {divida.ofertas.map((oferta) => (
                                    <Card key={oferta.id} className="cursor-pointer hover:bg-accent transition-colors">
                                      <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div className="flex items-center gap-2 mb-1">
                                              <Badge variant={oferta.tipo === "à vista" ? "default" : "outline"}>
                                                {oferta.tipo}
                                              </Badge>
                                              <Badge variant="secondary">
                                                {oferta.desconto}% OFF
                                              </Badge>
                                            </div>
                                            <p className="text-2xl font-bold text-green-600">R$ {oferta.valor.toFixed(2)}</p>
                                            <p className="text-sm text-muted-foreground">{oferta.observacao}</p>
                                          </div>
                                          <Button onClick={() => handleNegociar(oferta)}>
                                            Escolher esta oferta
                                          </Button>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setSelectedDivida(null)}>
                                Fechar
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}