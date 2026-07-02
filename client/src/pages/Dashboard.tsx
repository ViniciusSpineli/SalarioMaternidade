import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, Clock, Users, Scale, FileSignature, Baby, DollarSign, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraficoHonorarios } from "@/components/GraficoHonorarios";
import { MetasSection } from "@/components/MetasSection";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor || 0);

export default function Dashboard() {
  const { data: clientes = [] } = trpc.clientes.list.useQuery();
  const { data: gpsByCompetencia = [] } = trpc.gps.listByCompetencia.useQuery();
  const { data: resumoHon } = trpc.graficos.getResumoHonorarios.useQuery();

  const porStatus = (status: string) => clientes.filter(c => c.statusProcesso === status).length;

  const stats = {
    clientesAtivas: porStatus("Cliente ativa"),
    clientesInativas: porStatus("Cliente inativa"),
    aguardandoAssinatura: porStatus("Aguardando assinatura"),
    aguardandoCertidao: porStatus("Aguardando certidão"),
    emAnalise: porStatus("Em análise INSS"),
    emRecurso: porStatus("Em recurso INSS"),
    beneficiosConcedidos: porStatus("Benefício concedido"),
    gpsAGerar: gpsByCompetencia.reduce((acc: number, comp: any) => acc + (comp.pendentes || 0), 0),
    honorariosPendentes: resumoHon?.pendente ?? 0,
    honorariosRecebidos: resumoHon?.recebido ?? 0,
    inadimplentes: clientes.filter(c => c.inadimplente).length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Clientes Ativas" value={stats.clientesAtivas} icon={Users} color="bg-rose-500" />
        <StatCard title="Clientes Inativas" value={stats.clientesInativas} icon={UserX} color="bg-gray-500" />
        <StatCard title="Aguardando Assinatura" value={stats.aguardandoAssinatura} icon={FileSignature} color="bg-sky-500" />
        <StatCard title="Aguardando Certidão" value={stats.aguardandoCertidao} icon={Baby} color="bg-amber-500" />
        <StatCard title="Em Análise INSS" value={stats.emAnalise} icon={Clock} color="bg-purple-500" />
        <StatCard title="Em Recurso INSS" value={stats.emRecurso} icon={Scale} color="bg-red-500" />
        <StatCard title="Benefícios Concedidos" value={stats.beneficiosConcedidos} icon={CheckCircle2} color="bg-green-500" />
        <StatCard title="GPS a Gerar" value={stats.gpsAGerar} icon={Clock} color="bg-yellow-500" />
        <StatCard title="Honorários Pendentes" value={formatarMoeda(stats.honorariosPendentes)} icon={DollarSign} color="bg-orange-500" />
        <StatCard title="Honorários Recebidos" value={formatarMoeda(stats.honorariosRecebidos)} icon={DollarSign} color="bg-emerald-500" />
        <StatCard title="Inadimplentes" value={stats.inadimplentes} icon={AlertCircle} color="bg-red-700" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alertas Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.emRecurso > 0 || stats.aguardandoCertidao > 0 || stats.gpsAGerar > 0 || stats.honorariosPendentes > 0 ? (
            <div className="space-y-3">
              {stats.emRecurso > 0 && (
                <AlertItem
                  type="urgente"
                  title="Em Recurso INSS"
                  message={`${stats.emRecurso} cliente(s) em recurso no INSS requerem acompanhamento`}
                />
              )}
              {stats.aguardandoCertidao > 0 && (
                <AlertItem
                  type="atencao"
                  title="Aguardando Certidão"
                  message={`${stats.aguardandoCertidao} cliente(s) pendentes de enviar a certidão de nascimento`}
                />
              )}
              {stats.gpsAGerar > 0 && (
                <AlertItem
                  type="atencao"
                  title="GPS a Gerar"
                  message={`${stats.gpsAGerar} GPS aguardando geração/pagamento`}
                />
              )}
              {stats.honorariosPendentes > 0 && (
                <AlertItem
                  type="atencao"
                  title="Honorários Pendentes"
                  message={`${formatarMoeda(stats.honorariosPendentes)} em honorários a receber`}
                />
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-green-600">
              <CheckCircle2 className="mx-auto mb-2" size={32} />
              <p>Nenhum alerta ativo. Sistema operando normalmente.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ResumoHonorariosPorPeriodo />

      <MetasSection />

      <GraficoHonorarios />
    </div>
  );
}

function ResumoHonorariosPorPeriodo() {
  const [periodo, setPeriodo] = useState<"mes" | "trimestre" | "ano">("mes");
  const { data: resumo } = trpc.graficos.getResumoPorPeriodo.useQuery({ tipo: periodo });

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const getPeriodoLabel = () => {
    if (periodo === "mes") return "Este Mês";
    if (periodo === "trimestre") return "Este Trimestre";
    return "Este Ano";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle>Resumo de Honorários - {getPeriodoLabel()}</CardTitle>
          <div className="flex gap-2 flex-wrap">
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
      </CardHeader>
      <CardContent>
        {resumo ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-muted-foreground mb-1">Recebido</p>
              <p className="text-2xl font-bold text-green-600">{formatarMoeda(resumo.recebido)}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-muted-foreground mb-1">Pendente</p>
              <p className="text-2xl font-bold text-orange-600">{formatarMoeda(resumo.pendente)}</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950 p-4 rounded-lg border border-rose-200 dark:border-rose-800">
              <p className="text-sm text-muted-foreground mb-1">Total</p>
              <p className="text-2xl font-bold text-rose-600">{formatarMoeda(resumo.total)}</p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`${color} p-3 rounded-lg text-white`}>
            <Icon size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertItem({
  type,
  title,
  message,
}: {
  type: "urgente" | "atencao";
  title: string;
  message: string;
}) {
  const bgColor = type === "urgente" ? "bg-red-50 dark:bg-red-950" : "bg-yellow-50 dark:bg-yellow-950";
  const borderColor = type === "urgente" ? "border-red-200 dark:border-red-800" : "border-yellow-200 dark:border-yellow-800";
  const textColor = type === "urgente" ? "text-red-600" : "text-yellow-600";
  const iconColor = type === "urgente" ? "text-red-500" : "text-yellow-500";

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 flex gap-3`}>
      <AlertCircle className={`${iconColor} flex-shrink-0 mt-0.5`} size={20} />
      <div>
        <p className={`font-semibold ${textColor}`}>{title}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
