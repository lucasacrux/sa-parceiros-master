export type ThemeTokens = {
  primary: string;
  secondary: string;
  bg: string;
  fg: string;
  muted: string;
  radius: number;
  fonts: {
    heading: string;
    body: string;
  };
  logoUrl?: string;
  faviconUrl?: string;
};

export type LoginMethods = {
  cpfOtp: boolean;
  contrato: boolean;
  cupom: boolean;
  channels: {
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
  };
};

export type PaymentMethods = {
  boleto: boolean;
  pix: boolean;
  cartao: boolean;
  provedor: string;
};

export type TenantConfig = {
  id: string;
  slug: string;
  name: string;
  site_url?: string;
  type: "semi" | "full";
  tokens: ThemeTokens;
  login_methods: LoginMethods;
  payments: PaymentMethods;
};

export type PortalUser = {
  nome: string;
  cpf: string;
  email: string;
  celular: string;
  has2fa?: boolean;
};

export type Divida = {
  id: string;
  credor: string;
  origem: string;
  contrato: string;
  saldoAtual: number;
  vencimento: string;
  status: string;
  riscoAjuizamento: "baixo" | "médio" | "alto";
  ofertas: Array<{
    id: string;
    tipo: "à vista" | "parcelado";
    valor: number;
    desconto: number;
    observacao: string;
  }>;
};

export type Acordo = {
  id: string;
  contrato: string;
  data: string;
  status: "ativo" | "quebrado";
  total: number;
  quebrado: boolean;
  parcelas: Array<{
    n: number;
    valor: number;
    vencimento: string;
    status: "pago" | "em aberto" | "futuro" | "não pago";
  }>;
};

export type Fatura = {
  id: string;
  parcela: string;
  valor: number;
  vencimento: string;
  status: string;
  codigoBarras: string;
};