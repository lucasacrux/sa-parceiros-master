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
  Crown,
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
  { title: "Criar carteira", url: "/app/carteiras/nova", icon: FolderPlus, comingSoon: true },
  { title: "Connect mensagens", url: "/app/connect", icon: MessageSquare, comingSoon: true },
  { title: "Faça uma negativação", url: "/app/negativacao", icon: AlertTriangle, comingSoon: true },
  { title: "Dossiê do cliente", url: "/app/dossie", icon: User, comingSoon: true },
  { title: "Clientes", url: "/app/clientes", icon: Users, comingSoon: true },
  { title: "Contratos", url: "/app/contratos", icon: FileText, comingSoon: true },
  { title: "Consultar CPF", url: "/app/consultas/cpf", icon: Search, comingSoon: true },
  { title: "Dashboards", url: "/app/dashboards", icon: BarChart3, comingSoon: true },
  { title: "Integrações", url: "/app/integracoes", icon: Zap, comingSoon: true },
];

const portalMenuItems = [
  { title: "Gerenciar Portal", url: "/app/portal", icon: Globe },
  { title: "Admin Portal", url: "/app/admin-portal", icon: Crown },
];

const accountMenuItems = [
  { title: "Empresa", url: "/app/minha-conta/empresa", icon: Building, comingSoon: true },
  { title: "Administrador", url: "/app/minha-conta/administrador", icon: Shield, comingSoon: true },
  { title: "Usuários", url: "/app/minha-conta/usuarios", icon: Users, comingSoon: true },
  { title: "Planos", url: "/app/minha-conta/planos", icon: CreditCard, comingSoon: true },
  { title: "Faturamento", url: "/app/minha-conta/faturamento", icon: Briefcase, comingSoon: true },
  { title: "Segurança", url: "/app/minha-conta/seguranca", icon: Shield, comingSoon: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [accountOpen, setAccountOpen] = useState(
    accountMenuItems.some((item) => currentPath === item.url)
  );
  const [portalOpen, setPortalOpen] = useState(
    portalMenuItems.some((item) => currentPath === item.url)
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
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavClass}
                      onClick={(e) => {
                        if (item.comingSoon) {
                          e.preventDefault();
                          alert("🚧 Esta funcionalidade está sendo desenvolvida e estará disponível em breve!");
                        }
                      }}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && (
                        <span className="flex items-center gap-2">
                          {item.title}
                          {item.comingSoon && (
                            <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                              Em breve
                            </span>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Portal Menu */}
        <SidebarGroup>
          <Collapsible open={portalOpen} onOpenChange={setPortalOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-xs font-semibold tracking-wider cursor-pointer hover:text-sidebar-foreground flex items-center justify-between group">
                {!collapsed && (
                  <>
                    <span>Meu Portal</span>
                    <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                  </>
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {portalMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          end 
                          className={getNavClass}
                        >
                          <item.icon className="h-4 w-4" />
                          {!collapsed && (
                            <span className="flex items-center gap-2">
                              {item.title}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
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
                        <NavLink 
                          to={item.url} 
                          end 
                          className={getNavClass}
                          onClick={(e) => {
                            if (item.comingSoon) {
                              e.preventDefault();
                              alert("🚧 Esta funcionalidade está sendo desenvolvida e estará disponível em breve!");
                            }
                          }}
                        >
                          <item.icon className="h-4 w-4" />
                          {!collapsed && (
                            <span className="flex items-center gap-2">
                              {item.title}
                              {item.comingSoon && (
                                <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                                  Em breve
                                </span>
                              )}
                            </span>
                          )}
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