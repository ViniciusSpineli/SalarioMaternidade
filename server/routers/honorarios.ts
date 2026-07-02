import { z } from "zod";
import { STATUS_PAGAMENTO, pagamentoRecebido, valorRecebidoHonorario, valorPendenteHonorario } from "@shared/status";
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
        statusPagamento: "Pendente",
        ...data,
      });

      return { id: honorarioId };
    }),

  // Atualizar o status de pagamento do honorario (Pendente / 1ª parcela / 2ª parcela / Quitada)
  atualizarStatusPagamento: protectedProcedure
    .input(
      z.object({
        honorarioId: z.number(),
        statusPagamento: z.enum(STATUS_PAGAMENTO),
      })
    )
    .mutation(async ({ input }) => {
      await updateHonorario(input.honorarioId, {
        statusPagamento: input.statusPagamento,
        recebido: pagamentoRecebido(input.statusPagamento),
      });
      return { success: true };
    }),

  // Marcar cliente como inadimplente
  marcarInadimplente: protectedProcedure
    .input(z.object({ clienteId: z.number() }))
    .mutation(async ({ input }) => {
      await updateCliente(input.clienteId, { inadimplente: true });
      return { success: true };
    }),

  // Listar honorarios por status de pagamento (um item por honorário)
  listByStatus: protectedProcedure
    .input(z.object({ status: z.enum(["pendentes", "recebidos", "inadimplentes"]) }))
    .query(async ({ input }) => {
      const clientes = await getAllClientes();
      const result = [];

      for (const cliente of clientes) {
        const honorarios = await getHonorariosByClienteId(cliente.id);
        for (const honorario of honorarios) {
          const recebido = valorRecebidoHonorario(honorario);
          const pendente = valorPendenteHonorario(honorario);

          if (input.status === "pendentes" && pendente > 0) {
            result.push({ cliente, honorario, recebido, pendente });
          } else if (input.status === "recebidos" && recebido > 0) {
            result.push({ cliente, honorario, recebido, pendente });
          } else if (input.status === "inadimplentes" && cliente.inadimplente) {
            result.push({ cliente, honorario, recebido, pendente });
          }
        }
      }

      return result;
    }),
});
