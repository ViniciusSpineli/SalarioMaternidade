import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { metasHonorarios } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const metasRouter = router({
  // Listar todas as metas ativas
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    try {
      const metas = await db
        .select()
        .from(metasHonorarios)
        .where(eq(metasHonorarios.ativo, true));

      return metas.map(m => ({
        id: m.id,
        tipo: m.tipo,
        periodo: m.periodo,
        valorMeta: parseFloat(m.valorMeta.toString()),
        descricao: m.descricao,
        ativo: m.ativo,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      }));
    } catch (error) {
      console.error("[Metas] Erro ao listar metas:", error);
      return [];
    }
  }),

  // Obter meta por período
  getByPeriodo: publicProcedure
    .input(
      z.object({
        tipo: z.enum(["mes", "trimestre", "ano"]),
        periodo: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const meta = await db
          .select()
          .from(metasHonorarios)
          .where(
            and(
              eq(metasHonorarios.tipo, input.tipo),
              eq(metasHonorarios.periodo, input.periodo),
              eq(metasHonorarios.ativo, true)
            )
          )
          .limit(1);

        if (meta.length === 0) return null;

        const m = meta[0];
        return {
          id: m.id,
          tipo: m.tipo,
          periodo: m.periodo,
          valorMeta: parseFloat(m.valorMeta.toString()),
          descricao: m.descricao,
          ativo: m.ativo,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        };
      } catch (error) {
        console.error("[Metas] Erro ao obter meta por período:", error);
        return null;
      }
    }),

  // Criar nova meta
  create: publicProcedure
    .input(
      z.object({
        tipo: z.enum(["mes", "trimestre", "ano"]),
        periodo: z.string(),
        valorMeta: z.number().positive(),
        descricao: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        await db.insert(metasHonorarios).values({
          tipo: input.tipo,
          periodo: input.periodo,
          valorMeta: input.valorMeta.toString(),
          descricao: input.descricao,
          ativo: true,
        });

        return { success: true };
      } catch (error) {
        console.error("[Metas] Erro ao criar meta:", error);
        throw error;
      }
    }),

  // Atualizar meta
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        valorMeta: z.number().positive().optional(),
        descricao: z.string().optional(),
        ativo: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const updateData: any = {};
        if (input.valorMeta !== undefined) {
          updateData.valorMeta = input.valorMeta.toString();
        }
        if (input.descricao !== undefined) {
          updateData.descricao = input.descricao;
        }
        if (input.ativo !== undefined) {
          updateData.ativo = input.ativo;
        }

        await db
          .update(metasHonorarios)
          .set(updateData)
          .where(eq(metasHonorarios.id, input.id));

        return { success: true };
      } catch (error) {
        console.error("[Metas] Erro ao atualizar meta:", error);
        throw error;
      }
    }),

  // Deletar meta
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        await db
          .update(metasHonorarios)
          .set({ ativo: false })
          .where(eq(metasHonorarios.id, input.id));

        return { success: true };
      } catch (error) {
        console.error("[Metas] Erro ao deletar meta:", error);
        throw error;
      }
    }),
});
