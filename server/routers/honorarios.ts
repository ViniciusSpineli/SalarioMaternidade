import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getHonorariosByClienteId, createHonorario, updateHonorario, updateCliente, getAllClientes } from "../db";

export const honorariosRouter = router({
  // Listar honorarios por cliente
  listByCliente: protectedProcedure
    .input(z.object({ clienteId: z.number() }))
    .query(async ({ input }) => {
      return await getHonorariosByClienteId(input.clienteId);
    }),

  // Registrar cobranca de honorarios
  registrarCobranca: protectedProcedure
    .input(
      z.object({
        clienteId: z.number(),
        valorTotal: z.number(),
        formaPagamento: z.string(),
        parcelamento: z.string(),
        dataVencimento: z.date(),
        valorPrimeiraParcela: z.number().optional(),
        vencimentoSegundaParcela: z.date().optional(),
        observacoes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { clienteId, valorTotal, valorPrimeiraParcela, ...data } = input;
      const honorarioId = await createHonorario({
        clienteId,
        valorTotal: valorTotal.toString(),
        valorPrimeiraParcela: valorPrimeiraParcela?.toString(),
        ...data,
      });

      // Atualizar cliente para etapa de Honorarios Pendentes
      await updateCliente(clienteId, { etapa: 12 });

      return { id: honorarioId };
    }),

  // Marcar honorarios como recebido
  marcarRecebido: protectedProcedure
    .input(z.object({ honorarioId: z.number(), clienteId: z.number() }))
    .mutation(async ({ input }) => {
      await updateHonorario(input.honorarioId, { recebido: true });
      await updateCliente(input.clienteId, { etapa: 13 });
      return { success: true };
    }),

  // Marcar cliente como inadimplente
  marcarInadimplente: protectedProcedure
    .input(z.object({ clienteId: z.number() }))
    .mutation(async ({ input }) => {
      await updateCliente(input.clienteId, { inadimplente: true, etapa: 14 });
      return { success: true };
    }),

  // Listar honorarios por status
  listByStatus: protectedProcedure
    .input(z.object({ status: z.enum(["pendentes", "recebidos", "inadimplentes"]) }))
    .query(async ({ input }) => {
      const clientes = await getAllClientes();
      const result = [];

      for (const cliente of clientes) {
        const honorarios = await getHonorariosByClienteId(cliente.id);

        if (input.status === "pendentes" && cliente.etapa === 12) {
          result.push({ cliente, honorarios });
        } else if (input.status === "recebidos" && cliente.etapa === 13) {
          result.push({ cliente, honorarios });
        } else if (input.status === "inadimplentes" && cliente.inadimplente) {
          result.push({ cliente, honorarios });
        }
      }

      return result;
    }),
});
