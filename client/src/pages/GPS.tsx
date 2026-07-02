import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Plus } from "lucide-react";

const FORM_INICIAL = {
  clienteId: "",
  competencia: "",
  vencimento: "",
  valor: "178.00",
};

export default function GPS() {
  const utils = trpc.useUtils();
  const { data: clientes = [] } = trpc.clientes.list.useQuery();
  const { data: gpsByCompetencia = [] } = trpc.gps.listByCompetencia.useQuery();
  const marcarPagaMutation = trpc.gps.marcarPaga.useMutation();
  const createMutation = trpc.gps.create.useMutation();

  const [activeTab, setActiveTab] = useState("a-gerar");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(FORM_INICIAL);

  const handleMarcarPaga = async (gpsId: number, clienteId: number) => {
    try {
      await marcarPagaMutation.mutateAsync({ gpsId, clienteId });
      await utils.gps.listByCompetencia.invalidate();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCadastrarGuia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clienteId) {
      alert("Selecione uma cliente.");
      return;
    }
    try {
      const valorNum = parseFloat(formData.valor.replace(",", "."));
      await createMutation.mutateAsync({
        clienteId: Number(formData.clienteId),
        competencia: formData.competencia,
        vencimento: formData.vencimento,
        valor: isNaN(valorNum) ? undefined : valorNum,
      });
      await utils.gps.listByCompetencia.invalidate();
      setFormData(FORM_INICIAL);
      setShowForm(false);
    } catch (error) {
      console.error(error);
      alert("Não foi possível cadastrar a guia. Verifique os dados e tente novamente.");
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Controle de GPS/Pagamentos</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2" size={18} /> Cadastrar Nova Guia
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Guia</DialogTitle>
            <DialogDescription>
              Preencha os dados da guia (GPS) para adicioná-la ao controle.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCadastrarGuia} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select
                value={formData.clienteId}
                onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Competência</Label>
                <Input
                  placeholder="Ex: 07/2026"
                  value={formData.competencia}
                  onChange={(e) => setFormData({ ...formData, competencia: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Vencimento</Label>
                <Input
                  type="date"
                  value={formData.vencimento}
                  onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="178.00"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setFormData(FORM_INICIAL);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Salvando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
