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
