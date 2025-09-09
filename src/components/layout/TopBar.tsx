import { Bell, User, Settings, LogOut, Moon, Sun, Crown, Shield, HelpCircle, FileText } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  // Mock user data - in real app this would come from auth context
  const user = {
    name: "Admin",
    email: "admin@democompany.com",
    role: "super_admin" // Could be: 'super_admin', 'admin', 'user'
  };

  const isAdmin = user.role === "super_admin" || user.role === "admin";

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNavigateToAdmin = (path: string) => {
    navigate(path);
  };

  if (!mounted) {
    return null;
  }

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="hover:bg-accent" />
          
          {/* Tenant Selector */}
          <div className="hidden md:flex items-center gap-2">
            <Badge variant="chip" className="bg-primary/10 text-primary">
              Demo Company
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Top Navigation Menu */}
          <div className="hidden md:flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/app/dashboard')}
              className="text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/app/integracoes')}
              className="text-muted-foreground hover:text-foreground"
            >
              Docs
            </Button>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <Badge 
              variant="pill" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-destructive text-destructive-foreground"
            >
              3
            </Badge>
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/app/general')}
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/avatars/01.png" alt="@usuario" />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                    AD
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  {isAdmin && (
                    <p className="text-xs leading-none text-yellow-600 font-medium">
                      Administrador
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Admin Section - Only for admins */}
              {isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => handleNavigateToAdmin('/app/admin')}>
                    <Crown className="mr-2 h-4 w-4" />
                    <span>Administrador</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                <span>Termos e Condições</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help Center</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}