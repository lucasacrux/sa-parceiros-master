import type { Fatura } from "@/types/portal";

export const faturas: Fatura[] = [
  { 
    id: "fat1", 
    parcela: "2/5", 
    valor: 560.60, 
    vencimento: "2025-09-24", 
    status: "em aberto", 
    codigoBarras: "00190.00009 01234.567890 12345.678904 1 12340000056060" 
  },
  { 
    id: "fat2", 
    parcela: "1/1", 
    valor: 49.45, 
    vencimento: "2025-09-28", 
    status: "em aberto", 
    codigoBarras: "03399.12345 67890.123456 78901.234567 8 00000000004945" 
  },
];