import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export default function Connect() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Connect Mensagens</h1>
        <p className="text-muted-foreground mt-2">
          Configure disparos e orquestração de mensagens
        </p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Orquestração de Mensagens
          </CardTitle>
          <CardDescription>
            Esta funcionalidade será implementada em breve
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aqui você poderá configurar campanhas de mensagens, templates,
            sequências automatizadas e integrações com canais de comunicação.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}