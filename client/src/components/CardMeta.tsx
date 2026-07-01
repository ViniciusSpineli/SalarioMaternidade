import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";

interface CardMetaProps {
  titulo: string;
  meta: number;
  realizado: number;
  periodo: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function CardMeta({
  titulo,
  meta,
  realizado,
  periodo,
  onEdit,
  onDelete,
}: CardMetaProps) {
  const percentual = meta > 0 ? (realizado / meta) * 100 : 0;
  const percentualArredondado = Math.round(percentual);

  // Determinar cor baseada no percentual
  const getStatusColor = (percent: number) => {
    if (percent >= 100) return { bg: "bg-green-50 dark:bg-green-950", border: "border-green-200 dark:border-green-800", text: "text-green-600", progress: "bg-green-500" };
    if (percent >= 75) return { bg: "bg-rose-50 dark:bg-rose-950", border: "border-rose-200 dark:border-rose-800", text: "text-rose-600", progress: "bg-rose-500" };
    if (percent >= 50) return { bg: "bg-yellow-50 dark:bg-yellow-950", border: "border-yellow-200 dark:border-yellow-800", text: "text-yellow-600", progress: "bg-yellow-500" };
    return { bg: "bg-orange-50 dark:bg-orange-950", border: "border-orange-200 dark:border-orange-800", text: "text-orange-600", progress: "bg-orange-500" };
  };

  const status = getStatusColor(percentualArredondado);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const getStatusLabel = (percent: number) => {
    if (percent >= 100) return "✓ Meta Atingida";
    if (percent >= 75) return "Próximo de atingir";
    if (percent >= 50) return "No caminho";
    return "Abaixo da meta";
  };

  return (
    <Card className={`${status.bg} border ${status.border}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{titulo}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{periodo}</p>
          </div>
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0"
              >
                <Edit2 size={16} />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Valores */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Realizado</p>
            <p className="text-lg font-bold text-green-600">{formatarMoeda(realizado)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Meta</p>
            <p className="text-lg font-bold text-muted-foreground">{formatarMoeda(meta)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-semibold ${status.text}`}>
              {percentualArredondado}%
            </p>
            <p className="text-xs text-muted-foreground">{getStatusLabel(percentualArredondado)}</p>
          </div>
          <Progress
            value={Math.min(percentualArredondado, 100)}
            className="h-2"
          />
        </div>

        {/* Diferença */}
        <div className="pt-2 border-t border-current/10">
          <p className="text-xs text-muted-foreground">
            {realizado >= meta ? (
              <span className="text-green-600 font-semibold">
                ✓ {formatarMoeda(realizado - meta)} acima da meta
              </span>
            ) : (
              <span className="text-orange-600 font-semibold">
                Faltam {formatarMoeda(meta - realizado)} para atingir a meta
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
