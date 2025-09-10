import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface Dataset {
  id: string;
  code: string;
  name: string;
  type: string;
  price: number;
}

export default function ConsultasPrecos() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("datasets").select("*");
      setDatasets(data ?? []);
    };
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Tabela de preços</h1>
        <p className="text-muted-foreground mt-2">
          Lista completa de datasets e pacotes de preços
        </p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Datasets disponíveis</CardTitle>
          <CardDescription>Consulta de valores unitários</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dataset</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Preço (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasets.map((ds) => (
                <TableRow key={ds.id}>
                  <TableCell>{ds.name}</TableCell>
                  <TableCell className="uppercase">{ds.type}</TableCell>
                  <TableCell>{ds.price.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Pacotes de preços</CardTitle>
          <CardDescription>
            Combinações de datasets com valores promocionais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em breve.</p>
        </CardContent>
      </Card>
    </div>
  );
}
