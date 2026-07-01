import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createCliente,
  getAllClientes,
  getClienteById,
  updateCliente,
  deleteCliente,
  getChecklistByClienteId,
  updateChecklist,
  getGPSByClienteId,
  createGPS,
  getHonorariosByClienteId,
  getTarefasUrgentes,
  createTarefaUrgente,
  updateTarefaUrgente,
  getAllEtapas,
  getEtapaById,
} from "../db";

export const clientesRouter = router({
  // Listar todas as clientes
  list: protectedProcedure.query(async () => {
    const clientesList = await getAllClientes();
    return clientesList;
  }),

  // Obter cliente por ID
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const cliente = await getClienteById(input.id);
    if (!cliente) throw new Error("Cliente não encontrada");

    const checklist = await getChecklistByClienteId(cliente.id);
    const gpsRecords = await getGPSByClienteId(cliente.id);
    const honorariosRecords = await getHonorariosByClienteId(cliente.id);
    const tarefas = await getTarefasUrgentes(cliente.id);

    return {
      ...cliente,
      checklist,
      gps: gpsRecords,
      honorarios: honorariosRecords,
      tarefas,
    };
  }),

  // Criar nova cliente
  create: protectedProcedure
    .input(
      z.object({
        nome: z.string().min(1),
        cpf: z.string().min(11),
        telefone: z.string().optional(),
        origem: z.string().optional(),
        dataContratacao: z.date(),
        dpp: z.date(),
        dataNascimento: z.date().optional(),
        observacoes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const clienteId = await createCliente(input);

      // Se for urgência absoluta, criar tarefas padrão
      const cliente = await getClienteById(clienteId);
      if (cliente?.urgenteAbsoluta) {
        const tarefasPadrao = [
          "Gerar GPS e salvar comprovante",
          "Pagar GPS",
          "Salvar comprovante de pagamento",
          "Cobrar certidão de nascimento quando disponível",
          "Protocolar benefício no INSS",
        ];

        for (const tarefa of tarefasPadrao) {
          await createTarefaUrgente(clienteId, tarefa);
        }

        // Calcular competência GPS (2 meses antes do parto/nascimento)
        const dataRef = input.dataNascimento || input.dpp;
        const competencia = new Date(dataRef);
        competencia.setMonth(competencia.getMonth() - 2);

        // Calcular vencimento (dia 15 do mês seguinte à competência)
        const vencimento = new Date(competencia);
        vencimento.setMonth(vencimento.getMonth() + 1);
        vencimento.setDate(15);

        const competenciaStr = `${String(competencia.getMonth() + 1).padStart(2, "0")}/${competencia.getFullYear()}`;
        await createGPS(clienteId, competenciaStr, vencimento);
      }

      return { id: clienteId };
    }),

  // Atualizar cliente
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        nome: z.string().min(1).optional(),
        cpf: z.string().min(11).optional(),
        telefone: z.string().optional(),
        origem: z.string().optional(),
        dataContratacao: z.date().optional(),
        dpp: z.date().optional(),
        etapa: z.number().optional(),
        dataNascimento: z.date().optional(),
        observacoes: z.string().optional(),
        inadimplente: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateCliente(id, data);
      return { success: true };
    }),

  // Deletar cliente
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await deleteCliente(input.id);
    return { success: true };
  }),

  // Avançar etapa
  avancarEtapa: protectedProcedure
    .input(z.object({ id: z.number(), novaEtapa: z.number().optional() }))
    .mutation(async ({ input }) => {
      const cliente = await getClienteById(input.id);
      if (!cliente) throw new Error("Cliente não encontrada");

      const novaEtapa = input.novaEtapa ?? cliente.etapa + 1;
      await updateCliente(input.id, { etapa: Math.min(novaEtapa, 14) });
      return { success: true };
    }),

  // Atualizar checklist de documentos
  updateChecklist: protectedProcedure
    .input(
      z.object({
        clienteId: z.number(),
        certidao: z.boolean().optional(),
        rg: z.boolean().optional(),
        cpf: z.boolean().optional(),
        procuracao: z.boolean().optional(),
        complementares: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { clienteId, ...data } = input;
      await updateChecklist(clienteId, data);
      return { success: true };
    }),

  // Obter etapas
  getEtapas: protectedProcedure.query(() => {
    return getAllEtapas();
  }),
});
