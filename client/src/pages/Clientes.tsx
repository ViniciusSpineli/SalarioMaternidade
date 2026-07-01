import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Plus, Edit2, Trash2 } from "lucide-react";

// ==================== Máscaras / formatação ====================
// CPF: 000.000.000-00
function formatCPF(value: string): string {
  const d = (value || "").replace(/\D/g, "").slice(0, 11);
  if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
  return d;
}

// Telefone: (00) 00000-0000 (celular) ou (00) 0000-0000 (fixo)
function formatTelefone(value: string): string {
  const d = (value || "").replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Converte uma data (Date ou ISO) para o formato do input date (yyyy-mm-dd)
function toDateInput(value: unknown): string {
  if (!value) return "";
  const d = new Date(value as string);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export default function Clientes() {
  const { data: clientes = [], refetch } = trpc.clientes.list.useQuery();
  const createMutation = trpc.clientes.create.useMutation();
  const updateMutation = trpc.clientes.update.useMutation();
  const deleteMutation = trpc.clientes.delete.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    origem: "",
    dataContratacao: new Date().toISOString().split("T")[0],
    dpp: new Date().toISOString().split("T")[0],
    dataNascimento: "",
    observacoes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          nome: formData.nome,
          cpf: formData.cpf,
          telefone: formData.telefone || undefined,
          origem: formData.origem || undefined,
          dataContratacao: new Date(formData.dataContratacao),
          dpp: new Date(formData.dpp),
          dataNascimento: formData.dataNascimento ? new Date(formData.dataNascimento) : undefined,
          observacoes: formData.observacoes || undefined,
        });
      } else {
        await createMutation.mutateAsync({
          ...formData,
          dataContratacao: new Date(formData.dataContratacao),
          dpp: new Date(formData.dpp),
          dataNascimento: formData.dataNascimento ? new Date(formData.dataNascimento) : undefined,
        });
      }

      setFormData({
        nome: "",
        cpf: "",
        telefone: "",
        origem: "",
        dataContratacao: new Date().toISOString().split("T")[0],
        dpp: new Date().toISOString().split("T")[0],
        dataNascimento: "",
        observacoes: "",
      });
      setShowForm(false);
      setEditingId(null);
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (cliente: any) => {
    setEditingId(cliente.id);
    setFormData({
      nome: cliente.nome ?? "",
      cpf: formatCPF(cliente.cpf ?? ""),
      telefone: formatTelefone(cliente.telefone ?? ""),
      origem: cliente.origem ?? "",
      dataContratacao: toDateInput(cliente.dataContratacao),
      dpp: toDateInput(cliente.dpp),
      dataNascimento: toDateInput(cliente.dataNascimento),
      observacoes: cliente.observacoes ?? "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar esta cliente?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        refetch();
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestão de Clientes</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2" size={18} /> Nova Cliente
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Editar Cliente" : "Cadastrar Nova Cliente"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
                <Input
                  placeholder="CPF (000.000.000-00)"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                  inputMode="numeric"
                  maxLength={14}
                  required
                />
                <Input
                  placeholder="Telefone ((00) 00000-0000)"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: formatTelefone(e.target.value) })}
                  inputMode="numeric"
                  maxLength={15}
                />
                <Input
                  placeholder="Origem"
                  value={formData.origem}
                  onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
                />
                <div>
                  <label className="text-sm font-medium">Data Contratação</label>
                  <Input
                    type="date"
                    value={formData.dataContratacao}
                    onChange={(e) => setFormData({ ...formData, dataContratacao: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">DPP</label>
                  <Input
                    type="date"
                    value={formData.dpp}
                    onChange={(e) => setFormData({ ...formData, dpp: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Data Nascimento</label>
                  <Input
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Observações</label>
                <textarea
                  className="w-full p-2 border rounded"
                  rows={3}
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">{editingId ? "Atualizar" : "Cadastrar"}</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Nome</th>
                  <th className="text-left py-2 px-2">CPF</th>
                  <th className="text-left py-2 px-2">Telefone</th>
                  <th className="text-left py-2 px-2">Origem</th>
                  <th className="text-left py-2 px-2">DPP</th>
                  <th className="text-left py-2 px-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente: any) => (
                  <tr key={cliente.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2">{cliente.nome}</td>
                    <td className="py-2 px-2">{formatCPF(cliente.cpf)}</td>
                    <td className="py-2 px-2">{cliente.telefone ? formatTelefone(cliente.telefone) : "-"}</td>
                    <td className="py-2 px-2">{cliente.origem || "-"}</td>
                    <td className="py-2 px-2">
                      {new Date(cliente.dpp).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-2 px-2 flex gap-2">
                      <button
                        onClick={() => handleEdit(cliente)}
                        className="text-rose-600 hover:text-rose-800"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cliente.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
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
