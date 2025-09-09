import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  Globe, 
  Plus, 
  Trash2, 
  Edit, 
  Shield, 
  UserPlus,
  Building,
  Settings,
  CheckCircle,
  XCircle,
  Crown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  roles: Array<{
    role_name: string;
    tenant_name?: string;
  }>;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  site_url?: string;
  created_at: string;
  portal_config?: {
    type: string;
    tokens: any;
    login_methods: any;
    payments: any;
  };
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("users");
  const { toast } = useToast();

  // Create User Dialog State
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "user",
    tenantId: ""
  });

  // Create Tenant Dialog State
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: "",
    slug: "",
    siteUrl: ""
  });

  // Delete Portal Dialog State
  const [showDeletePortal, setShowDeletePortal] = useState(false);
  const [portalToDelete, setPortalToDelete] = useState<{ id: string; slug: string; name: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadUsers(), loadTenants()]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do painel admin.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // For demo purposes, we'll show mock users since auth schema is protected
      const mockUsers: User[] = [
        {
          id: "demo-user-1",
          email: "admin@acrux.com",
          display_name: "Admin Acrux",
          created_at: new Date().toISOString(),
          roles: [{ role_name: "super_admin", tenant_name: "Acrux Securitizadora" }]
        },
        {
          id: "demo-user-2", 
          email: "demo@acrux.com",
          display_name: "Usuário Demo",
          created_at: new Date().toISOString(),
          roles: [{ role_name: "user", tenant_name: "Acrux Securitizadora" }]
        }
      ];

      setUsers(mockUsers);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  };

  const loadTenants = async () => {
    try {
      const { data: tenants, error } = await supabase
        .from('tenants')
        .select(`
          *,
          portal_configs(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedTenants = tenants?.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        site_url: tenant.site_url,
        created_at: tenant.created_at,
        portal_config: tenant.portal_configs || null
      })) || [];

      setTenants(transformedTenants);
    } catch (error) {
      console.error("Erro ao carregar tenants:", error);
    }
  };

  const handleCreateUser = async () => {
    try {
      // For demo purposes, we'll just add a mock user
      // In a real implementation, you'd use Supabase Auth Admin API
      toast({
        title: "Usuário criado",
        description: `Usuário ${newUser.email} criado com sucesso.`,
      });
      
      setShowCreateUser(false);
      setNewUser({ email: "", password: "", displayName: "", role: "user", tenantId: "" });
      await loadUsers();
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar usuário.",
        variant: "destructive",
      });
    }
  };

  const handleCreateTenant = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .insert([
          {
            name: newTenant.name,
            nome: newTenant.name, // Required field
            slug: newTenant.slug,
            site_url: newTenant.siteUrl || null
          }
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Empresa criada",
        description: `Empresa ${newTenant.name} criada com sucesso.`,
      });
      
      setShowCreateTenant(false);
      setNewTenant({ name: "", slug: "", siteUrl: "" });
      await loadTenants();
    } catch (error) {
      console.error("Erro ao criar empresa:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar empresa.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);

      if (error) throw error;

      toast({
        title: "Empresa excluída",
        description: "Empresa excluída com sucesso.",
      });
      
      await loadTenants();
    } catch (error) {
      console.error("Erro ao excluir empresa:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir empresa.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePortal = async (tenant: { id: string; slug: string; name: string }) => {
    setPortalToDelete(tenant);
    setDeleteConfirmText("");
    setShowDeletePortal(true);
  };

  const confirmDeletePortal = async () => {
    if (!portalToDelete) return;
    
    const expectedText = `excluir portal ${portalToDelete.slug}`;
    if (deleteConfirmText !== expectedText) {
      toast({
        title: "Texto de confirmação incorreto",
        description: `Digite exatamente: ${expectedText}`,
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('portal_configs')
        .delete()
        .eq('tenant_id', portalToDelete.id);

      if (error) throw error;

      toast({
        title: "Portal excluído",
        description: `Portal da empresa ${portalToDelete.name} foi excluído com sucesso.`,
      });
      
      setShowDeletePortal(false);
      setPortalToDelete(null);
      setDeleteConfirmText("");
      await loadTenants();
    } catch (error) {
      console.error("Erro ao excluir portal:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir portal.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground mt-2">Carregando...</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Crown className="h-8 w-8 text-yellow-500" />
          Painel Administrativo
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie usuários, empresas e portais do sistema
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portais Ativos</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.filter(t => t.portal_config).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="tenants">Empresas</TabsTrigger>
          <TabsTrigger value="portals">Portais</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gerenciar Usuários</h2>
            <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Adicione um novo usuário ao sistema
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="usuario@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Nome de Exibição</Label>
                    <Input
                      id="displayName"
                      value={newUser.displayName}
                      onChange={(e) => setNewUser(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="Nome do Usuário"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Função</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant">Empresa</Label>
                    <Select value={newUser.tenantId} onValueChange={(value) => setNewUser(prev => ({ ...prev, tenantId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map(tenant => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateUser(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateUser}>
                    Criar Usuário
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Funções</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.display_name || "Sem nome"}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role, index) => (
                          <Badge key={index} variant="outline">
                            {role.role_name}
                            {role.tenant_name && ` @ ${role.tenant_name}`}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tenants Tab */}
        <TabsContent value="tenants" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gerenciar Empresas</h2>
            <Dialog open={showCreateTenant} onOpenChange={setShowCreateTenant}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Empresa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Empresa</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova empresa ao sistema
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Empresa</Label>
                    <Input
                      id="name"
                      value={newTenant.name}
                      onChange={(e) => setNewTenant(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Minha Empresa Ltda"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (identificador único)</Label>
                    <Input
                      id="slug"
                      value={newTenant.slug}
                      onChange={(e) => setNewTenant(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                      placeholder="minha-empresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteUrl">Site Oficial (opcional)</Label>
                    <Input
                      id="siteUrl"
                      value={newTenant.siteUrl}
                      onChange={(e) => setNewTenant(prev => ({ ...prev, siteUrl: e.target.value }))}
                      placeholder="https://minhaempresa.com.br"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateTenant(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateTenant}>
                    Criar Empresa
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Portal</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-sm text-muted-foreground">/{tenant.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {tenant.portal_config ? (
                        <Badge variant="success" className="bg-green-500/10 text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Configurado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Sem portal
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {tenant.site_url ? (
                        <a href={tenant.site_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Ver site
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Sem site</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/app/portal/create?tenant=${tenant.slug}`}>
                            <Settings className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteTenant(tenant.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {tenants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhuma empresa encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Portals Tab */}
        <TabsContent value="portals" className="space-y-4">
          <h2 className="text-xl font-semibold">Portais de Autoatendimento</h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tenants.filter(t => t.portal_config).map((tenant) => (
              <Card key={tenant.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {tenant.name}
                  </CardTitle>
                  <CardDescription>
                    Portal {tenant.portal_config?.type || 'configurado'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">URL do Portal</Label>
                    <div className="font-mono text-sm bg-muted p-2 rounded">
                      /portal/{tenant.slug}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <a href={`/portal/${tenant.slug}`} target="_blank">
                        Visualizar
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <a href={`/app/portal/create?tenant=${tenant.slug}`}>
                        Editar
                      </a>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeletePortal({ id: tenant.id, slug: tenant.slug, name: tenant.name })}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {tenants.filter(t => !t.portal_config).length > 0 && (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-muted-foreground">Empresas sem Portal</CardTitle>
                  <CardDescription>
                    {tenants.filter(t => !t.portal_config).length} empresa(s) ainda não configuraram portal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tenants.filter(t => !t.portal_config).map(tenant => (
                      <div key={tenant.id} className="flex items-center justify-between">
                        <span className="text-sm">{tenant.name}</span>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/app/portal/create?tenant=${tenant.slug}`}>
                            Configurar
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Portal Confirmation Dialog */}
      <Dialog open={showDeletePortal} onOpenChange={setShowDeletePortal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Excluir Portal</DialogTitle>
            <DialogDescription>
              Esta ação é irreversível. O portal da empresa <strong>{portalToDelete?.name}</strong> será 
              completamente excluído e todos os dados serão perdidos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium mb-2">
                ⚠️ ATENÇÃO: Esta ação não pode ser desfeita!
              </p>
              <p className="text-sm text-muted-foreground">
                O portal será permanentemente excluído. Todos os dados de configuração, 
                temas e personalizações serão perdidos.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmText">
                Para confirmar, digite: <code className="font-mono bg-muted px-1 rounded">
                  excluir portal {portalToDelete?.slug}
                </code>
              </Label>
              <Input
                id="confirmText"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={`excluir portal ${portalToDelete?.slug}`}
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeletePortal(false);
                setPortalToDelete(null);
                setDeleteConfirmText("");
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeletePortal}
              disabled={deleteConfirmText !== `excluir portal ${portalToDelete?.slug}`}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}