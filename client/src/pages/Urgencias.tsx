import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Baby } from "lucide-react";
import { toast } from "sonner";

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
  const diff = Math.floor((hoje.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function AguardandoCertidao() {
  const utils = trpc.useUtils();
  const { data: clientes = [] } = trpc.clientes.list.useQuery();
  const updateMutation = trpc.clientes.update.useMutation();
  const avancarMutation = trpc.clientes.avancarEtapa.useMutation();

  // Etapa 6 = Aguardando Certidão de Nascimento
  const aguardando = clientes.filter((c: any) => c.etapa === 6);

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
      // Avança para 'Pronto p/ Protocolo' (etapa 7)
      await avancarMutation.mutateAsync({ id, novaEtapa: 7 });
      await utils.clientes.list.invalidate();
      toast.success("Certidão recebida! Cliente movida para Pronto p/ Protocolo.");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível concluir");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Baby className="text-rose-500" size={24} />
        <h1 className="text-2xl font-bold">Aguardando Certidão de Nascimento</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Clientes que já tiveram o parto e estão pendentes de enviar a certidão de nascimento.
        Confirme a data do parto e marque quando a certidão chegar.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Pendentes ({aguardando.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {aguardando.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma cliente aguardando certidão de nascimento no momento.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Cliente</th>
                    <th className="text-left py-2 px-2">Telefone</th>
                    <th className="text-left py-2 px-2">DPP</th>
                    <th className="text-left py-2 px-2">Data do Parto</th>
                    <th className="text-left py-2 px-2">Dias desde o parto</th>
                    <th className="text-left py-2 px-2">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {aguardando.map((c: any) => {
                    const dias = diasDesde(c.dataNascimento);
                    return (
                      <tr key={c.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2 font-medium">{c.nome}</td>
                        <td className="py-2 px-2">{c.telefone || "-"}</td>
                        <td className="py-2 px-2">
                          {c.dpp ? new Date(c.dpp).toLocaleDateString("pt-BR") : "-"}
                        </td>
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
                            <span
                              className={
                                dias > 30
                                  ? "text-red-600 font-semibold"
                                  : "text-gray-700"
                              }
                            >
                              {dias} dia(s)
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          <Button
                            size="sm"
                            onClick={() => handleCertidaoRecebida(c.id)}
                            disabled={avancarMutation.isPending}
                          >
                            <CheckCircle2 size={14} className="mr-1" /> Certidão Recebida
                          </Button>
                        </td>
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
