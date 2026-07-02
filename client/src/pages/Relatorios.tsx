import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Download } from "lucide-react";
import { STATUS_PROCESSO, type StatusProcesso } from "@shared/status";

type StatusFiltro = "" | StatusProcesso | "inadimplentes";

export default function Relatorios() {
  const [filtros, setFiltros] = useState({
    origem: "",
    status: "" as StatusFiltro,
  });

  const origemParam = filtros.origem || undefined;
  const statusParam = (filtros.status || undefined) as Exclude<StatusFiltro, ""> | undefined;

  const { data: origens = [] } = trpc.relatorios.getOrigens.useQuery();
  const { data: clientes = [], refetch } = trpc.relatorios.list.useQuery({
    origem: origemParam,
    status: statusParam,
  });
  const { data: csvData } = trpc.relatorios.exportarCSV.useQuery({
    origem: origemParam,
    status: statusParam,
  });
  const { data: resumoMensal = [] } = trpc.relatorios.resumoMensalPorDPP.useQuery();

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
                {STATUS_PROCESSO.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
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
          <CardTitle>Visão Geral por Mês (por DPP)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Mês (DPP)</th>
                  <th className="text-left py-2 px-2">Total</th>
                  <th className="text-left py-2 px-2">Aguard. Assinatura</th>
                  <th className="text-left py-2 px-2">Aguard. Certidão</th>
                  <th className="text-left py-2 px-2">Em Análise INSS</th>
                  <th className="text-left py-2 px-2">Em Recurso INSS</th>
                  <th className="text-left py-2 px-2">Benefício Concedido</th>
                </tr>
              </thead>
              <tbody>
                {resumoMensal.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-gray-500">
                      Nenhum dado para exibir
                    </td>
                  </tr>
                ) : (
                  resumoMensal.map((m: any) => (
                    <tr key={m.mes} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 font-semibold">{m.mes}</td>
                      <td className="py-2 px-2">{m.total}</td>
                      <td className="py-2 px-2 text-sky-600">{m.aguardandoAssinatura}</td>
                      <td className="py-2 px-2 text-amber-600">{m.aguardandoCertidao}</td>
                      <td className="py-2 px-2 text-purple-600">{m.emAnalise}</td>
                      <td className="py-2 px-2 text-red-600">{m.emRecurso}</td>
                      <td className="py-2 px-2 text-green-600">{m.beneficioConcedido}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                  <th className="text-left py-2 px-2">Status Atual</th>
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
                      <td className="py-2 px-2">
                        <span className="inline-block bg-rose-100 text-rose-800 text-xs px-2 py-1 rounded">
                          {cliente.statusProcesso}
                        </span>
                      </td>
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
                        ) : cliente.honorarios?.statusPagamento ? (
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            {cliente.honorarios.statusPagamento}
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
