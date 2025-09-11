import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboards() {
  const [consultas, setConsultas] = useState<number>(0);
  const [processos, setProcessos] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      try {
        const { count: c1 } = await supabase.from('consultations').select('*', { head: true, count: 'exact' });
        const { count: c2 } = await supabase.from('processes').select('*', { head: true, count: 'exact' });
        setConsultas(c1 ?? 0);
        setProcessos(c2 ?? 0);
      } catch {}
    };
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboards</h1>
        <p className="text-muted-foreground mt-2">Métricas e análises da sua operação.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Total de Portais</CardTitle>
            <CardDescription>Quantidade de portais ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2</div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Consultas Processadas</CardTitle>
            <CardDescription>Via BigDataCorp</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{consultas}</div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Processos Encontrados</CardTitle>
            <CardDescription>Somatório dos registros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{processos}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

