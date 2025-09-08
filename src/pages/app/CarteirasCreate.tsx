import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderPlus } from "lucide-react";

export default function CarteirasCreate() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Criar Nova Carteira</h1>
        <p className="text-muted-foreground mt-2">
          Configure uma nova carteira de cobrança
        </p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Nova Carteira
          </CardTitle>
          <CardDescription>
            Esta funcionalidade será implementada em breve
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aqui você poderá configurar novas carteiras de cobrança com upload de arquivos,
            configuração de campos e regras de negócio.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}