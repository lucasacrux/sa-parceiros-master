import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export default function Dossie() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dossiê do Cliente</h1>
        <p className="text-muted-foreground mt-2">
          Visão 360 graus do CPF/CNPJ
        </p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dossiê Completo
          </CardTitle>
          <CardDescription>
            Esta funcionalidade será implementada em breve
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aqui você poderá visualizar todas as informações de um cliente,
            histórico de pagamentos, score, dados cadastrais e muito mais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}