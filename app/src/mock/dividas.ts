import type { Divida } from "@/types/portal";

export const dividas: Divida[] = [
  {
    id: "dv1",
    credor: "Open Co / Geru",
    origem: "Empréstimo pessoal",
    contrato: "GERU-2023-001",
    saldoAtual: 2893.00,
    vencimento: "2025-09-30",
    status: "em aberto",
    riscoAjuizamento: "médio",
    ofertas: [
      { 
        id: "of1", 
        tipo: "à vista", 
        valor: 1490.00, 
        desconto: 48, 
        observacao: "Oferta por tempo limitado" 
      },
      { 
        id: "of2", 
        tipo: "parcelado", 
        valor: 1890.00, 
        desconto: 35, 
        observacao: "Em até 6x" 
      }
    ]
  },
  {
    id: "dv2",
    credor: "Open Co / Rebel",
    origem: "Cartão",
    contrato: "REBEL-2022-009",
    saldoAtual: 923.45,
    vencimento: "2025-10-15",
    status: "em aberto",
    riscoAjuizamento: "baixo",
    ofertas: [
      { 
        id: "of3", 
        tipo: "à vista", 
        valor: 470.00, 
        desconto: 49, 
        observacao: "" 
      },
      { 
        id: "of4", 
        tipo: "parcelado", 
        valor: 650.00, 
        desconto: 30, 
        observacao: "3x sem juros (mock)" 
      }
    ]
  },
  {
    id: "dv3",
    credor: "BMG Lendico / Provu",
    origem: "Crédito pessoal",
    contrato: "BMG-2021-777",
    saldoAtual: 50.00,
    vencimento: "2025-09-28",
    status: "negociação disponível",
    riscoAjuizamento: "alto",
    ofertas: [
      { 
        id: "of5", 
        tipo: "à vista", 
        valor: 49.45, 
        desconto: 59, 
        observacao: "Exemplo inspirado na tela do acerto" 
      }
    ]
  }
];