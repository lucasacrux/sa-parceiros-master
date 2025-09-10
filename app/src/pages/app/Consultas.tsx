import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

export default function Consultas() {
  const [cnpj, setCnpj] = useState("");
  const [success, setSuccess] = useState(false);

  const handleConsulta = async () => {
    try {
      const resp = await fetch(`/api/public/cnpj?cnpj=${encodeURIComponent(cnpj)}`);
      if (resp.ok) {
        setSuccess(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Consultas</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consulta CNPJ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Digite o CNPJ"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
          />
          <Button onClick={handleConsulta}>Consultar</Button>
          {success && (
            <p className="text-sm text-green-600">
              Consulta realizada com sucesso.{' '}
              <Link to="/app/consultas/historico" className="underline">
                Ver histórico
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
