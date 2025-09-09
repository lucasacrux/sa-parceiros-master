import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getTenantBySlug, applyTheme } from "@/lib/tenant";
import type { TenantConfig } from "@/types/portal";
import { ArrowLeft, User, Edit, Save, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function PortalProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Get user data from session storage (since we're using mock session)
  const [userData, setUserData] = useState({
    name: "Usuário Demo",
    email: "demo@acrux.com.br",
    cpf: "000.000.000-00",
    phone: "(11) 99999-9999"
  });

  const [editData, setEditData] = useState(userData);

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
    
    // Get user data from mock session
    const demoSession = JSON.parse(sessionStorage.getItem('demoSession') || '{}');
    if (demoSession.user?.email) {
      setUserData(prev => ({ ...prev, email: demoSession.user.email }));
      setEditData(prev => ({ ...prev, email: demoSession.user.email }));
    }
  }, [slug]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // For demo, just update local state
      setUserData(editData);
      setEditing(false);
      
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(userData);
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando portal...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Portal não encontrado</h1>
          <p className="text-muted-foreground">O portal solicitado não existe ou não está disponível.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link to={`/t/${slug}/dashboard`} className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao Dashboard
                </Link>
              </Button>
              
              {config.tokens.logoUrl ? (
                <img 
                  src={config.tokens.logoUrl} 
                  alt={config.name}
                  className="h-8 w-auto"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {config.name.charAt(0)}
                  </span>
                </div>
              )}
              
              <div>
                <h1 className="text-xl font-semibold">Meu Perfil</h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie suas informações pessoais
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Mantenha seus dados sempre atualizados
                  </CardDescription>
                </div>
              </div>
              
              {!editing && (
                <Button 
                  variant="outline" 
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                {editing ? (
                  <Input
                    id="name"
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                  />
                ) : (
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {userData.name}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                {editing ? (
                  <Input
                    id="email"
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      email: e.target.value
                    }))}
                  />
                ) : (
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {userData.email}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                {editing ? (
                  <Input
                    id="cpf"
                    value={editData.cpf}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      cpf: e.target.value
                    }))}
                  />
                ) : (
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {userData.cpf}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                {editing ? (
                  <Input
                    id="phone"
                    value={editData.phone}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      phone: e.target.value
                    }))}
                  />
                ) : (
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {userData.phone}
                  </div>
                )}
              </div>
            </div>

            {editing && (
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}