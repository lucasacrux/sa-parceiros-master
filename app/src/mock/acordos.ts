import type { Acordo } from "@/types/portal";

export const acordos: Acordo[] = [
  {
    id: "ac1",
    contrato: "GERU-2023-001",
    data: "2025-07-24",
    status: "ativo",
    total: 2803.00,
    quebrado: false,
    parcelas: [
      { n: 1, valor: 560.60, vencimento: "2025-08-24", status: "pago" },
      { n: 2, valor: 560.60, vencimento: "2025-09-24", status: "em aberto" },
      { n: 3, valor: 560.60, vencimento: "2025-10-24", status: "futuro" },
      { n: 4, valor: 560.60, vencimento: "2025-11-24", status: "futuro" },
      { n: 5, valor: 560.60, vencimento: "2025-12-24", status: "futuro" },
    ]
  },
  {
    id: "ac2",
    contrato: "BMG-2021-777",
    data: "2025-01-14",
    status: "quebrado",
    total: 50.00,
    quebrado: true,
    parcelas: [
      { n: 1, valor: 10.00, vencimento: "2025-02-14", status: "pago" },
      { n: 2, valor: 10.00, vencimento: "2025-03-14", status: "não pago" },
    ]
  }
];