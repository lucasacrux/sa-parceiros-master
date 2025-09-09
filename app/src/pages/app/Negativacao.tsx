import { ComingSoonCard } from "@/components/ComingSoonCard";

export default function Negativacao() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Faça uma Negativação</h1>
        <p className="text-muted-foreground mt-2">
          Envie registros para os órgãos de proteção ao crédito
        </p>
      </div>

      <ComingSoonCard 
        title="Negativação"
        description="Funcionalidade para enviar registros para SERASA, SPC e outros órgãos de proteção ao crédito de forma automatizada."
      />
    </div>
  );
}