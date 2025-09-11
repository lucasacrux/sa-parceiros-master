import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Props = {
  result?: any;
};

export default function ConsultasResultado({ result }: Props) {
  const rows = useMemo(() => {
    const out: any[] = [];
    const walk = (obj: any) => {
      if (Array.isArray(obj)) obj.forEach(walk);
      else if (obj && typeof obj === "object") {
        const keys = Object.keys(obj).map((k) => k.toLowerCase());
        if (keys.some((k) => ["publishdate","publishedat","title","content","court","source","url","link"].includes(k))) {
          out.push(obj);
        } else {
          Object.values(obj).forEach(walk);
        }
      }
    };
    if (result) walk(result);
    return out.slice(0, 200);
  }, [result]);

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>Primeiros {rows.length} registros detectados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Publicação</TableHead>
                  <TableHead>Captura</TableHead>
                  <TableHead>Fonte</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="max-w-[400px] truncate" title={r.title}>{r.title ?? r.content?.slice(0,120)}</TableCell>
                    <TableCell>{r.publishDate ?? r.publishedAt ?? r.published_date ?? "-"}</TableCell>
                    <TableCell>{r.captureDate ?? r.capturedAt ?? r.capture_date ?? "-"}</TableCell>
                    <TableCell>{r.source ?? r.fonte ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

