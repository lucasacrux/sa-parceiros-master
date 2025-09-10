import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [cnpjsText, setCnpjsText] = useState("");
  const [apiResult, setApiResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleConsulta = async () => {
    const cnpjs = cnpjsText
      .split(/\s|,|;|\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (cnpjs.length === 0 || selected.length === 0) return;
    setLoading(true);
    setApiResult(null);
    try {
      const resp = await fetch("/api/consultas/cnpj/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnpjs, datasets: selected }),
      });
      const data = await resp.json();
      setApiResult(data);
    } catch (e) {
      setApiResult({ error: String(e) });
    } finally {
      setLoading(false);
    }
  };

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
              {clientType === "cnpj" && (
                <div className="space-y-2">
                  <label className="text-sm">CNPJs (separe por vírgula ou quebra de linha)</label>
                  <Input
                    placeholder="00.000.000/0000-00, 11.111.111/1111-11"
                    value={cnpjsText}
                    onChange={(e) => setCnpjsText(e.target.value)}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleConsulta} disabled={selected.length === 0 || (clientType === "cnpj" && !cnpjsText) || loading}>
                  {loading ? "Consultando..." : "Realizar consulta"}
                </Button>
                {apiResult && (
                  <Button variant="outline" onClick={() => setApiResult(null)}>Limpar resultado</Button>
                )}
              </div>
              {apiResult && (
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64">
                  {JSON.stringify(apiResult, null, 2)}
                </pre>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

