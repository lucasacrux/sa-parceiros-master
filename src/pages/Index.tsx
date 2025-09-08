import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Building, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import logoImage from "@/assets/logo-saiu-acordo.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-saiu-blue-50/30 to-saiu-blue-100/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="glass" className="mb-6 text-lg px-4 py-2">
              SaiuAcordo Business
            </Badge>
            <h1 className="text-5xl font-bold mb-6">
              Plataforma completa para{" "}
              <span className="text-white/90">negociação de dívidas</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Gerencie carteiras, crie portais white label, automatize cobrança e 
              ofereça a melhor experiência de negociação para seus clientes.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild size="xl" variant="glass">
                <Link to="/app">
                  Acessar Plataforma
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            Tudo que você precisa em uma plataforma
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Recursos avançados para otimizar sua operação de cobrança e melhorar 
            a experiência dos seus clientes.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card variant="feature" className="group">
            <CardHeader>
              <Building className="h-8 w-8 text-primary mb-4" />
              <CardTitle>Gestão de Carteiras</CardTitle>
              <CardDescription>
                Importe, organize e gerencie suas carteiras de cobrança 
                com ferramentas profissionais.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card variant="feature" className="group">
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-4" />
              <CardTitle>Portal White Label</CardTitle>
              <CardDescription>
                Crie portais personalizados para que seus clientes 
                negociem diretamente com sua marca.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card variant="feature" className="group">
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-4" />
              <CardTitle>Analytics Avançado</CardTitle>
              <CardDescription>
                Acompanhe métricas detalhadas, conversões e performance 
                em tempo real.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Entre na plataforma e configure sua primeira carteira ou portal 
            de autoatendimento em minutos.
          </p>
          <Button asChild size="xl" variant="hero">
            <Link to="/app">
              Acessar Plataforma
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
