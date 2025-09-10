import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

export default function CarteirasCreate() {
  const [name, setName] = useState("");
  const [type, setType] = useState("cpf");
  const [file, setFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const DEMO_TENANT_ID = "1bf4dc32-eb3e-4115-9094-a567803563f0";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const parseFile = async (f: File): Promise<string[]> => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      return new Promise((resolve, reject) => {
        Papa.parse<string[]>(f, {
          complete: (results) => {
            const docs = (results.data as string[][])
              .flat()
              .filter((d): d is string => !!d)
              .map((d) => d.trim());
            resolve(docs);
          },
          error: (err) => reject(err),
        });
      });
    } else if (ext === "xlsx") {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
              header: 1,
            }) as unknown as string[][];
            const docs = rows
              .flat()
              .filter((d): d is string => !!d)
              .map((d) => d.trim());
            resolve(docs);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(f);
      });
    }
    return Promise.reject(new Error("Formato de arquivo não suportado"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !file) {
      toast({
        title: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }
    try {
      const docs = await parseFile(file);
      if (!docs.length) {
        toast({
          title: "Arquivo vazio",
          variant: "destructive",
        });
        return;
      }

      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .insert({ name, type, tenant_id: DEMO_TENANT_ID })
        .select()
        .single();
      if (walletError) throw walletError;

      const records = docs.map((document) => ({
        wallet_id: wallet.id,
        document,
        type,
      }));

      const { error: clientsError } = await supabase
        .from("wallet_clients")
        .insert(records);
      if (clientsError) throw clientsError;

      toast({ title: "Carteira importada com sucesso!" });
      navigate("/app/consultas/cpf");
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao importar carteira",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Criar Nova Carteira</h1>
        <p className="text-muted-foreground mt-2">
          Configure uma nova carteira de cobrança
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Importar Carteira</CardTitle>
          <CardDescription>
            Informe os dados e faça upload do arquivo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Carteira</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">Pessoas (CPF)</SelectItem>
                  <SelectItem value="cnpj">Empresas (CNPJ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Arquivo</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
                required
              />
            </div>
            <Button type="submit">Enviar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}