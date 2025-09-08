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
import CarteirasCreate from "./pages/app/CarteirasCreate";
import Connect from "./pages/app/Connect";
import Negativacao from "./pages/app/Negativacao";
import Dossie from "./pages/app/Dossie";
import Clientes from "./pages/app/Clientes";
import Contratos from "./pages/app/Contratos";
import ConsultaCPF from "./pages/app/ConsultaCPF";
import Dashboards from "./pages/app/Dashboards";
import Integracoes from "./pages/app/Integracoes";

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
            <Route path="/app/portal" element={<AppLayout><PortalCreate /></AppLayout>} />
            <Route path="/app/carteiras/nova" element={<AppLayout><CarteirasCreate /></AppLayout>} />
            <Route path="/app/connect" element={<AppLayout><Connect /></AppLayout>} />
            <Route path="/app/negativacao" element={<AppLayout><Negativacao /></AppLayout>} />
            <Route path="/app/dossie" element={<AppLayout><Dossie /></AppLayout>} />
            <Route path="/app/clientes" element={<AppLayout><Clientes /></AppLayout>} />
            <Route path="/app/contratos" element={<AppLayout><Contratos /></AppLayout>} />
            <Route path="/app/consultas/cpf" element={<AppLayout><ConsultaCPF /></AppLayout>} />
            <Route path="/app/dashboards" element={<AppLayout><Dashboards /></AppLayout>} />
            <Route path="/app/integracoes" element={<AppLayout><Integracoes /></AppLayout>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
