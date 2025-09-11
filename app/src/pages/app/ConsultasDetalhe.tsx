import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ConsultasResultado from "./ConsultasResultado";

export default function ConsultasDetalhe() {
  const [params] = useSearchParams();
  const id = params.get('id') ?? '';
  const [row, setRow] = useState<any | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/public/consultations?id=eq.${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d) && d.length) setRow(d[0]);
      })
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

