import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { STATUS_PAGAMENTO, type StatusPagamento } from "@shared/status";

const formatBRL = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor || 0);

// Máscara de moeda: preenche da direita p/ esquerda em centavos -> "1.234,56"
function maskMoeda(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  const reais = (cents / 100).toFixed(2);
  const [inteiro, decimal] = reais.split(".");
  const inteiroFmt = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${inteiroFmt},${decimal}`;
}

// Converte o texto mascarado ("1.234,56") de volta para número (1234.56)
function parseMoeda(masked: string): number {
  if (!masked) return 0;
  return parseFloat(masked.replace(/\./g, "").replace(",", ".")) || 0;
}

const FORM_INICIAL = {
  clienteId: 0,
  valorTotal: "",
  formaPagamento: "PIX",
  parcelamento: "À vista",
  dataVencimento: new Date().toISOString().split("T")[0],
  valorPrimeiraParcela: "",
  vencimentoSegundaParcela: "",
  observacoes: "",
};

export default function Honorarios() {
  const utils = trpc.useUtils();
  const { data: clientes = [] } = trpc.clientes.list.useQuery();
  const { data: pendentes = [] } = trpc.honorarios.listByStatus.useQuery({ status: "pendentes" });
  const { data: recebidos = [] } = trpc.honorarios.listByStatus.useQuery({ status: "recebidos" });
  const { data: inadimplentes = [] } = trpc.honorarios.listByStatus.useQuery({ status: "inadimplentes" });

  const registrarMutation = trpc.honorarios.registrarCobranca.useMutation();
  const atualizarStatusMutation = trpc.honorarios.atualizarStatusPagamento.useMutation();
  const marcarInadimplenteMutation = trpc.honorarios.marcarInadimplente.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ...FORM_INICIAL });

  // Atualiza honorários (abas) e os gráficos/cards do Dashboard.
  const refetchTudo = async () => {
    await Promise.all([
      utils.honorarios.listByStatus.invalidate(),
      utils.graficos.invalidate(),
    ]);
  };

  const handleRegistrarCobranca = async (e: React.FormEvent) => {
    e.preventDefault();
    const valorTotal = parseMoeda(formData.valorTotal);
    if (!formData.clienteId) {
      toast.error("Selecione uma cliente");
      return;
    }
    if (valorTotal <= 0) {
      toast.error("Informe o valor total");
      return;
    }
    try {
      await registrarMutation.mutateAsync({
        clienteId: parseInt(formData.clienteId.toString()),
        valorTotal,
        formaPagamento: formData.formaPagamento,
        parcelamento: formData.parcelamento,
        dataVencimento: new Date(formData.dataVencimento),
        valorPrimeiraParcela: parseMoeda(formData.valorPrimeiraParcela) || undefined,
        vencimentoSegundaParcela: formData.vencimentoSegundaParcela
          ? new Date(formData.vencimentoSegundaParcela)
          : undefined,
        observacoes: formData.observacoes || undefined,
      });
      setFormData({ ...FORM_INICIAL });
      setShowForm(false);
      await refetchTudo();
      toast.success("Cobrança registrada");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível registrar a cobrança");
    }
  };

  const handleAtualizarStatus = async (honorarioId: number, statusPagamento: StatusPagamento) => {
    try {
      await atualizarStatusMutation.mutateAsync({ honorarioId, statusPagamento });
      await refetchTudo();
      toast.success("Status de pagamento atualizado");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível atualizar o pagamento");
    }
  };

  const handleMarcarInadimplente = async (clienteId: number) => {
    try {
      await marcarInadimplenteMutation.mutateAsync({ clienteId });
      await refetchTudo();
      toast.success("Cliente marcada como inadimplente");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível marcar como inadimplente");
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Cliente</label>
                  <select
                    value={formData.clienteId}
                    onChange={(e) => setFormData({ ...formData, clienteId: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded mt-1"
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
                <div>
                  <label className="text-sm font-medium">Valor Total (R$)</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={formData.valorTotal}
                    onChange={(e) => setFormData({ ...formData, valorTotal: maskMoeda(e.target.value) })}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Forma de Pagamento</label>
                  <select
                    value={formData.formaPagamento}
                    onChange={(e) => setFormData({ ...formData, formaPagamento: e.target.value })}
                    className="w-full p-2 border rounded mt-1"
                  >
                    <option>PIX</option>
                    <option>Boleto</option>
                    <option>Outro</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Parcelamento</label>
                  <select
                    value={formData.parcelamento}
                    onChange={(e) => setFormData({ ...formData, parcelamento: e.target.value })}
                    className="w-full p-2 border rounded mt-1"
                  >
                    <option>À vista</option>
                    <option>2x</option>
                    <option>3x</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Data Vencimento</label>
                  <Input
                    type="date"
                    value={formData.dataVencimento}
                    onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Valor 1ª Parcela (R$)</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={formData.valorPrimeiraParcela}
                    onChange={(e) => setFormData({ ...formData, valorPrimeiraParcela: maskMoeda(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Vencimento 2ª Parcela</label>
                  <Input
                    type="date"
                    value={formData.vencimentoSegundaParcela}
                    onChange={(e) => setFormData({ ...formData, vencimentoSegundaParcela: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Observações</label>
                <textarea
                  className="w-full p-2 border rounded mt-1"
                  rows={2}
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Registrar</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
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
            onAtualizarStatus={handleAtualizarStatus}
            onMarcarInadimplente={handleMarcarInadimplente}
            showInadimplente={true}
          />
        </TabsContent>

        <TabsContent value="boletos">
          <HonorariosTable
            items={pendentes.filter((p: any) => p.honorario?.formaPagamento === "Boleto")}
            onAtualizarStatus={handleAtualizarStatus}
            onMarcarInadimplente={handleMarcarInadimplente}
            showInadimplente={true}
          />
        </TabsContent>

        <TabsContent value="recebidos">
          <HonorariosTable
            items={recebidos}
            onAtualizarStatus={handleAtualizarStatus}
            onMarcarInadimplente={handleMarcarInadimplente}
            showInadimplente={false}
          />
        </TabsContent>

        <TabsContent value="inadimplentes">
          <HonorariosTable
            items={inadimplentes}
            onAtualizarStatus={handleAtualizarStatus}
            onMarcarInadimplente={handleMarcarInadimplente}
            showInadimplente={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HonorariosTable({
  items,
  onAtualizarStatus,
  onMarcarInadimplente,
  showInadimplente,
}: {
  items: any[];
  onAtualizarStatus: (honorarioId: number, statusPagamento: StatusPagamento) => void;
  onMarcarInadimplente: (clienteId: number) => void;
  showInadimplente: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Cliente</th>
                <th className="text-left py-2 px-2">Valor Total</th>
                <th className="text-left py-2 px-2">Recebido</th>
                <th className="text-left py-2 px-2">Forma Pagamento</th>
                <th className="text-left py-2 px-2">Parcelamento</th>
                <th className="text-left py-2 px-2">Vencimento</th>
                <th className="text-left py-2 px-2">Status Pagamento</th>
                {showInadimplente && <th className="text-left py-2 px-2">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={showInadimplente ? 8 : 7} className="py-4 text-center text-gray-500">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                items.map((item: any) => {
                  const hon = item.honorario;
                  return (
                    <tr key={hon?.id ?? item.cliente.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2">{item.cliente.nome}</td>
                      <td className="py-2 px-2">{formatBRL(parseFloat(hon?.valorTotal || "0"))}</td>
                      <td className="py-2 px-2 text-green-600">{formatBRL(item.recebido || 0)}</td>
                      <td className="py-2 px-2">{hon?.formaPagamento || "-"}</td>
                      <td className="py-2 px-2">{hon?.parcelamento || "-"}</td>
                      <td className="py-2 px-2">
                        {hon?.dataVencimento
                          ? new Date(hon.dataVencimento).toLocaleDateString("pt-BR")
                          : "-"}
                      </td>
                      <td className="py-2 px-2">
                        {hon ? (
                          <select
                            value={hon.statusPagamento || "Pendente"}
                            onChange={(e) => onAtualizarStatus(hon.id, e.target.value as StatusPagamento)}
                            className="p-1 border rounded text-sm"
                          >
                            {STATUS_PAGAMENTO.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        ) : (
                          "-"
                        )}
                      </td>
                      {showInadimplente && (
                        <td className="py-2 px-2">
                          {hon && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onMarcarInadimplente(item.cliente.id)}
                            >
                              Inadimplente
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
