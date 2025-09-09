import { ComingSoonCard } from "@/components/ComingSoonCard";

export default function Dossie() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dossiê do Cliente</h1>
        <p className="text-muted-foreground mt-2">
          Visão 360 graus do CPF/CNPJ
        </p>
      </div>

      <ComingSoonCard 
        title="Dossiê Completo"
        description="Funcionalidade para visualizar todas as informações de um cliente, histórico de pagamentos, score, dados cadastrais e muito mais."
      />
    </div>
  );
}