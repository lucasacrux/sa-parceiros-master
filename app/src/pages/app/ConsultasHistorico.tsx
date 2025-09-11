import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { Line, LineChart, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Bar, BarChart } from "recharts";

type Row = { id: string; document: string; dataset: string; requested_at: string };

export default function ConsultasHistorico() {
  const [document, setDocument] = useState("");
  const [dataset, setDataset] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [series, setSeries] = useState<{ date: string; count: number }[]>([]);
  const [topDocs, setTopDocs] = useState<{ document: string; count: number }[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (document) qs.set("document", document);
      if (dataset) qs.set("dataset", dataset);
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      qs.set("page", String(page));
      qs.set("page_size", String(20));
      const res = await fetch(`/api/consultations/history/?${qs.toString()}`);
      const data = await res.json();
      setRows(Array.isArray(data?.data) ? data.data : []);

      // Aggregations
      const qsAgg = new URLSearchParams(qs);
      const [a1, a2] = await Promise.all([
        fetch(`/api/consultations/aggregations/time-series/?${qsAgg.toString()}`).then(r => r.json()).catch(() => ({series:[]})),
        fetch(`/api/consultations/aggregations/by-cnpj/?${qsAgg.toString()}`).then(r => r.json()).catch(() => ({items:[]})),
      ]);
      setSeries(Array.isArray(a1?.series) ? a1.series : []);
      setTopDocs(Array.isArray(a2?.items) ? a2.items.slice(0, 10) : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Consultas</h1>
          <p className="text-muted-foreground mt-2">Filtros, gráficos e lista paginada</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refine sua busca</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            <Input placeholder="Documento (CNPJ/CPF)" value={document} onChange={(e) => setDocument(e.target.value)} />
            <Input placeholder="Dataset" value={dataset} onChange={(e) => setDataset(e.target.value)} />
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <Button onClick={() => { setPage(1); load(); }} disabled={loading}>Buscar</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Série temporal</CardTitle><CardDescription>Publicações por dia</CardDescription></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top documentos</CardTitle><CardDescription>Mais encontrados</CardDescription></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDocs} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="document" tick={{ fontSize: 12 }} hide />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>Últimas consultas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Dataset</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.document}</TableCell>
                    <TableCell>{r.dataset}</TableCell>
                    <TableCell>{r.requested_at}</TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/app/consultas/resultado?id=${r.id}`}>Ver detalhes</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}>Anterior</Button>
            <Button onClick={() => setPage((p) => p + 1)} disabled={loading}>Próxima</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

