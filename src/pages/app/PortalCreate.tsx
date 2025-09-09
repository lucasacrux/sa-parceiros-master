import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, 
  Palette, 
  Settings, 
  CreditCard, 
  Upload, 
  Check, 
  Eye,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  Mail,
  FileKey,
  Shield
} from "lucide-react";
import { upsertTenantAndConfig } from "@/lib/tenant";
import type { ThemeTokens, LoginMethods, PaymentMethods } from "@/types/portal";

const steps = [
  { id: 1, title: "Identidade da marca", icon: Palette },
  { id: 2, title: "Endereço do portal", icon: Globe },
  { id: 3, title: "Formas de entrada", icon: Shield },
  { id: 4, title: "Conversão & Pagamentos", icon: CreditCard },
];

// Default tokens for Acrux demo
const defaultTokens: ThemeTokens = {
  primary: "#1E40AF",
  secondary: "#3882F6", 
  bg: "#F8FAFC",
  fg: "#0F172A",
  muted: "#E2E8F0",
  radius: 14,
  fonts: {
    heading: "Poppins",
    body: "Inter"
  }
};

export default function PortalCreate() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    // Step 1 - Brand Identity
    companyName: "Acrux Securitizadora",
    websiteUrl: "",
    logoFile: null as File | null,
    primaryColor: defaultTokens.primary,
    secondaryColor: defaultTokens.secondary,
    fontFamily: "Poppins",
    portalType: "semi" as "semi" | "full",
    
    // Step 2 - Portal Address
    slug: "acrux",
    
    // Step 3 - Login Methods
    loginModes: ["cpf_otp", "contract"] as string[],
    whatsappEnabled: false,
    emailEnabled: true,
    smsEnabled: false,
    
    // Step 4 - Payments
    paymentMethods: ["pix", "cartao"] as string[],
    asaasEnabled: true,
  });

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreatePortal = async () => {
    setIsCreating(true);
    try {
      const tokens: ThemeTokens = {
        primary: formData.primaryColor,
        secondary: formData.secondaryColor,
        bg: defaultTokens.bg,
        fg: defaultTokens.fg,
        muted: defaultTokens.muted,
        radius: defaultTokens.radius,
        fonts: {
          heading: formData.fontFamily,
          body: "Inter"
        }
      };

      const loginMethods: LoginMethods = {
        cpfOtp: formData.loginModes.includes("cpf_otp"),
        contrato: formData.loginModes.includes("contract"),
        cupom: formData.loginModes.includes("coupon"),
        channels: {
          email: formData.emailEnabled,
          whatsapp: formData.whatsappEnabled,
          sms: formData.smsEnabled
        }
      };

      const payments: PaymentMethods = {
        boleto: formData.paymentMethods.includes("boleto"),
        pix: formData.paymentMethods.includes("pix"),
        cartao: formData.paymentMethods.includes("cartao"),
        provedor: "ASAAS"
      };

      await upsertTenantAndConfig({
        slug: formData.slug,
        name: formData.companyName,
        site_url: formData.websiteUrl,
        type: formData.portalType,
        tokens,
        login_methods: loginMethods,
        payments,
        logoFile: formData.logoFile
      });

      toast({
        title: "Portal criado com sucesso!",
        description: "Redirecionando para o preview...",
      });

      // Redirect to portal preview
      window.location.href = `/t/${formData.slug}`;
    } catch (error) {
      console.error("Erro ao criar portal:", error);
      toast({
        title: "Erro ao criar portal",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 2MB.",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Apenas imagens são permitidas.",
          variant: "destructive",
        });
        return;
      }

      setFormData(prev => ({ ...prev, logoFile: file }));
      toast({
        title: "Logo carregada!",
        description: "A logo foi carregada com sucesso.",
      });
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 2MB.",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Apenas imagens são permitidas.",
          variant: "destructive",
        });
        return;
      }

      setFormData(prev => ({ ...prev, logoFile: file }));
      toast({
        title: "Logo carregada!",
        description: "A logo foi carregada com sucesso.",
      });
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleLoginModeChange = (mode: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        loginModes: [...prev.loginModes, mode]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        loginModes: prev.loginModes.filter(m => m !== mode)
      }));
    }
  };

  const handlePaymentMethodChange = (method: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        paymentMethods: [...prev.paymentMethods, method]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        paymentMethods: prev.paymentMethods.filter(m => m !== method)
      }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Criar Portal de Autoatendimento</h1>
        <p className="text-muted-foreground mt-2">
          Configure um portal white label personalizado para seus clientes
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Progresso</span>
          <span className="text-sm text-muted-foreground">
            Etapa {currentStep} de {steps.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps Navigation */}
      <div className="grid grid-cols-4 gap-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              step.id === currentStep
                ? "border-primary bg-primary/5"
                : step.id < currentStep
                ? "border-green-200 bg-green-50"
                : "border-border bg-card"
            }`}
          >
            <div
              className={`rounded-lg p-2 ${
                step.id === currentStep
                  ? "bg-primary text-primary-foreground"
                  : step.id < currentStep
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.id < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium">{step.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="grid grid-cols-12 gap-8">
        {/* Form */}
        <div className="col-span-12 lg:col-span-8">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const StepIcon = steps[currentStep - 1].icon;
                  return <StepIcon className="h-5 w-5" />;
                })()}
                {steps[currentStep - 1].title}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && "Configure a identidade visual do seu portal"}
                {currentStep === 2 && "Defina o endereço e domínio do portal"}
                {currentStep === 3 && "Configure as formas de autenticação"}
                {currentStep === 4 && "Configure métodos de pagamento e conversão"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Brand Identity */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Nome da empresa</Label>
                      <Input
                        id="company-name"
                        placeholder="Sua Empresa Ltda"
                        value={formData.companyName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          companyName: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website-url">Site oficial</Label>
                      <Input
                        id="website-url"
                        placeholder="https://suaempresa.com.br"
                        value={formData.websiteUrl}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          websiteUrl: e.target.value
                        }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Logo da empresa</Label>
                    <div 
                      className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer relative overflow-hidden"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      {formData.logoFile ? (
                        <div className="space-y-2">
                          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden">
                            <img 
                              src={URL.createObjectURL(formData.logoFile)} 
                              alt="Logo preview"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <p className="text-sm font-medium">{formData.logoFile.name}</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => ({ ...prev, logoFile: null }));
                            }}
                          >
                            Remover
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Clique para fazer upload ou arraste aqui
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG, SVG até 2MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="primary-color">Cor primária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary-color"
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            primaryColor: e.target.value
                          }))}
                          className="w-16 h-10 p-1 border rounded-lg"
                        />
                        <Input
                          value={formData.primaryColor}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            primaryColor: e.target.value
                          }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondary-color">Cor secundária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondary-color"
                          type="color"
                          value={formData.secondaryColor}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            secondaryColor: e.target.value
                          }))}
                          className="w-16 h-10 p-1 border rounded-lg"
                        />
                        <Input
                          value={formData.secondaryColor}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            secondaryColor: e.target.value
                          }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="font">Fonte</Label>
                      <select
                        id="font"
                        value={formData.fontFamily}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          fontFamily: e.target.value
                        }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="Inter">Inter</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Open Sans">Open Sans</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de portal</Label>
                    <Tabs value={formData.portalType} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, portalType: value as "semi" | "full" }))
                    }>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="semi">Semi (Recomendado)</TabsTrigger>
                        <TabsTrigger value="full">Full White Label</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              )}

              {/* Step 2: Portal Address */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug do portal</Label>
                    <div className="flex">
                      <div className="bg-muted px-3 py-2 border border-r-0 rounded-l-md flex items-center text-sm text-muted-foreground">
                        /t/
                      </div>
                      <Input
                        id="slug"
                        placeholder="acrux"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                        }))}
                        className="rounded-l-none"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Seu portal ficará disponível em: /t/{formData.slug || "acrux"}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Login Methods */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Formas de identificação</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="cpf-otp"
                          checked={formData.loginModes.includes("cpf_otp")}
                          onCheckedChange={(checked) => 
                            handleLoginModeChange("cpf_otp", checked as boolean)
                          }
                        />
                        <Label htmlFor="cpf-otp" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          CPF + OTP (WhatsApp ou Email)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="contract"
                          checked={formData.loginModes.includes("contract")}
                          onCheckedChange={(checked) => 
                            handleLoginModeChange("contract", checked as boolean)
                          }
                        />
                        <Label htmlFor="contract" className="flex items-center gap-2">
                          <FileKey className="h-4 w-4" />
                          Número do contrato
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="coupon"
                          checked={formData.loginModes.includes("coupon")}
                          onCheckedChange={(checked) => 
                            handleLoginModeChange("coupon", checked as boolean)
                          }
                        />
                        <Label htmlFor="coupon" className="flex items-center gap-2">
                          <FileKey className="h-4 w-4" />
                          Cupom/Token (link mágico)
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Canais de comunicação</h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Card variant={formData.emailEnabled ? "feature" : "outline"}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Mail className="h-5 w-5" />
                            <Checkbox
                              checked={formData.emailEnabled}
                              onCheckedChange={(checked) => 
                                setFormData(prev => ({ ...prev, emailEnabled: checked as boolean }))
                              }
                            />
                          </div>
                          <h4 className="font-medium">Email</h4>
                          <p className="text-sm text-muted-foreground">
                            Envio de códigos por email
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card variant="outline">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                            <Badge variant="outline">Em breve</Badge>
                          </div>
                          <h4 className="font-medium text-muted-foreground">WhatsApp</h4>
                          <p className="text-sm text-muted-foreground">
                            Códigos via WhatsApp
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card variant="outline">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                            <Badge variant="outline">Em breve</Badge>
                          </div>
                          <h4 className="font-medium text-muted-foreground">SMS</h4>
                          <p className="text-sm text-muted-foreground">
                            Códigos via SMS
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Payments */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Métodos de pagamento</h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Card variant={formData.paymentMethods.includes("boleto") ? "feature" : "outline"}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <CreditCard className="h-5 w-5" />
                            <Checkbox
                              checked={formData.paymentMethods.includes("boleto")}
                              onCheckedChange={(checked) => 
                                handlePaymentMethodChange("boleto", checked as boolean)
                              }
                            />
                          </div>
                          <h4 className="font-medium">Boleto</h4>
                          <p className="text-sm text-muted-foreground">
                            Boleto bancário
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card variant={formData.paymentMethods.includes("pix") ? "feature" : "outline"}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <CreditCard className="h-5 w-5" />
                            <Checkbox
                              checked={formData.paymentMethods.includes("pix")}
                              onCheckedChange={(checked) => 
                                handlePaymentMethodChange("pix", checked as boolean)
                              }
                            />
                          </div>
                          <h4 className="font-medium">PIX</h4>
                          <p className="text-sm text-muted-foreground">
                            Pagamento instantâneo
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card variant={formData.paymentMethods.includes("cartao") ? "feature" : "outline"}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <CreditCard className="h-5 w-5" />
                            <Checkbox
                              checked={formData.paymentMethods.includes("cartao")}
                              onCheckedChange={(checked) => 
                                handlePaymentMethodChange("cartao", checked as boolean)
                              }
                            />
                          </div>
                          <h4 className="font-medium">Cartão</h4>
                          <p className="text-sm text-muted-foreground">
                            Cartão de crédito/débito
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Provedor de pagamentos</h3>
                    <Card variant="outline">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">ASAAS</h4>
                            <p className="text-sm text-muted-foreground">
                              Gateway de pagamentos integrado
                            </p>
                          </div>
                          <Badge variant="outline">Padrão</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="col-span-12 lg:col-span-4">
          <Card variant="outline" className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview do Portal
              </CardTitle>
              <CardDescription>
                Visualização em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div 
                  className="rounded-lg p-4 text-center"
                  style={{ backgroundColor: formData.primaryColor + '10', borderColor: formData.primaryColor + '30' }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <span className="text-white font-bold">
                      {formData.companyName.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-semibold" style={{ color: formData.primaryColor }}>
                    {formData.companyName || "Sua Empresa"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Portal de Autoatendimento
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Configurações:</div>
                  <div className="space-y-1 text-xs">
                    <div>Slug: /t/{formData.slug || "acrux"}</div>
                    <div>Tipo: {formData.portalType === "semi" ? "Semi" : "Full White Label"}</div>
                    <div>Login: {formData.loginModes.length} métodos</div>
                    <div>Pagamentos: {formData.paymentMethods.length} métodos</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        
        <div className="flex items-center gap-4">
          {currentStep < steps.length ? (
            <Button onClick={handleNext} className="flex items-center gap-2">
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleCreatePortal} 
              disabled={isCreating}
              className="flex items-center gap-2"
            >
              {isCreating ? "Criando..." : "Criar Portal"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}