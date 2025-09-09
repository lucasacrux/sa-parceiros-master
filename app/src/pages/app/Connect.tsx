import { ComingSoonCard } from "@/components/ComingSoonCard";

export default function Connect() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Connect Mensagens</h1>
        <p className="text-muted-foreground mt-2">
          Configure disparos e orquestração de mensagens
        </p>
      </div>

      <ComingSoonCard 
        title="Orquestração de Mensagens"
        description="Funcionalidade para configurar campanhas de mensagens, templates, sequências automatizadas e integrações com canais de comunicação."
      />
    </div>
  );
}