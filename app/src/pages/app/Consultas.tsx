import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import ConsultasResultado from "./ConsultasResultado";

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
  const savedId = (() => {
    try {
      const keys = apiResult && apiResult.results ? Object.keys(apiResult.results) : [];
      if (keys.length) {
        return apiResult.results[keys[0]]?.saved_id;
      }
    } catch {}
    return undefined;
  })();
  const [loading, setLoading] = useState(false);

  // Fallback when Supabase is not configured or empty
  const SUPABASE_ENABLED = Boolean(
    (import.meta as any)?.env?.VITE_SUPABASE_URL && (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY
  );
  const DEFAULT_DATASETS: Record<string, Dataset[]> = {
    cnpj: [
      { id: "lawsuits", code: "lawsuits", name: "Processos (BigDataCorp)", type: "cnpj", price: 0 },
    ],
    cpf: [
      { id: "cpf_basic", code: "cpf_basic", name: "Consulta CPF básica", type: "cpf", price: 0 },
    ],
  };

  useEffect(() => {
    const loadDatasets = async () => {
      if (!clientType) return;
      let list: Dataset[] | null = null;
      if (SUPABASE_ENABLED) {
        try {
          const { data } = await supabase
            .from("datasets")
            .select("*")
            .eq("type", clientType);
          list = data ?? null;
        } catch {
          list = null;
        }
      }
      if (!list || list.length === 0) {
        list = DEFAULT_DATASETS[clientType] ?? [];
      }
      setDatasets(list);
      // Preselect first dataset for convenience
      if (list.length > 0) {
        setSelected([list[0].id]);
      } else {
        setSelected([]);
      }
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
      const text = await resp.text();
      try {
        const data = text ? JSON.parse(text) : { status: resp.status };
        setApiResult(data);
      } catch {
        setApiResult({ status: resp.status, body: text });
      }
    } catch (e) {
      setApiResult({ error: String(e) });
    } finally {
      setLoading(false);
    }
  };

  // --- Masks ---------------------------------------------------------------
  const onlyDigits = (s: string) => s.replace(/\D+/g, "");
  const maskCPF = (digits: string) => {
    const d = onlyDigits(digits).slice(0, 11);
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d2) =>
      [a, b, c].filter(Boolean).join(".") + (d2 ? "-" + d2 : "")
    );
  };
  const maskCNPJ = (digits: string) => {
    const d = onlyDigits(digits).slice(0, 14);
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (_, a, b, c, d4, e) =>
      `${a}.${b}.${c}/${d4}` + (e ? `-${e}` : "")
    );
  };
  const maskList = (value: string, kind: string) => {
    const maskFn = kind === "cpf" ? maskCPF : maskCNPJ;
    const parts = value.split(/,|\n/);
    const masked = parts.map((p) => maskFn(p.trim())).join(", ");
    return masked;
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
        <div className="flex items-center gap-2">
        <Button variant="link" asChild>
          <Link to="/app/consultas/precos">Tabela de preços</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/app/consultas/historico">Historico de consultas</Link>
        </Button>
        </div>
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
              {clientType && (
                <div className="space-y-2">
                  <label className="text-sm">
                    {clientType === "cnpj" ? "CNPJs" : "CPFs"} (separe por vírgula ou quebra de linha)
                  </label>
                  <Input
                    placeholder={clientType === "cnpj" ? "00.000.000/0000-00, 11.111.111/1111-11" : "000.000.000-00, 111.111.111-11"}
                    value={cnpjsText}
                    onChange={(e) => setCnpjsText(maskList(e.target.value, clientType))}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleConsulta} disabled={!cnpjsText.trim() || loading}>
                  {loading ? "Consultando..." : "Realizar consulta"}
                </Button>
                {apiResult && (
                  <>
                    <Button variant="outline" onClick={() => setApiResult(null)}>Limpar resultado</Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(apiResult, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `consulta_${clientType ?? 'cnpj'}_${Date.now()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Baixar JSON
                    </Button>
                  </>
                )}
              </div>
              {apiResult && (
                <>
                  <Card variant="feature">
                    <CardHeader>
                      <CardTitle>Resumo</CardTitle>
                      <CardDescription>Visualize os principais dados. Para ver o JSON completo, use o botão "Baixar JSON".</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground">Dataset</div>
                          <div className="font-medium">{(apiResult as any)?.meta?.dataset ?? selected[0]}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Consulta</div>
                          <div className="font-medium break-all">{(apiResult as any)?.meta?.q ?? "-"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Status</div>
                          <div className="font-medium">{(apiResult as any)?.status_code ?? 200}</div>
                        </div>
                      </div>
                      {savedId && (
                        <div className="mt-4">
                          <Button asChild variant="outline">
                            <Link to={`/app/consultas/resultado?id=${savedId}`}>Ver resultados completos</Link>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <ConsultasResultado result={apiResult} />
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

