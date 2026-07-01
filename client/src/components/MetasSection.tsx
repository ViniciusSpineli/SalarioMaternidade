import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CardMeta } from "./CardMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function MetasSection() {
  const utils = trpc.useUtils();
  const [periodo, setPeriodo] = useState<"mes" | "trimestre" | "ano">("mes");
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    valorMeta: "",
    descricao: "",
  });

  const { data: metas = [] } = trpc.metas.list.useQuery();
  const { data: resumo } = trpc.graficos.getResumoPorPeriodo.useQuery({ tipo: periodo });
  const { data: metaAtual } = trpc.metas.getByPeriodo.useQuery({
    tipo: periodo,
    periodo: getPeriodoAtual(periodo),
  });

  const createMeta = trpc.metas.create.useMutation({
    onSuccess: () => {
      toast.success("Meta criada com sucesso!");
      setFormData({ valorMeta: "", descricao: "" });
      setIsOpen(false);
      utils.metas.list.invalidate();
      utils.metas.getByPeriodo.invalidate();
    },
    onError: () => {
      toast.error("Erro ao criar meta");
    },
  });

  const deleteMeta = trpc.metas.delete.useMutation({
    onSuccess: () => {
      toast.success("Meta removida com sucesso!");
      utils.metas.list.invalidate();
      utils.metas.getByPeriodo.invalidate();
    },
    onError: () => {
      toast.error("Erro ao remover meta");
    },
  });

  function getPeriodoAtual(tipo: "mes" | "trimestre" | "ano"): string {
    const hoje = new Date();
    if (tipo === "mes") {
      return `${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;
    } else if (tipo === "trimestre") {
      const trimestre = Math.floor(hoje.getMonth() / 3) + 1;
      return `Q${trimestre}/${hoje.getFullYear()}`;
    } else {
      return hoje.getFullYear().toString();
    }
  }

  const handleCreateMeta = async () => {
    if (!formData.valorMeta) {
      toast.error("Informe o valor da meta");
      return;
    }

    await createMeta.mutateAsync({
      tipo: periodo,
      periodo: getPeriodoAtual(periodo),
      valorMeta: parseFloat(formData.valorMeta),
      descricao: formData.descricao || undefined,
    });
  };

  const getPeriodoLabel = () => {
    if (periodo === "mes") return "Este Mês";
    if (periodo === "trimestre") return "Este Trimestre";
    return "Este Ano";
  };

  return (
    <div className="space-y-4">
      {/* Card de Meta Atual */}
      {metaAtual && resumo && (
        <CardMeta
          titulo={`Meta de Honorários - ${getPeriodoLabel()}`}
          meta={metaAtual.valorMeta}
          realizado={resumo.recebido}
          periodo={metaAtual.periodo}
          onDelete={() => deleteMeta.mutate({ id: metaAtual.id })}
        />
      )}

      {/* Card para criar nova meta */}
      {!metaAtual && (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-3 py-6">
              <p className="text-sm text-muted-foreground text-center">
                Nenhuma meta estabelecida para {getPeriodoLabel().toLowerCase()}
              </p>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus size={16} className="mr-2" />
                    Criar Meta
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Meta</DialogTitle>
                    <DialogDescription>
                      Estabeleça uma meta de honorários para {getPeriodoLabel().toLowerCase()}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tipo">Período</Label>
                      <Select value={periodo} onValueChange={(v: any) => setPeriodo(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mes">Mês</SelectItem>
                          <SelectItem value="trimestre">Trimestre</SelectItem>
                          <SelectItem value="ano">Ano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="valor">Valor da Meta (R$)</Label>
                      <Input
                        id="valor"
                        type="number"
                        placeholder="0.00"
                        value={formData.valorMeta}
                        onChange={(e) =>
                          setFormData({ ...formData, valorMeta: e.target.value })
                        }
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="descricao">Descrição (opcional)</Label>
                      <Input
                        id="descricao"
                        placeholder="Ex: Meta agressiva para Q1"
                        value={formData.descricao}
                        onChange={(e) =>
                          setFormData({ ...formData, descricao: e.target.value })
                        }
                      />
                    </div>

                    <Button
                      onClick={handleCreateMeta}
                      disabled={createMeta.isPending}
                      className="w-full"
                    >
                      {createMeta.isPending ? "Criando..." : "Criar Meta"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seletor de Período */}
      <div className="flex gap-2">
        <Button
          variant={periodo === "mes" ? "default" : "outline"}
          size="sm"
          onClick={() => setPeriodo("mes")}
        >
          Mês
        </Button>
        <Button
          variant={periodo === "trimestre" ? "default" : "outline"}
          size="sm"
          onClick={() => setPeriodo("trimestre")}
        >
          Trimestre
        </Button>
        <Button
          variant={periodo === "ano" ? "default" : "outline"}
          size="sm"
          onClick={() => setPeriodo("ano")}
        >
          Ano
        </Button>
      </div>
    </div>
  );
}
