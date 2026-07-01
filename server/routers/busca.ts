import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { clientes } from "../../drizzle/schema";
import { or, like } from "drizzle-orm";

export const buscaRouter = router({
  // Buscar clientes por nome ou CPF
  searchClientes: publicProcedure
    .input(
      z.object({
        termo: z.string().min(1).max(100),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        // Buscar por nome ou CPF usando like
        const resultados = await db
          .select({
            id: clientes.id,
            nome: clientes.nome,
            cpf: clientes.cpf,
            origem: clientes.origem,
            etapa: clientes.etapa,
            urgenteAbsoluta: clientes.urgenteAbsoluta,
            inadimplente: clientes.inadimplente,
          })
          .from(clientes)
          .where(
            or(
              like(clientes.nome, `%${input.termo}%`),
              like(clientes.cpf, `%${input.termo}%`)
            )
          )
          .limit(20);

        return resultados;
      } catch (error) {
        console.error("[Busca] Erro ao buscar clientes:", error);
        return [];
      }
    }),
});
