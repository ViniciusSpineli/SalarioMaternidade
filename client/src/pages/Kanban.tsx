import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { STATUS_PROCESSO, STATUS_META, type StatusProcesso } from "@shared/status";

export default function Kanban() {
  const utils = trpc.useUtils();
  const { data: clientes = [] } = trpc.clientes.list.useQuery();
  const updateMutation = trpc.clientes.update.useMutation();

  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  const moverCliente = async (id: number, statusProcesso: StatusProcesso) => {
    try {
      await updateMutation.mutateAsync({ id, statusProcesso });
      await utils.clientes.list.invalidate();
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível mover a cliente");
    }
  };

  const handleDrop = (e: React.DragEvent, status: StatusProcesso) => {
    e.preventDefault();
    setDragOverStatus(null);
    const id = Number(e.dataTransfer.getData("clienteId"));
    if (!id) return;
    const cliente = clientes.find((c: any) => c.id === id);
    if (cliente && cliente.statusProcesso !== status) {
      moverCliente(id, status);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Kanban - Fluxo de Clientes</h1>
      <p className="text-sm text-muted-foreground">
        Arraste um cartão para outra coluna para mudar o status da cliente.
      </p>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {STATUS_PROCESSO.map((status) => {
            const clientesEtapa = clientes.filter((c: any) => c.statusProcesso === status);
            const isOver = dragOverStatus === status;
            return (
              <div
                key={status}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStatus(status);
                }}
                onDragLeave={() => setDragOverStatus((s) => (s === status ? null : s))}
                onDrop={(e) => handleDrop(e, status)}
                className={`flex-shrink-0 w-80 rounded-lg p-4 transition-colors ${
                  isOver ? "bg-rose-100 ring-2 ring-rose-300" : "bg-gray-50"
                }`}
              >
                <div className="mb-4">
                  <h2 className="font-bold text-sm text-gray-700">
                    {STATUS_META[status].emoji} {status}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {clientesEtapa.length} cliente(s)
                  </p>
                </div>

                <div className="space-y-2 min-h-[60px]">
                  {clientesEtapa.map((cliente: any) => (
                    <Card
                      key={cliente.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("clienteId", String(cliente.id));
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                      onClick={() => setSelectedCliente(cliente)}
                    >
                      <p className="font-semibold text-sm">{cliente.nome}</p>
                      <p className="text-xs text-gray-600 mt-1">CPF: {cliente.cpf}</p>
                      {cliente.dpp && (
                        <p className="text-xs text-gray-600">
                          DPP: {new Date(cliente.dpp).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </Card>
                  ))}
                  {clientesEtapa.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">
                      Nenhuma cliente nesta coluna
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedCliente && (
        <ClienteDetailModal
          cliente={selectedCliente}
          onClose={() => setSelectedCliente(null)}
        />
      )}
    </div>
  );
}

function ClienteDetailModal({
  cliente,
  onClose,
}: {
  cliente: any;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const updateMutation = trpc.clientes.update.useMutation();
  const [statusAtual, setStatusAtual] = useState<StatusProcesso>(cliente.statusProcesso);

  const handleMudarStatus = async (novoStatus: StatusProcesso) => {
    const anterior = statusAtual;
    setStatusAtual(novoStatus);
    try {
      await updateMutation.mutateAsync({ id: cliente.id, statusProcesso: novoStatus });
      await utils.clientes.list.invalidate();
      toast.success("Status atualizado");
    } catch (error) {
      console.error(error);
      setStatusAtual(anterior);
      toast.error("Não foi possível atualizar o status");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <Card
        className="w-96 max-h-96 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold">{cliente.nome}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <p><span className="font-semibold">CPF:</span> {cliente.cpf}</p>
            <p><span className="font-semibold">Telefone:</span> {cliente.telefone || "-"}</p>
            <p><span className="font-semibold">Origem:</span> {cliente.origem || "-"}</p>
            <p>
              <span className="font-semibold">Contratação:</span>{" "}
              {new Date(cliente.dataContratacao).toLocaleDateString("pt-BR")}
            </p>
            <p>
              <span className="font-semibold">DPP:</span>{" "}
              {new Date(cliente.dpp).toLocaleDateString("pt-BR")}
            </p>
            {cliente.dataNascimento && (
              <p>
                <span className="font-semibold">Nascimento:</span>{" "}
                {new Date(cliente.dataNascimento).toLocaleDateString("pt-BR")}
              </p>
            )}
            {cliente.observacoes && (
              <p><span className="font-semibold">Observações:</span> {cliente.observacoes}</p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t">
            <label className="text-sm font-semibold block mb-1">Status do Processo</label>
            <select
              value={statusAtual}
              onChange={(e) => handleMudarStatus(e.target.value as StatusProcesso)}
              disabled={updateMutation.isPending}
              className="w-full p-2 border rounded text-sm"
            >
              {STATUS_PROCESSO.map((status) => (
                <option key={status} value={status}>
                  {STATUS_META[status].emoji} {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>
    </div>
  );
}
