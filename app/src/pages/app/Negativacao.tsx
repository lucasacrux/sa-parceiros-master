import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Negativacao() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Faça uma Negativação</h1>
        <p className="text-muted-foreground mt-2">
          Envie registros para os órgãos de proteção ao crédito
        </p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Negativação
          </CardTitle>
          <CardDescription>
            Esta funcionalidade será implementada em breve
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aqui você poderá enviar registros para SERASA, SPC e outros órgãos
            de proteção ao crédito de forma automatizada.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}