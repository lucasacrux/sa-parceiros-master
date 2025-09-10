import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppDashboard from "./pages/app/Dashboard";
import PortalCreate from "./pages/app/PortalCreate";
import PortalManage from "./pages/app/PortalManage";
import AdminPanel from "./pages/app/AdminPanel";
import AdminPortal from "./pages/app/AdminPortal";
import CarteirasCreate from "./pages/app/CarteirasCreate";
import Connect from "./pages/app/Connect";
import Negativacao from "./pages/app/Negativacao";
import Dossie from "./pages/app/Dossie";
import Clientes from "./pages/app/Clientes";
import Contratos from "./pages/app/Contratos";
import Consultas from "./pages/app/Consultas";
import Dashboards from "./pages/app/Dashboards";
import Integracoes from "./pages/app/Integracoes";

// Portal Routes
import PortalHome from "./routes/portal/PortalHome";
import PortalLogin from "./routes/portal/PortalLogin";
import PortalPreHome from "./routes/portal/PortalPreHome";
import PortalOTP from "./routes/portal/PortalOTP";
import PortalDashboard from "./routes/portal/PortalDashboard";
import PortalDividas from "./routes/portal/PortalDividas";
import PortalFaturas from "./routes/portal/PortalFaturas";
import PortalProfile from "./routes/portal/PortalProfile";
import PortalAcordos from "./routes/portal/PortalAcordos";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="saiu-acordo-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* App Routes */}
            <Route path="/app" element={<AppLayout><AppDashboard /></AppLayout>} />
            <Route path="/app/portal" element={<AppLayout><PortalManage /></AppLayout>} />
            <Route path="/app/portal/create" element={<AppLayout><PortalCreate /></AppLayout>} />
            <Route path="/app/carteiras/nova" element={<AppLayout><CarteirasCreate /></AppLayout>} />
            <Route path="/app/connect" element={<AppLayout><Connect /></AppLayout>} />
            <Route path="/app/negativacao" element={<AppLayout><Negativacao /></AppLayout>} />
            <Route path="/app/dossie" element={<AppLayout><Dossie /></AppLayout>} />
            <Route path="/app/clientes" element={<AppLayout><Clientes /></AppLayout>} />
            <Route path="/app/contratos" element={<AppLayout><Contratos /></AppLayout>} />
            <Route path="/app/consultas" element={<AppLayout><Consultas /></AppLayout>} />
            <Route path="/app/dashboards" element={<AppLayout><Dashboards /></AppLayout>} />
            <Route path="/app/integracoes" element={<AppLayout><Integracoes /></AppLayout>} />
            <Route path="/app/admin" element={<AppLayout><AdminPanel /></AppLayout>} />
            <Route path="/app/admin-portal" element={<AppLayout><AdminPortal /></AppLayout>} />
            
            {/* Portal Routes - /t/:slug paths (legacy) */}
            <Route path="/t/:slug" element={<PortalHome />} />
            <Route path="/t/:slug/login" element={<PortalLogin />} />
            <Route path="/t/:slug/pre-home" element={<PortalPreHome />} />
            <Route path="/t/:slug/otp" element={<PortalOTP />} />
            <Route path="/t/:slug/dashboard" element={<PortalDashboard />} />
            <Route path="/t/:slug/dividas" element={<PortalDividas />} />
            <Route path="/t/:slug/faturas" element={<PortalFaturas />} />
            <Route path="/t/:slug/acordos" element={<PortalAcordos />} />
            <Route path="/t/:slug/perfil" element={<PortalProfile />} />
            
            {/* Portal Routes - /portal/:slug paths */}
            <Route path="/portal/:slug" element={<PortalHome />} />
            <Route path="/portal/:slug/login" element={<PortalLogin />} />
            <Route path="/portal/:slug/pre-home" element={<PortalPreHome />} />
            <Route path="/portal/:slug/otp" element={<PortalOTP />} />
            <Route path="/portal/:slug/dashboard" element={<PortalDashboard />} />
            <Route path="/portal/:slug/dividas" element={<PortalDividas />} />
            <Route path="/portal/:slug/faturas" element={<PortalFaturas />} />
            <Route path="/portal/:slug/acordos" element={<PortalAcordos />} />
            <Route path="/portal/:slug/perfil" element={<PortalProfile />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
