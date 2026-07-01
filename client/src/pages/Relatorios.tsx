import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Download } from "lucide-react";

export default function Relatorios() {
  const { data: origens = [] } = trpc.relatorios.getOrigens.useQuery();
  const { data: clientes = [], refetch } = trpc.relatorios.list.useQuery({
    origem: undefined,
    status: undefined,
  });
  const { data: csvData } = trpc.relatorios.exportarCSV.useQuery({
    origem: undefined,
    status: undefined,
  });

  const [filtros, setFiltros] = useState({
    origem: "",
    status: "" as "" | "concluidos" | "em_andamento" | "honorarios_pagos" | "honorarios_pendentes" | "inadimplentes",
  });

  const handleFiltrar = async () => {
    refetch();
  };

  const handleExportarCSV = () => {
    if (!csvData) return;

    const element = document.createElement("a");
    const file = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    element.href = URL.createObjectURL(file);
    element.download = `relatorio_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const origensLista = Array.isArray(origens) ? origens.filter(Boolean) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Relatórios</h1>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Origem</label>
              <select
                value={filtros.origem}
                onChange={(e) => setFiltros({ ...filtros, origem: e.target.value })}
                className="w-full p-2 border rounded mt-1"
              >
                <option value="">Todas</option>
                {origensLista.map((origem: any) => (
                  <option key={origem} value={origem}>
                    {origem}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                value={filtros.status}
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    status: e.target.value as any,
                  })
                }
                className="w-full p-2 border rounded mt-1"
              >
                <option value="">Todos</option>
                <option value="concluidos">Concluídos</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="honorarios_pagos">Honorários Pagos</option>
                <option value="honorarios_pendentes">Honorários Pendentes</option>
                <option value="inadimplentes">Inadimplentes</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleFiltrar} className="flex-1">
                Filtrar
              </Button>
              <Button onClick={handleExportarCSV} variant="outline" className="flex-1">
                <Download size={18} className="mr-2" /> Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Resultados ({clientes.length} cliente(s))
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Nome</th>
                  <th className="text-left py-2 px-2">CPF</th>
                  <th className="text-left py-2 px-2">Origem</th>
                  <th className="text-left py-2 px-2">Contratação</th>
                  <th className="text-left py-2 px-2">Data do Parto</th>
                  <th className="text-left py-2 px-2">Etapa</th>
                  <th className="text-left py-2 px-2">Valor Honorários</th>
                  <th className="text-left py-2 px-2">Status Honorários</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-gray-500">
                      Nenhum resultado encontrado
                    </td>
                  </tr>
                ) : (
                  clientes.map((cliente: any) => (
                    <tr key={cliente.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2">{cliente.nome}</td>
                      <td className="py-2 px-2">{cliente.cpf}</td>
                      <td className="py-2 px-2">{cliente.origem || "-"}</td>
                      <td className="py-2 px-2">
                        {new Date(cliente.dataContratacao).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-2 px-2">
                        {cliente.dataNascimento
                          ? new Date(cliente.dataNascimento).toLocaleDateString("pt-BR")
                          : "-"}
                      </td>
                      <td className="py-2 px-2">{cliente.etapaNome}</td>
                      <td className="py-2 px-2">
                        {cliente.honorarios
                          ? `R$ ${parseFloat(cliente.honorarios.valorTotal).toFixed(2).replace(".", ",")}`
                          : "-"}
                      </td>
                      <td className="py-2 px-2">
                        {cliente.inadimplente ? (
                          <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                            Inadimplente
                          </span>
                        ) : cliente.etapa === 13 ? (
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Recebido
                          </span>
                        ) : cliente.etapa === 12 ? (
                          <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                            Pendente
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
