import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2 } from "lucide-react";

export default function Urgencias() {
  const { data: urgentes = [], refetch } = trpc.urgencias.listUrgentes.useQuery();
  const marcarTarefaMutation = trpc.urgencias.marcarTarefaConcluida.useMutation();
  const adicionarTarefaMutation = trpc.urgencias.adicionarTarefa.useMutation();

  const [novasTarefas, setNovasTarefas] = useState<Record<number, string>>({});

  const handleMarcarTarefa = async (tarefaId: number, concluida: boolean) => {
    try {
      await marcarTarefaMutation.mutateAsync({ tarefaId, concluida: !concluida });
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAdicionarTarefa = async (clienteId: number) => {
    const tarefa = novasTarefas[clienteId];
    if (!tarefa) return;

    try {
      await adicionarTarefaMutation.mutateAsync({ clienteId, tarefa });
      setNovasTarefas({ ...novasTarefas, [clienteId]: "" });
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  if (urgentes.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Casos Urgentes</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma cliente em urgência absoluta no momento.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Casos Urgentes</h1>

      {urgentes.map((item: any) => (
        <Card key={item.cliente.id} className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">
              {item.cliente.nome} - URGÊNCIA ABSOLUTA
            </CardTitle>
            <p className="text-sm text-red-700 mt-2">
              CPF: {item.cliente.cpf} | DPP: {new Date(item.cliente.dpp).toLocaleDateString("pt-BR")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Checklist de Tarefas</h3>
              <div className="space-y-2">
                {item.tarefas && item.tarefas.length > 0 ? (
                  item.tarefas.map((tarefa: any) => (
                    <div
                      key={tarefa.id}
                      className="flex items-center gap-3 p-2 bg-white rounded border"
                    >
                      <input
                        type="checkbox"
                        checked={tarefa.concluida}
                        onChange={() => handleMarcarTarefa(tarefa.id, tarefa.concluida)}
                        className="w-4 h-4"
                      />
                      <span
                        className={tarefa.concluida ? "line-through text-gray-500" : ""}
                      >
                        {tarefa.tarefa}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Nenhuma tarefa registrada</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Adicionar nova tarefa..."
                value={novasTarefas[item.cliente.id] || ""}
                onChange={(e) =>
                  setNovasTarefas({
                    ...novasTarefas,
                    [item.cliente.id]: e.target.value,
                  })
                }
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAdicionarTarefa(item.cliente.id);
                  }
                }}
              />
              <Button
                onClick={() => handleAdicionarTarefa(item.cliente.id)}
              >
                <Plus size={18} /> Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
