import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getAllClientes, getTarefasUrgentes, updateTarefaUrgente, createTarefaUrgente } from "../db";

export const urgenciasRouter = router({
  // Listar clientes em urgencia absoluta
  listUrgentes: protectedProcedure.query(async () => {
    const clientes = await getAllClientes();
    const urgentes = clientes.filter(c => c.urgenteAbsoluta);

    const result = [];
    for (const cliente of urgentes) {
      const tarefas = await getTarefasUrgentes(cliente.id);
      result.push({ cliente, tarefas });
    }

    return result;
  }),

  // Obter tarefas de um cliente urgente
  getTarefas: protectedProcedure
    .input(z.object({ clienteId: z.number() }))
    .query(async ({ input }) => {
      return await getTarefasUrgentes(input.clienteId);
    }),

  // Marcar tarefa como concluida
  marcarTarefaConcluida: protectedProcedure
    .input(z.object({ tarefaId: z.number(), concluida: z.boolean() }))
    .mutation(async ({ input }) => {
      await updateTarefaUrgente(input.tarefaId, input.concluida);
      return { success: true };
    }),

  // Adicionar tarefa urgente
  adicionarTarefa: protectedProcedure
    .input(z.object({ clienteId: z.number(), tarefa: z.string() }))
    .mutation(async ({ input }) => {
      const tarefaId = await createTarefaUrgente(input.clienteId, input.tarefa);
      return { id: tarefaId };
    }),
});
