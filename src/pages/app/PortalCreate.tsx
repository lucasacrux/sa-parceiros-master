import { useState } from "react";
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

const steps = [
  { id: 1, title: "Identidade da marca", icon: Palette },
  { id: 2, title: "Endereço do portal", icon: Globe },
  { id: 3, title: "Formas de entrada", icon: Shield },
  { id: 4, title: "Conversão & Pagamentos", icon: CreditCard },
];

export default function PortalCreate() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    companyName: "",
    websiteUrl: "",
    logoFile: null as File | null,
    primaryColor: "#3B82F6",
    secondaryColor: "#1E40AF",
    fontFamily: "Inter",
    
    // Step 2
    subdomain: "",
    customDomain: "",
    portalType: "subdomain",
    
    // Step 3
    loginModes: [] as string[],
    whatsappEnabled: false,
    emailEnabled: false,
    smsEnabled: false,
    
    // Step 4
    paymentMethods: [] as string[],
    asaasEnabled: false,
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
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Clique para fazer upload ou arraste aqui
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, SVG até 2MB
                      </p>
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
                </div>
              )}

              {/* Step 2: Portal Address */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <Tabs value={formData.portalType} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, portalType: value }))
                  }>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="subdomain">Subdomínio</TabsTrigger>
                      <TabsTrigger value="custom">Domínio personalizado</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="subdomain" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="subdomain">Subdomínio</Label>
                        <div className="flex">
                          <Input
                            id="subdomain"
                            placeholder="suaempresa"
                            value={formData.subdomain}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              subdomain: e.target.value
                            }))}
                            className="rounded-r-none"
                          />
                          <div className="bg-muted px-3 py-2 border border-l-0 rounded-r-md flex items-center text-sm text-muted-foreground">
                            .saiuacordo.com.br
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Seu portal ficará disponível em: {formData.subdomain || "suaempresa"}.saiuacordo.com.br
                        </p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="custom" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="custom-domain">Domínio personalizado</Label>
                        <Input
                          id="custom-domain"
                          placeholder="portal.suaempresa.com.br"
                          value={formData.customDomain}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            customDomain: e.target.value
                          }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Você precisará configurar os registros DNS do seu domínio
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
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
                      <Card variant={formData.whatsappEnabled ? "feature" : "outline"}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Smartphone className="h-5 w-5" />
                            <Checkbox
                              checked={formData.whatsappEnabled}
                              onCheckedChange={(checked) => 
                                setFormData(prev => ({ ...prev, whatsappEnabled: checked as boolean }))
                              }
                            />
                          </div>
                          <h4 className="font-medium">WhatsApp</h4>
                          <p className="text-xs text-muted-foreground">OTP via WhatsApp</p>
                        </CardContent>
                      </Card>
                      
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
                          <p className="text-xs text-muted-foreground">OTP via email</p>
                        </CardContent>
                      </Card>
                      
                      <Card variant={formData.smsEnabled ? "feature" : "outline"}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Smartphone className="h-5 w-5" />
                            <Checkbox
                              checked={formData.smsEnabled}
                              onCheckedChange={(checked) => 
                                setFormData(prev => ({ ...prev, smsEnabled: checked as boolean }))
                              }
                            />
                          </div>
                          <h4 className="font-medium">SMS</h4>
                          <p className="text-xs text-muted-foreground">OTP via SMS</p>
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
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="boleto"
                          checked={formData.paymentMethods.includes("boleto")}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                paymentMethods: [...prev.paymentMethods, "boleto"]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                paymentMethods: prev.paymentMethods.filter(m => m !== "boleto")
                              }));
                            }
                          }}
                        />
                        <Label htmlFor="boleto">Boleto bancário</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="pix"
                          checked={formData.paymentMethods.includes("pix")}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                paymentMethods: [...prev.paymentMethods, "pix"]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                paymentMethods: prev.paymentMethods.filter(m => m !== "pix")
                              }));
                            }
                          }}
                        />
                        <Label htmlFor="pix">PIX</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="cartao"
                          checked={formData.paymentMethods.includes("cartao")}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                paymentMethods: [...prev.paymentMethods, "cartao"]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                paymentMethods: prev.paymentMethods.filter(m => m !== "cartao")
                              }));
                            }
                          }}
                        />
                        <Label htmlFor="cartao">Cartão de crédito/débito</Label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Integração de pagamentos</h3>
                    <Card variant={formData.asaasEnabled ? "feature" : "outline"}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">ASAAS</h4>
                            <p className="text-sm text-muted-foreground">
                              Gateway de pagamento brasileiro
                            </p>
                          </div>
                          <Checkbox
                            checked={formData.asaasEnabled}
                            onCheckedChange={(checked) => 
                              setFormData(prev => ({ ...prev, asaasEnabled: checked as boolean }))
                            }
                          />
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
          <Card variant="glass" className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview
              </CardTitle>
              <CardDescription>
                Visualize como ficará seu portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div 
                  className="rounded-lg border p-4 min-h-[200px] bg-gradient-to-br"
                  style={{
                    background: `linear-gradient(135deg, ${formData.primaryColor}20, ${formData.secondaryColor}10)`
                  }}
                >
                  <div className="text-center space-y-3">
                    <div 
                      className="w-12 h-12 rounded-lg mx-auto flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      {formData.companyName ? formData.companyName.charAt(0).toUpperCase() : "L"}
                    </div>
                    <h3 className="font-semibold" style={{ fontFamily: formData.fontFamily }}>
                      {formData.companyName || "Sua Empresa"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Portal de Autoatendimento
                    </p>
                    {currentStep >= 2 && (
                      <Badge variant="pill" className="text-xs">
                        {formData.portalType === "subdomain" 
                          ? `${formData.subdomain || "empresa"}.saiuacordo.com.br`
                          : formData.customDomain || "portal.suaempresa.com.br"
                        }
                      </Badge>
                    )}
                  </div>
                </div>
                
                {currentStep >= 3 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Formas de acesso:</h4>
                    <div className="space-y-1">
                      {formData.loginModes.map((mode) => (
                        <Badge key={mode} variant="chip" className="text-xs mr-1">
                          {mode === "cpf_otp" && "CPF + OTP"}
                          {mode === "contract" && "Contrato"}
                          {mode === "coupon" && "Cupom"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {currentStep >= 4 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Pagamentos:</h4>
                    <div className="space-y-1">
                      {formData.paymentMethods.map((method) => (
                        <Badge key={method} variant="chip" className="text-xs mr-1">
                          {method === "boleto" && "Boleto"}
                          {method === "pix" && "PIX"}
                          {method === "cartao" && "Cartão"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        {currentStep < steps.length ? (
          <Button onClick={handleNext} variant="pill">
            Próximo
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button variant="hero" size="lg">
            Criar Portal
            <Check className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}