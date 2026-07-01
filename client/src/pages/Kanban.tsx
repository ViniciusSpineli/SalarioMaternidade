import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

const ETAPAS = [
  { id: 0, nome: "Novas Clientes" },
  { id: 1, nome: "Competência Calculada" },
  { id: 2, nome: "GPS a Gerar" },
  { id: 3, nome: "Pag. GPS Pendente" },
  { id: 4, nome: "GPS Paga" },
  { id: 5, nome: "Aguardando Nascimento" },
  { id: 6, nome: "Docs do Parto" },
  { id: 7, nome: "Pronto p/ Protocolo" },
  { id: 8, nome: "Benefício Protocolado" },
  { id: 9, nome: "Em Análise INSS" },
  { id: 10, nome: "Benefício Concedido" },
  { id: 11, nome: "Cobrança Honorários" },
  { id: 12, nome: "Honorários Pendentes" },
  { id: 13, nome: "Honorários Recebidos" },
  { id: 14, nome: "Inadimplente" },
];

export default function Kanban() {
  const { data: clientes = [] } = trpc.clientes.list.useQuery();
  const [selectedCliente, setSelectedCliente] = useState<any>(null);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Kanban - Fluxo de Clientes</h1>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {ETAPAS.map((etapa) => {
            const clientesEtapa = clientes.filter(c => c.etapa === etapa.id);
            return (
              <div
                key={etapa.id}
                className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4"
              >
                <div className="mb-4">
                  <h2 className="font-bold text-sm text-gray-700">
                    {etapa.nome}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {clientesEtapa.length} cliente(s)
                  </p>
                </div>

                <div className="space-y-2">
                  {clientesEtapa.map((cliente) => (
                    <Card
                      key={cliente.id}
                      className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedCliente(cliente)}
                    >
                      <p className="font-semibold text-sm">{cliente.nome}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        CPF: {cliente.cpf}
                      </p>
                      {cliente.dpp && (
                        <p className="text-xs text-gray-600">
                          DPP: {new Date(cliente.dpp).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                      {cliente.urgenteAbsoluta && (
                        <div className="mt-2">
                          <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                            URGÊNCIA ABSOLUTA
                          </span>
                        </div>
                      )}
                    </Card>
                  ))}
                  {clientesEtapa.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">
                      Nenhuma cliente nesta etapa
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
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">CPF:</span> {cliente.cpf}
            </p>
            <p>
              <span className="font-semibold">Telefone:</span> {cliente.telefone || "-"}
            </p>
            <p>
              <span className="font-semibold">Origem:</span> {cliente.origem || "-"}
            </p>
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
              <p>
                <span className="font-semibold">Observações:</span>{" "}
                {cliente.observacoes}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
