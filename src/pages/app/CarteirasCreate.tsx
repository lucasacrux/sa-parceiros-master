import { ComingSoonCard } from "@/components/ComingSoonCard";

export default function CarteirasCreate() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Criar Nova Carteira</h1>
        <p className="text-muted-foreground mt-2">
          Configure uma nova carteira de cobrança
        </p>
      </div>

      <ComingSoonCard 
        title="Criação de Carteiras"
        description="Funcionalidade para configurar novas carteiras de cobrança com upload de arquivos, configuração de campos e regras de negócio."
      />
    </div>
  );
}