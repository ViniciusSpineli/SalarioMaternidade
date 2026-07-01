import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Plus, CheckCircle2 } from "lucide-react";

export default function Honorarios() {
  const { data: clientes = [] } = trpc.clientes.list.useQuery();
  const { data: pendentes = [], refetch: refetchPendentes } = trpc.honorarios.listByStatus.useQuery(
    { status: "pendentes" }
  );
  const { data: recebidos = [], refetch: refetchRecebidos } = trpc.honorarios.listByStatus.useQuery(
    { status: "recebidos" }
  );
  const { data: inadimplentes = [], refetch: refetchInadimplentes } = trpc.honorarios.listByStatus.useQuery(
    { status: "inadimplentes" }
  );

  const registrarMutation = trpc.honorarios.registrarCobranca.useMutation();
  const marcarRecebidoMutation = trpc.honorarios.marcarRecebido.useMutation();
  const marcarInadimplenteMutation = trpc.honorarios.marcarInadimplente.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clienteId: 0,
    valorTotal: 0,
    formaPagamento: "PIX",
    parcelamento: "À vista",
    dataVencimento: new Date().toISOString().split("T")[0],
    valorPrimeiraParcela: 0,
    vencimentoSegundaParcela: "",
    observacoes: "",
  });

  const handleRegistrarCobranca = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registrarMutation.mutateAsync({
        ...formData,
        clienteId: parseInt(formData.clienteId.toString()),
        dataVencimento: new Date(formData.dataVencimento),
        vencimentoSegundaParcela: formData.vencimentoSegundaParcela
          ? new Date(formData.vencimentoSegundaParcela)
          : undefined,
      });
      setFormData({
        clienteId: 0,
        valorTotal: 0,
        formaPagamento: "PIX",
        parcelamento: "À vista",
        dataVencimento: new Date().toISOString().split("T")[0],
        valorPrimeiraParcela: 0,
        vencimentoSegundaParcela: "",
        observacoes: "",
      });
      setShowForm(false);
      refetchPendentes();
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarcarRecebido = async (honorarioId: number, clienteId: number) => {
    try {
      await marcarRecebidoMutation.mutateAsync({ honorarioId, clienteId });
      refetchPendentes();
      refetchRecebidos();
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarcarInadimplente = async (clienteId: number) => {
    try {
      await marcarInadimplenteMutation.mutateAsync({ clienteId });
      refetchPendentes();
      refetchInadimplentes();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Controle de Honorários</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2" size={18} /> Registrar Cobrança
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Cobrança de Honorários</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegistrarCobranca} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Cliente</label>
                  <select
                    value={formData.clienteId}
                    onChange={(e) =>
                      setFormData({ ...formData, clienteId: parseInt(e.target.value) })
                    }
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Selecione uma cliente</option>
                    {clientes.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  type="number"
                  placeholder="Valor Total"
                  value={formData.valorTotal}
                  onChange={(e) =>
                    setFormData({ ...formData, valorTotal: parseFloat(e.target.value) })
                  }
                  step="0.01"
                  required
                />
                <select
                  value={formData.formaPagamento}
                  onChange={(e) =>
                    setFormData({ ...formData, formaPagamento: e.target.value })
                  }
                  className="p-2 border rounded"
                >
                  <option>PIX</option>
                  <option>Boleto</option>
                  <option>Outro</option>
                </select>
                <select
                  value={formData.parcelamento}
                  onChange={(e) =>
                    setFormData({ ...formData, parcelamento: e.target.value })
                  }
                  className="p-2 border rounded"
                >
                  <option>À vista</option>
                  <option>2x</option>
                  <option>3x</option>
                </select>
                <div>
                  <label className="text-sm font-medium">Data Vencimento</label>
                  <Input
                    type="date"
                    value={formData.dataVencimento}
                    onChange={(e) =>
                      setFormData({ ...formData, dataVencimento: e.target.value })
                    }
                    required
                  />
                </div>
                <Input
                  type="number"
                  placeholder="Valor 1ª Parcela"
                  value={formData.valorPrimeiraParcela}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      valorPrimeiraParcela: parseFloat(e.target.value),
                    })
                  }
                  step="0.01"
                />
                <div>
                  <label className="text-sm font-medium">Vencimento 2ª Parcela</label>
                  <Input
                    type="date"
                    value={formData.vencimentoSegundaParcela}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vencimentoSegundaParcela: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Observações</label>
                <textarea
                  className="w-full p-2 border rounded"
                  rows={2}
                  value={formData.observacoes}
                  onChange={(e) =>
                    setFormData({ ...formData, observacoes: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Registrar</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="pendentes">
        <TabsList>
          <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
          <TabsTrigger value="boletos">Boletos</TabsTrigger>
          <TabsTrigger value="recebidos">Recebidos</TabsTrigger>
          <TabsTrigger value="inadimplentes">Inadimplentes</TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes">
          <HonorariosTable
            items={pendentes}
            onMarcarRecebido={handleMarcarRecebido}
            onMarcarInadimplente={handleMarcarInadimplente}
            showActions={true}
          />
        </TabsContent>

        <TabsContent value="boletos">
          <HonorariosTable
            items={pendentes.filter((p: any) => p.cliente.honorarios?.formaPagamento === "Boleto")}
            onMarcarRecebido={handleMarcarRecebido}
            onMarcarInadimplente={handleMarcarInadimplente}
            showActions={true}
          />
        </TabsContent>

        <TabsContent value="recebidos">
          <HonorariosTable
            items={recebidos}
            onMarcarRecebido={handleMarcarRecebido}
            onMarcarInadimplente={handleMarcarInadimplente}
            showActions={false}
          />
        </TabsContent>

        <TabsContent value="inadimplentes">
          <HonorariosTable
            items={inadimplentes}
            onMarcarRecebido={handleMarcarRecebido}
            onMarcarInadimplente={handleMarcarInadimplente}
            showActions={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HonorariosTable({
  items,
  onMarcarRecebido,
  onMarcarInadimplente,
  showActions,
}: {
  items: any[];
  onMarcarRecebido: (honorarioId: number, clienteId: number) => void;
  onMarcarInadimplente: (clienteId: number) => void;
  showActions: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Cliente</th>
                <th className="text-left py-2 px-2">Valor</th>
                <th className="text-left py-2 px-2">Forma Pagamento</th>
                <th className="text-left py-2 px-2">Parcelamento</th>
                <th className="text-left py-2 px-2">Vencimento</th>
                {showActions && <th className="text-left py-2 px-2">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={showActions ? 6 : 5} className="py-4 text-center text-gray-500">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                items.map((item: any) => (
                  <tr key={item.cliente.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2">{item.cliente.nome}</td>
                    <td className="py-2 px-2">
                      R$ {parseFloat(item.honorarios?.valorTotal || "0").toFixed(2).replace(".", ",")}
                    </td>
                    <td className="py-2 px-2">{item.honorarios?.formaPagamento || "-"}</td>
                    <td className="py-2 px-2">{item.honorarios?.parcelamento || "-"}</td>
                    <td className="py-2 px-2">
                      {item.honorarios?.dataVencimento
                        ? new Date(item.honorarios.dataVencimento).toLocaleDateString("pt-BR")
                        : "-"}
                    </td>
                    {showActions && (
                      <td className="py-2 px-2 flex gap-2">
                        {item.honorarios && (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                onMarcarRecebido(item.honorarios.id, item.cliente.id)
                              }
                            >
                              <CheckCircle2 size={14} className="mr-1" /> Recebido
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onMarcarInadimplente(item.cliente.id)}
                            >
                              Inadimplente
                            </Button>
                          </>
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
