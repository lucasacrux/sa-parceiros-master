import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default function Contratos() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Contratos</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seus contratos e acordos
        </p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gestão de Contratos
          </CardTitle>
          <CardDescription>
            Esta funcionalidade será implementada em breve
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aqui você poderá visualizar, editar e gerenciar todos os contratos
            e acordos firmados com seus clientes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}