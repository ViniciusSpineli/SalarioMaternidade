import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { statusFromSlug, STATUS_META } from "@shared/status";

// Converte uma data (Date ou ISO) para o formato do input date (yyyy-mm-dd)
function toDateInput(value: unknown): string {
  if (!value) return "";
  const d = new Date(value as string);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

// Dias decorridos desde uma data até hoje (null se sem data)
function diasDesde(value: unknown): number | null {
  if (!value) return null;
  const d = new Date(value as string);
  if (isNaN(d.getTime())) return null;
  const hoje = new Date();
  return Math.floor((hoje.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function formatarData(value: unknown): string {
  if (!value) return "-";
  const d = new Date(value as string);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}

export default function ClientesPorStatus() {
  const [, params] = useRoute("/status/:slug");
  const slug = params?.slug ?? "";
  const status = statusFromSlug(slug);

  const utils = trpc.useUtils();
  const { data: clientes = [] } = trpc.clientes.list.useQuery();
  const updateMutation = trpc.clientes.update.useMutation();

  if (!status) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Status não encontrado</h1>
        <Card>
          <CardContent className="pt-6 text-gray-500">
            O filtro de status solicitado não existe.
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCertidao = status === "Aguardando certidão";
  const lista = clientes.filter((c: any) => c.statusProcesso === status);

  const handleSalvarDataParto = async (id: number, valor: string) => {
    try {
      await updateMutation.mutateAsync({
        id,
        dataNascimento: valor ? new Date(valor) : undefined,
      });
      await utils.clientes.list.invalidate();
      toast.success("Data do parto atualizada");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível salvar a data do parto");
    }
  };

  const handleCertidaoRecebida = async (id: number) => {
    try {
      await updateMutation.mutateAsync({ id, statusProcesso: "Em análise INSS" });
      await utils.clientes.list.invalidate();
      toast.success("Certidão recebida! Cliente movida para Em Análise INSS.");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível concluir");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{STATUS_META[status].emoji}</span>
        <h1 className="text-2xl font-bold">{status}</h1>
      </div>
      {isCertidao && (
        <p className="text-sm text-muted-foreground">
          Clientes que já tiveram o parto e estão pendentes de enviar a certidão de nascimento.
          Confirme a data do parto e marque quando a certidão chegar.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Clientes ({lista.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {lista.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma cliente com este status no momento.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Nome</th>
                    <th className="text-left py-2 px-2">CPF</th>
                    <th className="text-left py-2 px-2">Telefone</th>
                    {isCertidao ? (
                      <>
                        <th className="text-left py-2 px-2">DPP</th>
                        <th className="text-left py-2 px-2">Data do Parto</th>
                        <th className="text-left py-2 px-2">Dias desde o parto</th>
                        <th className="text-left py-2 px-2">Ação</th>
                      </>
                    ) : (
                      <>
                        <th className="text-left py-2 px-2">Status Atual</th>
                        <th className="text-left py-2 px-2">Última Atualização</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {lista.map((c: any) => {
                    const dias = diasDesde(c.dataNascimento);
                    return (
                      <tr key={c.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2 font-medium">{c.nome}</td>
                        <td className="py-2 px-2">{c.cpf}</td>
                        <td className="py-2 px-2">{c.telefone || "-"}</td>
                        {isCertidao ? (
                          <>
                            <td className="py-2 px-2">{formatarData(c.dpp)}</td>
                            <td className="py-2 px-2">
                              <Input
                                type="date"
                                defaultValue={toDateInput(c.dataNascimento)}
                                onBlur={(e) => {
                                  const novo = e.target.value;
                                  if (novo !== toDateInput(c.dataNascimento)) {
                                    handleSalvarDataParto(c.id, novo);
                                  }
                                }}
                                className="w-40"
                              />
                            </td>
                            <td className="py-2 px-2">
                              {dias === null ? (
                                <span className="text-gray-400">-</span>
                              ) : (
                                <span className={dias > 30 ? "text-red-600 font-semibold" : "text-gray-700"}>
                                  {dias} dia(s)
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2">
                              <Button
                                size="sm"
                                onClick={() => handleCertidaoRecebida(c.id)}
                                disabled={updateMutation.isPending}
                              >
                                <CheckCircle2 size={14} className="mr-1" /> Certidão Recebida
                              </Button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 px-2">{c.statusProcesso}</td>
                            <td className="py-2 px-2">{formatarData(c.updatedAt)}</td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
