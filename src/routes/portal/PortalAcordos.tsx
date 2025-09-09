import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileCheck, Calendar, DollarSign, CreditCard, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TenantConfig } from "@/types/portal";
import { getTenantBySlug, applyTheme } from "@/lib/tenant";
import { customer, acordos } from "@/mock";
import { supabase } from "@/integrations/supabase/client";

const PortalAcordos = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTenant = async () => {
      if (!slug) return;
      
      try {
        const config = await getTenantBySlug(slug);
        if (config) {
          setTenantConfig(config);
          applyTheme(config);
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
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const is2faVerified = sessionStorage.getItem('2fa_verified') === 'true';
      
      if (!session || !is2faVerified) {
        navigate(`/t/${slug}/pre-home`);
      }
    };

    checkAuth();
  }, [slug, navigate]);

  const handleDownloadComprovante = (acordoId: string) => {
    toast({
      title: "Download iniciado",
      description: "O comprovante do acordo está sendo baixado.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge>;
      case "quebrado":
        return <Badge variant="destructive">Quebrado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getParcelaStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return <Badge variant="default" className="bg-green-100 text-green-800">Pago</Badge>;
      case "em aberto":
        return <Badge variant="outline" className="border-orange-300 text-orange-600">Em aberto</Badge>;
      case "futuro":
        return <Badge variant="secondary">Futuro</Badge>;
      case "não pago":
        return <Badge variant="destructive">Não pago</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(`/t/${slug}/dashboard`)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Meus Acordos</h1>
                <p className="text-muted-foreground">Acompanhe seus acordos e parcelas</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{customer.nome}</p>
              <p className="text-xs text-muted-foreground">{customer.cpf}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Acordos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{acordos.length}</div>
                <p className="text-xs text-muted-foreground">
                  {acordos.filter(a => a.status === "ativo").length} ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {acordos.reduce((sum, a) => sum + a.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Soma de todos os acordos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Parcelas Pagas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {acordos.reduce((sum, a) => sum + a.parcelas.filter(p => p.status === "pago").length, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  De {acordos.reduce((sum, a) => sum + a.parcelas.length, 0)} total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Agreements List */}
          <div className="space-y-6">
            {acordos.map((acordo) => (
              <Card key={acordo.id} className={acordo.quebrado ? "border-red-200 bg-red-50/30" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">Contrato {acordo.contrato}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Criado em {new Date(acordo.data).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(acordo.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadComprovante(acordo.id)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Comprovante
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Agreement Summary */}
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium">Valor Total do Acordo</p>
                          <p className="text-2xl font-bold text-green-600">
                            R$ {acordo.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Parcelas</p>
                        <p className="font-medium">{acordo.parcelas.length}x</p>
                      </div>
                    </div>

                    {/* Installments */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Parcelas do Acordo
                      </h4>
                      <div className="space-y-2">
                        {acordo.parcelas.map((parcela) => (
                          <div 
                            key={parcela.n} 
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <CreditCard className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">Parcela {parcela.n}</p>
                                <p className="text-sm text-muted-foreground">
                                  Vencimento: {new Date(parcela.vencimento).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="font-medium">
                                  R$ {parcela.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                              {getParcelaStatusBadge(parcela.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {acordos.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">Nenhum acordo encontrado</h3>
                <p className="text-sm text-muted-foreground">
                  Você ainda não possui acordos registrados em nosso sistema.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortalAcordos;