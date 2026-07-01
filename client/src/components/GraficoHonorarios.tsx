import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type PeriodoType = "mes" | "trimestre" | "ano";

export function GraficoHonorarios() {
  const [periodo, setPeriodo] = useState<PeriodoType>("mes");

  const { data: dadosMensais, isLoading: loadingMensais } = trpc.graficos.getHonorariosMensais.useQuery();
  const { data: dadosTrimestral, isLoading: loadingTrimestral } = trpc.graficos.getHonorariosTrimestral.useQuery();
  const { data: dadosAnual, isLoading: loadingAnual } = trpc.graficos.getHonorariosAnual.useQuery();
  const { data: resumo } = trpc.graficos.getResumoPorPeriodo.useQuery({ tipo: periodo });

  const isLoading = periodo === "mes" ? loadingMensais : periodo === "trimestre" ? loadingTrimestral : loadingAnual;

  const dados = periodo === "mes" ? dadosMensais : periodo === "trimestre" ? dadosTrimestral : dadosAnual;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Honorários</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Formatar valores para exibição
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const getPeriodoLabel = () => {
    if (periodo === "mes") return "Últimos 12 Meses";
    if (periodo === "trimestre") return "Últimos 4 Trimestres";
    return "Últimos 5 Anos";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle>Evolução de Honorários</CardTitle>
            <CardDescription>{getPeriodoLabel()} - Recebido vs Pendente</CardDescription>
          </div>
          {resumo && (
            <div className="text-right space-y-1">
              <div className="text-sm">
                <span className="text-muted-foreground">Recebido: </span>
                <span className="font-semibold text-green-600">{formatarMoeda(resumo.recebido)}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Pendente: </span>
                <span className="font-semibold text-orange-600">{formatarMoeda(resumo.pendente)}</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Botões de filtro */}
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

        {dados && dados.length > 0 ? (
          <div className="space-y-6">
            {/* Gráfico de Linha */}
            <div>
              <h4 className="text-sm font-medium mb-4">Evolução por {periodo === "mes" ? "Mês" : periodo === "trimestre" ? "Trimestre" : "Ano"}</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dados}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey={periodo === "mes" ? "mes" : "periodo"}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: any) => formatarMoeda(value)}
                    labelFormatter={(label) => {
                      if (periodo === "mes") return `Mês: ${label}`;
                      if (periodo === "trimestre") return `Trimestre: ${label}`;
                      return `Ano: ${label}`;
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="recebido" 
                    stroke="#16a34a" 
                    name="Recebido"
                    strokeWidth={2}
                    dot={{ fill: "#16a34a", r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pendente" 
                    stroke="#ea580c" 
                    name="Pendente"
                    strokeWidth={2}
                    dot={{ fill: "#ea580c", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de Barras */}
            <div>
              <h4 className="text-sm font-medium mb-4">Comparativo por {periodo === "mes" ? "Mês" : periodo === "trimestre" ? "Trimestre" : "Ano"}</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dados}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey={periodo === "mes" ? "mes" : "periodo"}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: any) => formatarMoeda(value)}
                    labelFormatter={(label) => {
                      if (periodo === "mes") return `Mês: ${label}`;
                      if (periodo === "trimestre") return `Trimestre: ${label}`;
                      return `Ano: ${label}`;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="recebido" fill="#16a34a" name="Recebido" />
                  <Bar dataKey="pendente" fill="#ea580c" name="Pendente" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            Nenhum dado de honorários disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
}
