import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function ConsultaCPF() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Consultar CPF</h1>
        <p className="text-muted-foreground mt-2">
          Realize consultas detalhadas de CPF
        </p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Consulta CPF
          </CardTitle>
          <CardDescription>
            Esta funcionalidade será implementada em breve
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aqui você poderá realizar consultas detalhadas de CPF, incluindo
            score, histórico de pagamentos, dados cadastrais e muito mais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}