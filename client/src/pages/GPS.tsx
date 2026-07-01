import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { CheckCircle2 } from "lucide-react";

export default function GPS() {
  const { data: clientes = [] } = trpc.clientes.list.useQuery();
  const { data: gpsByCompetencia = [] } = trpc.gps.listByCompetencia.useQuery();
  const marcarPagaMutation = trpc.gps.marcarPaga.useMutation();

  const [activeTab, setActiveTab] = useState("a-gerar");

  const handleMarcarPaga = async (gpsId: number, clienteId: number) => {
    try {
      await marcarPagaMutation.mutateAsync({ gpsId, clienteId });
    } catch (error) {
      console.error(error);
    }
  };

  const getGPSByStatus = (status: string) => {
    const result = [];
    for (const comp of gpsByCompetencia) {
      for (const gps of comp.gps || []) {
        if (status === "a-gerar" && !gps.paga) {
          result.push({ ...gps, competencia: comp.competencia, vencimento: comp.vencimento });
        } else if (status === "pend-pagamento" && !gps.paga) {
          result.push({ ...gps, competencia: comp.competencia, vencimento: comp.vencimento });
        } else if (status === "pagas" && gps.paga) {
          result.push({ ...gps, competencia: comp.competencia, vencimento: comp.vencimento });
        } else if (status === "todas") {
          result.push({ ...gps, competencia: comp.competencia, vencimento: comp.vencimento });
        }
      }
    }
    return result;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Controle de GPS/Pagamentos</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="a-gerar">A Gerar</TabsTrigger>
          <TabsTrigger value="pend-pagamento">Pend. Pagamento</TabsTrigger>
          <TabsTrigger value="pagas">Pagas</TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
        </TabsList>

        <TabsContent value="a-gerar" className="space-y-4">
          <GPSTable
            gps={getGPSByStatus("a-gerar")}
            onMarcarPaga={handleMarcarPaga}
            showAction={true}
          />
        </TabsContent>

        <TabsContent value="pend-pagamento" className="space-y-4">
          <GPSTable
            gps={getGPSByStatus("pend-pagamento")}
            onMarcarPaga={handleMarcarPaga}
            showAction={true}
          />
        </TabsContent>

        <TabsContent value="pagas" className="space-y-4">
          <GPSTable
            gps={getGPSByStatus("pagas")}
            onMarcarPaga={handleMarcarPaga}
            showAction={false}
          />
        </TabsContent>

        <TabsContent value="todas" className="space-y-4">
          <GPSTable
            gps={getGPSByStatus("todas")}
            onMarcarPaga={handleMarcarPaga}
            showAction={true}
          />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Resumo por Competência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Competência</th>
                  <th className="text-left py-2 px-2">Vencimento</th>
                  <th className="text-left py-2 px-2">Total GPS</th>
                  <th className="text-left py-2 px-2">Pagas</th>
                  <th className="text-left py-2 px-2">Pendentes</th>
                </tr>
              </thead>
              <tbody>
                {gpsByCompetencia.map((comp: any) => (
                  <tr key={comp.competencia} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 font-semibold">{comp.competencia}</td>
                    <td className="py-2 px-2">
                      {new Date(comp.vencimento).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-2 px-2">R$ {comp.total.toFixed(2).replace(".", ",")}</td>
                    <td className="py-2 px-2 text-green-600">{comp.pagas}</td>
                    <td className="py-2 px-2 text-red-600">{comp.pendentes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GPSTable({
  gps,
  onMarcarPaga,
  showAction,
}: {
  gps: any[];
  onMarcarPaga: (gpsId: number, clienteId: number) => void;
  showAction: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Cliente</th>
                <th className="text-left py-2 px-2">Competência</th>
                <th className="text-left py-2 px-2">Vencimento</th>
                <th className="text-left py-2 px-2">Valor</th>
                <th className="text-left py-2 px-2">Status</th>
                {showAction && <th className="text-left py-2 px-2">Ação</th>}
              </tr>
            </thead>
            <tbody>
              {gps.length === 0 ? (
                <tr>
                  <td colSpan={showAction ? 6 : 5} className="py-4 text-center text-gray-500">
                    Nenhum GPS encontrado
                  </td>
                </tr>
              ) : (
                gps.map((g: any) => (
                  <tr key={g.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2">{g.clienteNome}</td>
                    <td className="py-2 px-2">{g.competencia}</td>
                    <td className="py-2 px-2">
                      {new Date(g.vencimento).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-2 px-2">R$ {parseFloat(g.valor || "178.00").toFixed(2).replace(".", ",")}</td>
                    <td className="py-2 px-2">
                      {g.paga ? (
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Paga
                        </span>
                      ) : (
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          Pendente
                        </span>
                      )}
                    </td>
                    {showAction && (
                      <td className="py-2 px-2">
                        {!g.paga && (
                          <Button
                            size="sm"
                            onClick={() => onMarcarPaga(g.id, g.clienteId)}
                          >
                            <CheckCircle2 size={14} className="mr-1" /> Marcar Paga
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
