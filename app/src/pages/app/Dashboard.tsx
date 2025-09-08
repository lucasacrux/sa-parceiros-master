import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FolderPlus, 
  Globe, 
  MessageSquare, 
  BarChart3, 
  Users, 
  FileText,
  TrendingUp,
  DollarSign,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-dashboard.png";

const quickStats = [
  { label: "Carteiras Ativas", value: "12", icon: FolderPlus, trend: "+2 este mês" },
  { label: "Portais Criados", value: "3", icon: Globe, trend: "+1 esta semana" },
  { label: "Mensagens Enviadas", value: "1.2k", icon: MessageSquare, trend: "+45% este mês" },
  { label: "Taxa de Conversão", value: "8.5%", icon: TrendingUp, trend: "+1.2% vs anterior" },
];

const quickActions = [
  {
    title: "Criar carteira",
    description: "Configure uma nova carteira de cobrança",
    icon: FolderPlus,
    href: "/app/carteiras/nova",
    variant: "elevated" as const,
  },
  {
    title: "Criar portal de autoatendimento",
    description: "Configure um portal white label para seus clientes",
    icon: Globe,
    href: "/app/portal",
    variant: "feature" as const,
  },
  {
    title: "Connect mensagens",
    description: "Configure disparos e orquestração de mensagens",
    icon: MessageSquare,
    href: "/app/connect",
    variant: "elevated" as const,
  },
  {
    title: "Ver dashboards",
    description: "Analise performance e relatórios",
    icon: BarChart3,
    href: "/app/dashboards",
    variant: "elevated" as const,
  },
];

const recentActivity = [
  { 
    action: "Portal criado", 
    description: "Portal 'Cliente ABC' foi configurado", 
    time: "2 horas atrás",
    status: "success"
  },
  { 
    action: "Carteira processada", 
    description: "1.200 registros importados com sucesso", 
    time: "5 horas atrás",
    status: "success"
  },
  { 
    action: "Integração pendente", 
    description: "Configure suas credenciais ASAAS", 
    time: "1 dia atrás",
    status: "warning"
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-8 text-white">
        <div className="relative z-10">
          <div className="max-w-2xl">
            <Badge variant="glass" className="mb-4">
              SaiuAcordo Business
            </Badge>
            <h1 className="text-4xl font-bold mb-4">
              Bem-vindo à sua plataforma de negociação
            </h1>
            <p className="text-xl text-white/90 mb-6">
              Gerencie suas carteiras, crie portais personalizados e automatize sua cobrança de forma inteligente.
            </p>
            <div className="flex gap-4">
              <Button asChild size="lg" variant="glass">
                <Link to="/app/portal">
                  <Globe className="mr-2 h-5 w-5" />
                  Criar Portal
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Link to="/app/carteiras/nova">
                  <FolderPlus className="mr-2 h-5 w-5" />
                  Nova Carteira
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-20">
          <img 
            src={heroImage} 
            alt="Dashboard" 
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => (
          <Card key={index} variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs text-green-600">{stat.trend}</p>
                </div>
                <div className="rounded-lg bg-gradient-primary p-3">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Ações rápidas</h2>
            <p className="text-muted-foreground">Configure rapidamente novos recursos</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {quickActions.map((action, index) => (
              <Card key={index} variant={action.variant} className="group cursor-pointer">
                <Link to={action.href}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="rounded-lg bg-primary/10 p-2 w-fit">
                          <action.icon className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-semibold">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Atividade recente</h2>
            <p className="text-muted-foreground">Últimas atualizações</p>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 pb-4 last:pb-0 border-b last:border-0">
                    <div className="rounded-full p-1">
                      {activity.status === "success" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {activity.status === "warning" && (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                      {activity.status === "pending" && (
                        <Clock className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}