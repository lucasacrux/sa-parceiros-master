import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

interface Dataset {
  id: string;
  code: string;
  name: string;
  type: string;
  price: number;
}

export default function Consultas() {
  const [clientType, setClientType] = useState<string>();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const loadDatasets = async () => {
      if (!clientType) return;
      const { data } = await supabase
        .from("datasets")
        .select("*")
        .eq("type", clientType);
      setDatasets(data ?? []);
    };
    loadDatasets();
  }, [clientType]);

  const toggleDataset = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const total = datasets
    .filter((d) => selected.includes(d.id))
    .reduce((sum, d) => sum + d.price, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Consultas</h1>
          <p className="text-muted-foreground mt-2">
            Selecione o tipo de cliente e os datasets desejados
          </p>
        </div>
        <Button variant="link" asChild>
          <Link to="/app/consultas/precos">Tabela de preços</Link>
        </Button>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Tipo de cliente</CardTitle>
          <CardDescription>
            Escolha o tipo de cliente para listar datasets disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={clientType} onValueChange={setClientType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cpf">CPF</SelectItem>
              <SelectItem value="cnpj">CNPJ</SelectItem>
            </SelectContent>
          </Select>

          {clientType && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead />
                    <TableHead>Dataset</TableHead>
                    <TableHead>Preço (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datasets.map((dataset) => (
                    <TableRow key={dataset.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.includes(dataset.id)}
                          onCheckedChange={() => toggleDataset(dataset.id)}
                        />
                      </TableCell>
                      <TableCell>{dataset.name}</TableCell>
                      <TableCell>{dataset.price.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end font-semibold">
                Total: R$ {total.toFixed(2)}
              </div>
              <Button disabled={selected.length === 0}>Realizar consulta</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
