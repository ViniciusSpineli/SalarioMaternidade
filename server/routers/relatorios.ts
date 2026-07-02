import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getAllClientes, getHonorariosByClienteId, getEtapaById } from "../db";

type StatusFiltro =
  | "concluidos"
  | "em_andamento"
  | "aguardando_nascimento"
  | "aguardando_certidao"
  | "em_recurso"
  | "honorarios_pagos"
  | "honorarios_pendentes"
  | "inadimplentes";

// Aplica o filtro de status na lista de clientes (compartilhado por list e exportarCSV)
function filtrarPorStatus<T extends { etapa: number; inadimplente: boolean | null }>(
  clientes: T[],
  status: StatusFiltro
): T[] {
  switch (status) {
    case "concluidos":
    case "honorarios_pagos":
      return clientes.filter(c => c.etapa === 13);
    case "em_andamento":
      return clientes.filter(c => c.etapa < 13 && !c.inadimplente);
    case "aguardando_nascimento":
      return clientes.filter(c => c.etapa === 5);
    case "aguardando_certidao":
      return clientes.filter(c => c.etapa === 6);
    case "em_recurso":
      return clientes.filter(c => c.etapa === 15);
    case "honorarios_pendentes":
      return clientes.filter(c => c.etapa === 12);
    case "inadimplentes":
      return clientes.filter(c => c.inadimplente);
    default:
      return clientes;
  }
}

export const relatoriosRouter = router({
  // Listar clientes com filtros
  list: protectedProcedure
    .input(
      z.object({
        origem: z.string().optional(),
        status: z.enum(["concluidos", "em_andamento", "aguardando_nascimento", "aguardando_certidao", "em_recurso", "honorarios_pagos", "honorarios_pendentes", "inadimplentes"]).optional(),
      })
    )
    .query(async ({ input }) => {
      let clientes = await getAllClientes();

      if (input.origem) {
        clientes = clientes.filter(c => c.origem === input.origem);
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
        status: z.enum(["concluidos", "em_andamento", "aguardando_nascimento", "aguardando_certidao", "em_recurso", "honorarios_pagos", "honorarios_pendentes", "inadimplentes"]).optional(),
      })
    )
    .query(async ({ input }) => {
      let clientes = await getAllClientes();

      if (input.origem) {
        clientes = clientes.filter(c => c.origem === input.origem);
      }

      if (input.status) {
        clientes = filtrarPorStatus(clientes, input.status);
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

  // Visao geral por mes (agrupado pela DPP - data prevista do parto)
  resumoMensalPorDPP: protectedProcedure.query(async () => {
    const clientes = await getAllClientes();

    const meses: Record<
      string,
      {
        mes: string;
        ano: number;
        mesNum: number;
        total: number;
        aguardandoNascimento: number;
        aguardandoCertidao: number;
        emRecurso: number;
        beneficioConcedido: number;
        concluidos: number;
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
          aguardandoNascimento: 0,
          aguardandoCertidao: 0,
          emRecurso: 0,
          beneficioConcedido: 0,
          concluidos: 0,
        };
      }

      const m = meses[chave];
      m.total++;
      if (c.etapa === 5) m.aguardandoNascimento++;
      if (c.etapa === 6) m.aguardandoCertidao++;
      if (c.etapa === 15) m.emRecurso++;
      if (c.etapa === 10) m.beneficioConcedido++;
      if (c.etapa === 13) m.concluidos++;
    }

    return Object.values(meses).sort((a, b) =>
      a.ano !== b.ano ? a.ano - b.ano : a.mesNum - b.mesNum
    );
  }),

  // Obter origens unicas
  getOrigens: protectedProcedure.query(async () => {
    const clientes = await getAllClientes();
    const origensSet = new Set(clientes.map(c => c.origem).filter(Boolean));
    const origens = Array.from(origensSet);
    return origens;
  }),
});
