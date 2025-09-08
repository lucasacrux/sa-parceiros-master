import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  FolderPlus,
  Globe,
  MessageSquare,
  AlertTriangle,
  User,
  Users,
  FileText,
  Search,
  BarChart3,
  Settings,
  Building,
  Shield,
  CreditCard,
  ChevronDown,
  Briefcase,
  Zap,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import logoImage from "@/assets/logo-saiu-acordo.png";

const mainMenuItems = [
  { title: "Home", url: "/app", icon: Home },
  { title: "Criar carteira", url: "/app/carteiras/nova", icon: FolderPlus },
  { title: "Criar portal de autoatendimento", url: "/app/portal", icon: Globe },
  { title: "Connect mensagens", url: "/app/connect", icon: MessageSquare },
  { title: "Faça uma negativação", url: "/app/negativacao", icon: AlertTriangle },
  { title: "Dossiê do cliente", url: "/app/dossie", icon: User },
  { title: "Clientes", url: "/app/clientes", icon: Users },
  { title: "Contratos", url: "/app/contratos", icon: FileText },
  { title: "Consultar CPF", url: "/app/consultas/cpf", icon: Search },
  { title: "Dashboards", url: "/app/dashboards", icon: BarChart3 },
  { title: "Integrações", url: "/app/integracoes", icon: Zap },
];

const accountMenuItems = [
  { title: "Empresa", url: "/app/minha-conta/empresa", icon: Building },
  { title: "Administrador", url: "/app/minha-conta/administrador", icon: Shield },
  { title: "Usuários", url: "/app/minha-conta/usuarios", icon: Users },
  { title: "Planos", url: "/app/minha-conta/planos", icon: CreditCard },
  { title: "Faturamento", url: "/app/minha-conta/faturamento", icon: Briefcase },
  { title: "Segurança", url: "/app/minha-conta/seguranca", icon: Shield },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [accountOpen, setAccountOpen] = useState(
    accountMenuItems.some((item) => currentPath === item.url)
  );
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  return (
    <Sidebar className={collapsed ? "w-[72px]" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-sidebar">
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="SaiuAcordo" 
              className={`transition-all ${collapsed ? "h-8 w-8" : "h-8 w-auto"}`}
            />
            {!collapsed && (
              <div className="text-sidebar-foreground font-semibold text-lg">
                Business
              </div>
            )}
          </div>
        </div>

        {/* Main Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-xs font-semibold tracking-wider">
            {!collapsed && "Menu Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavClass}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account Menu */}
        <SidebarGroup>
          <Collapsible open={accountOpen} onOpenChange={setAccountOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-xs font-semibold tracking-wider cursor-pointer hover:text-sidebar-foreground flex items-center justify-between group">
                {!collapsed && (
                  <>
                    <span>Minha Conta</span>
                    <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                  </>
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {accountMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} end className={getNavClass}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}