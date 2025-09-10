import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search } from "lucide-react";

interface Cliente {
  id: number;
  nome: string;
  documento: string;
}

export default function Consultas() {
  const carteiraTipo: "CPF" | "CNPJ" = "CPF";
  const [tipo, setTipo] = useState<"CPF" | "CNPJ">(carteiraTipo);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selecionados, setSelecionados] = useState<number[]>([]);

  const dados = useMemo(() => {
    return Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      nome: `Cliente ${i + 1}`,
      documento:
        tipo === "CPF"
          ? `000.000.000-${String(i + 1).padStart(2, "0")}`
          : `00.000.000/000${String(i + 1).padStart(2, "0")}`,
    }));
  }, [tipo]);

  const totalPaginas = Math.ceil(dados.length / pageSize);
  const inicio = (page - 1) * pageSize;
  const paginaDados = dados.slice(inicio, inicio + pageSize);

  const toggleSelecionado = (id: number) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selecionarTodos = () => {
    const idsPagina = paginaDados.map((d) => d.id);
    const todosSelecionados = idsPagina.every((id) => selecionados.includes(id));
    setSelecionados((prev) =>
      todosSelecionados
        ? prev.filter((id) => !idsPagina.includes(id))
        : Array.from(new Set([...prev, ...idsPagina]))
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Consultar cliente</h1>
        <p className="text-muted-foreground mt-2">
          Realize consultas de {tipo}
        </p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Consultas
          </CardTitle>
          <CardDescription>
            Selecione os clientes para consulta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium mb-2">Tipo de documento</p>
            <RadioGroup
              value={tipo}
              onValueChange={(v) => {
                setPage(1);
                setTipo(v as "CPF" | "CNPJ");
                setSelecionados([]);
              }}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CPF" id="r-cpf" />
                <Label htmlFor="r-cpf">CPF</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CNPJ" id="r-cnpj" />
                <Label htmlFor="r-cnpj">CNPJ</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={selecionarTodos}>
              Selecionar todos
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Itens por página</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[50, 100, 250, 500, 1000].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={paginaDados.every((d) => selecionados.includes(d.id))}
                    onCheckedChange={selecionarTodos}
                  />
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>{tipo}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginaDados.map((cliente) => (
                <TableRow
                  key={cliente.id}
                  data-state={selecionados.includes(cliente.id) ? "selected" : undefined}
                >
                  <TableCell className="w-12">
                    <Checkbox
                      checked={selecionados.includes(cliente.id)}
                      onCheckedChange={() => toggleSelecionado(cliente.id)}
                    />
                  </TableCell>
                  <TableCell>{cliente.nome}</TableCell>
                  <TableCell>{cliente.documento}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination className="pt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                />
              </PaginationItem>
              {Array.from({ length: totalPaginas }, (_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    isActive={page === i + 1}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(i + 1);
                    }}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  className={page === totalPaginas ? "pointer-events-none opacity-50" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.min(totalPaginas, p + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardContent>
      </Card>
    </div>
  );
}
