// ==================== STATUS DO PROCESSO (CRM) ====================
// Fonte única de verdade dos status do processo das clientes.
// Usado tanto no client (menu, Kanban, filtros) quanto no server (validação, filtros).

export const STATUS_PROCESSO = [
  "Aguardando assinatura",
  "Aguardando certidão",
  "Em análise INSS",
  "Em recurso INSS",
  "Benefício concedido",
  "Cliente ativa",
  "Cliente inativa",
] as const;

export type StatusProcesso = (typeof STATUS_PROCESSO)[number];

export const STATUS_DEFAULT: StatusProcesso = "Aguardando assinatura";

// Metadados por status: slug (usado nas rotas /status/<slug>) e emoji (menu/Kanban).
export const STATUS_META: Record<StatusProcesso, { slug: string; emoji: string }> = {
  "Aguardando assinatura": { slug: "aguardando-assinatura", emoji: "📄" },
  "Aguardando certidão": { slug: "aguardando-certidao", emoji: "📑" },
  "Em análise INSS": { slug: "em-analise-inss", emoji: "🕒" },
  "Em recurso INSS": { slug: "em-recurso-inss", emoji: "⚖️" },
  "Benefício concedido": { slug: "beneficio-concedido", emoji: "✅" },
  "Cliente ativa": { slug: "cliente-ativa", emoji: "👥" },
  "Cliente inativa": { slug: "cliente-inativa", emoji: "🚫" },
};

// Resolve um status a partir do slug da rota (ou undefined se não existir).
export function statusFromSlug(slug: string): StatusProcesso | undefined {
  return STATUS_PROCESSO.find((s) => STATUS_META[s].slug === slug);
}

// ==================== STATUS DE PAGAMENTO (HONORÁRIOS) ====================
export const STATUS_PAGAMENTO = [
  "Pendente",
  "Primeira parcela paga",
  "Segunda parcela paga",
  "Quitada",
] as const;

export type StatusPagamento = (typeof STATUS_PAGAMENTO)[number];

export const STATUS_PAGAMENTO_DEFAULT: StatusPagamento = "Pendente";

// Considera-se "recebido" (aparece no card/aba de recebidos) qualquer pagamento além de Pendente.
export function pagamentoRecebido(status: string | null | undefined): boolean {
  return !!status && status !== "Pendente";
}

type HonorarioValores = {
  valorTotal?: string | number | null;
  valorPrimeiraParcela?: string | number | null;
  statusPagamento?: string | null;
};

function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return isNaN(n) ? 0 : n;
}

// Valor efetivamente RECEBIDO de um honorário, conforme as parcelas pagas.
// À vista: "Primeira parcela paga" já quita o total (não há 2ª parcela).
// Parcelado: soma o que foi pago (1ª parcela; a partir da 2ª/Quitada = total).
export function valorRecebidoHonorario(h: HonorarioValores): number {
  const total = num(h.valorTotal);
  const primeira = num(h.valorPrimeiraParcela);
  switch (h.statusPagamento) {
    case "Quitada":
    case "Segunda parcela paga":
      return total;
    case "Primeira parcela paga":
      return primeira > 0 ? Math.min(primeira, total) : total;
    default:
      return 0; // Pendente
  }
}

// Valor ainda PENDENTE (o que falta receber) de um honorário.
export function valorPendenteHonorario(h: HonorarioValores): number {
  return Math.max(0, num(h.valorTotal) - valorRecebidoHonorario(h));
}
