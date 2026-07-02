import { z } from "zod";
import { STATUS_PROCESSO } from "@shared/status";
import { protectedProcedure, router } from "../_core/trpc";
import { getAllClientes, getHonorariosByClienteId } from "../db";

// Opções de filtro do relatório: os 7 status do processo + inadimplentes (flag).
const STATUS_FILTRO = [...STATUS_PROCESSO, "inadimplentes"] as const;
type StatusFiltro = (typeof STATUS_FILTRO)[number];

// Aplica o filtro de status na lista de clientes (compartilhado por list e exportarCSV)
function filtrarPorStatus<T extends { statusProcesso: string; inadimplente: boolean | null }>(
  clientes: T[],
  status: StatusFiltro
): T[] {
  if (status === "inadimplentes") {
    return clientes.filter((c) => c.inadimplente);
  }
  return clientes.filter((c) => c.statusProcesso === status);
}

export const relatoriosRouter = router({
  // Listar clientes com filtros
  list: protectedProcedure
    .input(
      z.object({
        origem: z.string().optional(),
        status: z.enum(STATUS_FILTRO).optional(),
      })
    )
    .query(async ({ input }) => {
      let clientes = await getAllClientes();

      if (input.origem) {
        clientes = clientes.filter((c) => c.origem === input.origem);
      }

      if (input.status) {
        clientes = filtrarPorStatus(clientes, input.status);
      }

      const result = [];
      for (const cliente of clientes) {
        const honorarios = await getHonorariosByClienteId(cliente.id);
        result.push({
          ...cliente,
          honorarios: honorarios[0] || null,
        });
      }

      return result;
    }),

  // Exportar CSV
  exportarCSV: protectedProcedure
    .input(
      z.object({
        origem: z.string().optional(),
        status: z.enum(STATUS_FILTRO).optional(),
      })
    )
    .query(async ({ input }) => {
      let clientes = await getAllClientes();

      if (input.origem) {
        clientes = clientes.filter((c) => c.origem === input.origem);
      }

      if (input.status) {
        clientes = filtrarPorStatus(clientes, input.status);
      }

      // Construir CSV com BOM UTF-8
      let csv = "﻿"; // BOM UTF-8
      csv += "Nome,CPF,Origem,Contratacao,Data do Parto,Forma Pagamento,Valor Honorarios,Status Pagamento,Status Atual\n";

      for (const cliente of clientes) {
        const honorarios = await getHonorariosByClienteId(cliente.id);
        const hon = honorarios[0];
        const statusPag = cliente.inadimplente ? "Inadimplente" : hon?.statusPagamento || "-";

        const dataContratacao = cliente.dataContratacao ? new Date(cliente.dataContratacao).toLocaleDateString("pt-BR") : "";
        const dataParto = cliente.dataNascimento ? new Date(cliente.dataNascimento).toLocaleDateString("pt-BR") : "";
        const valorHon = hon ? parseFloat(hon.valorTotal).toFixed(2).replace(".", ",") : "0,00";

        csv += `"${cliente.nome}","${cliente.cpf}","${cliente.origem || ""}","${dataContratacao}","${dataParto}","${hon?.formaPagamento || ""}","${valorHon}","${statusPag}","${cliente.statusProcesso}"\n`;
      }

      return csv;
    }),

  // Visao geral por mes (agrupado pela DPP - data prevista do parto), contando por status
  resumoMensalPorDPP: protectedProcedure.query(async () => {
    const clientes = await getAllClientes();

    const meses: Record<
      string,
      {
        mes: string;
        ano: number;
        mesNum: number;
        total: number;
        aguardandoAssinatura: number;
        aguardandoCertidao: number;
        emAnalise: number;
        emRecurso: number;
        beneficioConcedido: number;
      }
    > = {};

    for (const c of clientes) {
      if (!c.dpp) continue;
      const d = new Date(c.dpp);
      if (isNaN(d.getTime())) continue;
      const mesNum = d.getMonth() + 1;
      const ano = d.getFullYear();
      const chave = `${String(mesNum).padStart(2, "0")}/${ano}`;

      if (!meses[chave]) {
        meses[chave] = {
          mes: chave,
          ano,
          mesNum,
          total: 0,
          aguardandoAssinatura: 0,
          aguardandoCertidao: 0,
          emAnalise: 0,
          emRecurso: 0,
          beneficioConcedido: 0,
        };
      }

      const m = meses[chave];
      m.total++;
      if (c.statusProcesso === "Aguardando assinatura") m.aguardandoAssinatura++;
      if (c.statusProcesso === "Aguardando certidão") m.aguardandoCertidao++;
      if (c.statusProcesso === "Em análise INSS") m.emAnalise++;
      if (c.statusProcesso === "Em recurso INSS") m.emRecurso++;
      if (c.statusProcesso === "Benefício concedido") m.beneficioConcedido++;
    }

    return Object.values(meses).sort((a, b) =>
      a.ano !== b.ano ? a.ano - b.ano : a.mesNum - b.mesNum
    );
  }),

  // Obter origens unicas
  getOrigens: protectedProcedure.query(async () => {
    const clientes = await getAllClientes();
    const origensSet = new Set(clientes.map((c) => c.origem).filter(Boolean));
    const origens = Array.from(origensSet);
    return origens;
  }),
});
