import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { honorarios } from "../../drizzle/schema";
import { desc } from "drizzle-orm";
import { valorRecebidoHonorario, valorPendenteHonorario } from "@shared/status";

export const graficosRouter = router({
  // Obter evolução mensal de honorários (últimos 12 meses)
  getHonorariosMensais: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    try {
      // Obter todos os honorários
      const todosHonorarios = await db
        .select()
        .from(honorarios)
        .orderBy(desc(honorarios.createdAt));

      // Agrupar por mês
      const mesesMap = new Map<string, { recebido: number; pendente: number }>();

      // Gerar últimos 12 meses
      const hoje = new Date();
      for (let i = 11; i >= 0; i--) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const mes = `${String(data.getMonth() + 1).padStart(2, "0")}/${data.getFullYear()}`;
        mesesMap.set(mes, { recebido: 0, pendente: 0 });
      }

      // Processar honorários
      todosHonorarios.forEach((h) => {
        if (h.dataVencimento) {
          const data = new Date(h.dataVencimento);
          const mes = `${String(data.getMonth() + 1).padStart(2, "0")}/${data.getFullYear()}`;

          if (mesesMap.has(mes)) {
            mesesMap.get(mes)!.recebido += valorRecebidoHonorario(h);
            mesesMap.get(mes)!.pendente += valorPendenteHonorario(h);
          }
        }
      });

      // Converter para array
      const resultado = Array.from(mesesMap.entries()).map(([mes, dados]) => ({
        mes,
        recebido: dados.recebido,
        pendente: dados.pendente,
        total: dados.recebido + dados.pendente,
      }));

      return resultado;
    } catch (error) {
      console.error("[Gráficos] Erro ao obter honorários mensais:", error);
      return [];
    }
  }),

  // Obter resumo total de honorários
  getResumoHonorarios: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { recebido: 0, pendente: 0, total: 0 };

    try {
      const todosHonorarios = await db.select().from(honorarios);

      let recebido = 0;
      let pendente = 0;

      todosHonorarios.forEach((h) => {
        recebido += valorRecebidoHonorario(h);
        pendente += valorPendenteHonorario(h);
      });

      return {
        recebido,
        pendente,
        total: recebido + pendente,
      };
    } catch (error) {
      console.error("[Gráficos] Erro ao obter resumo de honorários:", error);
      return { recebido: 0, pendente: 0, total: 0 };
    }
  }),

  // Obter dados de honorários por trimestre
  getHonorariosTrimestral: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    try {
      const todosHonorarios = await db.select().from(honorarios);
      const trimestresMap = new Map<string, { recebido: number; pendente: number }>();

      // Gerar últimos 4 trimestres
      const hoje = new Date();
      for (let i = 3; i >= 0; i--) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i * 3, 1);
        const trimestre = Math.floor(data.getMonth() / 3) + 1;
        const chave = `Q${trimestre}/${data.getFullYear()}`;
        trimestresMap.set(chave, { recebido: 0, pendente: 0 });
      }

      // Processar honorários
      todosHonorarios.forEach((h) => {
        if (h.dataVencimento) {
          const data = new Date(h.dataVencimento);
          const trimestre = Math.floor(data.getMonth() / 3) + 1;
          const chave = `Q${trimestre}/${data.getFullYear()}`;

          if (trimestresMap.has(chave)) {
            trimestresMap.get(chave)!.recebido += valorRecebidoHonorario(h);
            trimestresMap.get(chave)!.pendente += valorPendenteHonorario(h);
          }
        }
      });

      return Array.from(trimestresMap.entries()).map(([trimestre, dados]) => ({
        periodo: trimestre,
        recebido: dados.recebido,
        pendente: dados.pendente,
        total: dados.recebido + dados.pendente,
      }));
    } catch (error) {
      console.error("[Gráficos] Erro ao obter honorários trimestrais:", error);
      return [];
    }
  }),

  // Obter dados de honorários por ano
  getHonorariosAnual: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    try {
      const todosHonorarios = await db.select().from(honorarios);
      const anosMap = new Map<number, { recebido: number; pendente: number }>();

      // Gerar últimos 5 anos
      const hoje = new Date();
      for (let i = 4; i >= 0; i--) {
        const ano = hoje.getFullYear() - i;
        anosMap.set(ano, { recebido: 0, pendente: 0 });
      }

      // Processar honorários
      todosHonorarios.forEach((h) => {
        if (h.dataVencimento) {
          const data = new Date(h.dataVencimento);
          const ano = data.getFullYear();

          if (anosMap.has(ano)) {
            anosMap.get(ano)!.recebido += valorRecebidoHonorario(h);
            anosMap.get(ano)!.pendente += valorPendenteHonorario(h);
          }
        }
      });

      return Array.from(anosMap.entries()).map(([ano, dados]) => ({
        periodo: ano.toString(),
        recebido: dados.recebido,
        pendente: dados.pendente,
        total: dados.recebido + dados.pendente,
      }));
    } catch (error) {
      console.error("[Gráficos] Erro ao obter honorários anuais:", error);
      return [];
    }
  }),

  // Obter resumo de honorários por período
  getResumoPorPeriodo: publicProcedure
    .input(
      z.object({
        tipo: z.enum(["mes", "trimestre", "ano"]),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { recebido: 0, pendente: 0, total: 0 };

      try {
        const todosHonorarios = await db.select().from(honorarios);
        let recebido = 0;
        let pendente = 0;

        const hoje = new Date();
        let dataInicio: Date;

        if (input.tipo === "mes") {
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        } else if (input.tipo === "trimestre") {
          const trimestre = Math.floor(hoje.getMonth() / 3);
          dataInicio = new Date(hoje.getFullYear(), trimestre * 3, 1);
        } else {
          dataInicio = new Date(hoje.getFullYear(), 0, 1);
        }

        todosHonorarios.forEach((h) => {
          if (h.dataVencimento) {
            const data = new Date(h.dataVencimento);
            if (data >= dataInicio) {
              recebido += valorRecebidoHonorario(h);
              pendente += valorPendenteHonorario(h);
            }
          }
        });

        return { recebido, pendente, total: recebido + pendente };
      } catch (error) {
        console.error("[Gráficos] Erro ao obter resumo por período:", error);
        return { recebido: 0, pendente: 0, total: 0 };
      }
    }),
});
