import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ConsultasResultado from "./ConsultasResultado";

export default function ConsultasDetalhe() {
  const [params] = useSearchParams();
  const id = params.get('id') ?? '';
  const [row, setRow] = useState<any | null>(null);
  const [series, setSeries] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/public/consultations?id=eq.${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d) && d.length) setRow(d[0]);
      })
      .catch(() => {});
    // Load time series for this consultation's processes
    fetch(`/api/consultations/aggregations/time-series/?consultation_id=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(d => setSeries(Array.isArray(d?.series) ? d.series : []))
      .catch(() => {});
  }, [id]);

  return (
    <div className="space-y-6">
      <Card variant="feature">
        <CardHeader>
          <CardTitle>Consulta</CardTitle>
          <CardDescription>ID: {id}</CardDescription>
        </CardHeader>
        <CardContent>
          {!row ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs text-muted-foreground">Documento</div>
                  <div className="font-medium">{row.document}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Dataset</div>
                  <div className="font-medium">{row.dataset}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Data</div>
                  <div className="font-medium">{row.requested_at}</div>
                </div>
              </div>
              <ConsultasResultado result={row.result} />
              <Card variant="elevated" className="mt-6">
                <CardHeader>
                  <CardTitle>Série temporal</CardTitle>
                  <CardDescription>Publicações relacionadas a esta consulta</CardDescription>
                </CardHeader>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
