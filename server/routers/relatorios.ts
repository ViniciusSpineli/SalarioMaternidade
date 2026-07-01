import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getAllClientes, getHonorariosByClienteId, getEtapaById } from "../db";

export const relatoriosRouter = router({
  // Listar clientes com filtros
  list: protectedProcedure
    .input(
      z.object({
        origem: z.string().optional(),
        status: z.enum(["concluidos", "em_andamento", "honorarios_pagos", "honorarios_pendentes", "inadimplentes"]).optional(),
      })
    )
    .query(async ({ input }) => {
      let clientes = await getAllClientes();

      if (input.origem) {
        clientes = clientes.filter(c => c.origem === input.origem);
      }

      if (input.status) {
        if (input.status === "concluidos") {
          clientes = clientes.filter(c => c.etapa === 13);
        } else if (input.status === "em_andamento") {
          clientes = clientes.filter(c => c.etapa < 13 && !c.inadimplente);
        } else if (input.status === "honorarios_pagos") {
          clientes = clientes.filter(c => c.etapa === 13);
        } else if (input.status === "honorarios_pendentes") {
          clientes = clientes.filter(c => c.etapa === 12);
        } else if (input.status === "inadimplentes") {
          clientes = clientes.filter(c => c.inadimplente);
        }
      }

      const result = [];
      for (const cliente of clientes) {
        const honorarios = await getHonorariosByClienteId(cliente.id);
        result.push({
          ...cliente,
          honorarios: honorarios[0] || null,
          etapaNome: getEtapaById(cliente.etapa)?.nome,
        });
      }

      return result;
    }),

  // Exportar CSV
  exportarCSV: protectedProcedure
    .input(
      z.object({
        origem: z.string().optional(),
        status: z.enum(["concluidos", "em_andamento", "honorarios_pagos", "honorarios_pendentes", "inadimplentes"]).optional(),
      })
    )
    .query(async ({ input }) => {
      let clientes = await getAllClientes();

      if (input.origem) {
        clientes = clientes.filter(c => c.origem === input.origem);
      }

      if (input.status) {
        if (input.status === "concluidos") {
          clientes = clientes.filter(c => c.etapa === 13);
        } else if (input.status === "em_andamento") {
          clientes = clientes.filter(c => c.etapa < 13 && !c.inadimplente);
        } else if (input.status === "honorarios_pagos") {
          clientes = clientes.filter(c => c.etapa === 13);
        } else if (input.status === "honorarios_pendentes") {
          clientes = clientes.filter(c => c.etapa === 12);
        } else if (input.status === "inadimplentes") {
          clientes = clientes.filter(c => c.inadimplente);
        }
      }

      // Construir CSV com BOM UTF-8
      let csv = "\uFEFF"; // BOM UTF-8
      csv += "Nome,CPF,Origem,Contratacao,Data do Parto,Data de Fechamento,Forma Pagamento,Valor Honorarios,Status Honorarios,Etapa\n";

      for (const cliente of clientes) {
        const honorarios = await getHonorariosByClienteId(cliente.id);
        const hon = honorarios[0];
        const statusHon = cliente.inadimplente ? "Inadimplente" : cliente.etapa === 13 ? "Recebido" : "Pendente";
        const etapaNome = getEtapaById(cliente.etapa)?.nome || "";

        const dataContratacao = cliente.dataContratacao ? new Date(cliente.dataContratacao).toLocaleDateString("pt-BR") : "";
        const dataParto = cliente.dataNascimento ? new Date(cliente.dataNascimento).toLocaleDateString("pt-BR") : "";
        const dataFechamento = cliente.dataConclusao ? new Date(cliente.dataConclusao).toLocaleDateString("pt-BR") : "";
        const valorHon = hon ? parseFloat(hon.valorTotal).toFixed(2).replace(".", ",") : "0,00";

        csv += `"${cliente.nome}","${cliente.cpf}","${cliente.origem || ""}","${dataContratacao}","${dataParto}","${dataFechamento}","${hon?.formaPagamento || ""}","${valorHon}","${statusHon}","${etapaNome}"\n`;
      }

      return csv;
    }),

  // Obter origens unicas
  getOrigens: protectedProcedure.query(async () => {
    const clientes = await getAllClientes();
    const origensSet = new Set(clientes.map(c => c.origem).filter(Boolean));
    const origens = Array.from(origensSet);
    return origens;
  }),
});
