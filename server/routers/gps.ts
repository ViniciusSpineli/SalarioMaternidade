import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getGPSByClienteId, updateGPS, getAllClientes, getClienteById, updateCliente } from "../db";

export const gpsRouter = router({
  // Listar GPS por cliente
  listByCliente: protectedProcedure
    .input(z.object({ clienteId: z.number() }))
    .query(async ({ input }) => {
      return await getGPSByClienteId(input.clienteId);
    }),

  // Marcar GPS como paga
  marcarPaga: protectedProcedure
    .input(z.object({ gpsId: z.number(), clienteId: z.number() }))
    .mutation(async ({ input }) => {
      await updateGPS(input.gpsId, { paga: true, dataComprovante: new Date() });

      // Avançar etapa do cliente
      const cliente = await getClienteById(input.clienteId);
      if (cliente) {
        if (cliente.dataNascimento) {
          // Se já nasceu, ir para Docs do Parto
          await updateCliente(input.clienteId, { etapa: 6 });
        } else {
          // Se ainda não nasceu, ir para Aguardando Nascimento
          await updateCliente(input.clienteId, { etapa: 5 });
        }
      }

      return { success: true };
    }),

  // Listar GPS por competencia
  listByCompetencia: protectedProcedure.query(async () => {
    const clientes = await getAllClientes();
    const gpsByCompetencia: Record<string, any> = {};

    for (const cliente of clientes) {
      const gpsRecords = await getGPSByClienteId(cliente.id);
      for (const gps of gpsRecords) {
        if (!gpsByCompetencia[gps.competencia]) {
          gpsByCompetencia[gps.competencia] = {
            competencia: gps.competencia,
            vencimento: gps.vencimento,
            total: 0,
            pagas: 0,
            pendentes: 0,
            gps: [],
          };
        }
        gpsByCompetencia[gps.competencia].total += parseFloat(gps.valor || "178.00");
        if (gps.paga) {
          gpsByCompetencia[gps.competencia].pagas++;
        } else {
          gpsByCompetencia[gps.competencia].pendentes++;
        }
        gpsByCompetencia[gps.competencia].gps.push({ ...gps, clienteNome: cliente.nome });
      }
    }

    return Object.values(gpsByCompetencia);
  }),
});
