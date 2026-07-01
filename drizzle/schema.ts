import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 *
 * Banco: SQLite (arquivo local, sem servidor). Datas ficam como timestamp
 * (epoch em segundos) e voltam como Date. Valores monetários ficam como texto
 * para preservar as casas decimais (ex.: "178.00").
 */
export const users = sqliteTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull().$onUpdate(() => new Date()),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Etapas do fluxo de salário-maternidade
export enum EtapaFluxo {
  NOVAS_CLIENTES = 0,
  COMPETENCIA_CALCULADA = 1,
  GPS_A_GERAR = 2,
  PAG_GPS_PENDENTE = 3,
  GPS_PAGA = 4,
  AGUARDANDO_NASCIMENTO = 5,
  DOCS_DO_PARTO = 6,
  PRONTO_PROTOCOLO = 7,
  BENEFICIO_PROTOCOLADO = 8,
  EM_ANALISE_INSS = 9,
  BENEFICIO_CONCEDIDO = 10,
  COBRANCA_HONORARIOS = 11,
  HONORARIOS_PENDENTES = 12,
  HONORARIOS_RECEBIDOS = 13,
  INADIMPLENTE = 14,
}

// Tabela de clientes
export const clientes = sqliteTable("clientes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  cpf: text("cpf").notNull().unique(),
  telefone: text("telefone"),
  origem: text("origem"),
  dataContratacao: integer("dataContratacao", { mode: "timestamp" }).notNull(),
  dpp: integer("dpp", { mode: "timestamp" }).notNull(),
  dataNascimento: integer("dataNascimento", { mode: "timestamp" }),
  observacoes: text("observacoes"),
  etapa: integer("etapa").default(0).notNull(),
  urgenteAbsoluta: integer("urgenteAbsoluta", { mode: "boolean" }).default(false),
  inadimplente: integer("inadimplente", { mode: "boolean" }).default(false),
  dataConclusao: integer("dataConclusao", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull().$onUpdate(() => new Date()),
});

export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = typeof clientes.$inferInsert;

// Tabela de GPS
export const gps = sqliteTable("gps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clienteId: integer("clienteId").notNull(),
  competencia: text("competencia").notNull(), // MM/YYYY
  vencimento: integer("vencimento", { mode: "timestamp" }).notNull(),
  valor: text("valor").default("178.00"),
  paga: integer("paga", { mode: "boolean" }).default(false),
  dataComprovante: integer("dataComprovante", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull().$onUpdate(() => new Date()),
});

export type GPS = typeof gps.$inferSelect;
export type InsertGPS = typeof gps.$inferInsert;

// Tabela de Honorários
export const honorarios = sqliteTable("honorarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clienteId: integer("clienteId").notNull(),
  valorTotal: text("valorTotal").notNull(),
  formaPagamento: text("formaPagamento"), // PIX, Boleto, Outro
  parcelamento: text("parcelamento"), // À vista, 2x
  dataVencimento: integer("dataVencimento", { mode: "timestamp" }),
  valorPrimeiraParcela: text("valorPrimeiraParcela"),
  vencimentoSegundaParcela: integer("vencimentoSegundaParcela", { mode: "timestamp" }),
  observacoes: text("observacoes"),
  recebido: integer("recebido", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull().$onUpdate(() => new Date()),
});

export type Honorario = typeof honorarios.$inferSelect;
export type InsertHonorario = typeof honorarios.$inferInsert;

// Tabela de Checklist de Documentos
export const checklistDocumentos = sqliteTable("checklistDocumentos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clienteId: integer("clienteId").notNull().unique(),
  certidao: integer("certidao", { mode: "boolean" }).default(false),
  rg: integer("rg", { mode: "boolean" }).default(false),
  cpf: integer("cpf", { mode: "boolean" }).default(false),
  procuracao: integer("procuracao", { mode: "boolean" }).default(false),
  complementares: integer("complementares", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull().$onUpdate(() => new Date()),
});

export type ChecklistDocumentos = typeof checklistDocumentos.$inferSelect;
export type InsertChecklistDocumentos = typeof checklistDocumentos.$inferInsert;

// Tabela de Tarefas Urgentes
export const tarefasUrgentes = sqliteTable("tarefasUrgentes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clienteId: integer("clienteId").notNull(),
  tarefa: text("tarefa").notNull(),
  concluida: integer("concluida", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull().$onUpdate(() => new Date()),
});

export type TarefaUrgente = typeof tarefasUrgentes.$inferSelect;
export type InsertTarefaUrgente = typeof tarefasUrgentes.$inferInsert;

// Tabela de Usuários com Autenticação Local
export const usuariosLocais = sqliteTable("usuariosLocais", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  nome: text("nome").notNull(),
  senhaHash: text("senhaHash").notNull(),
  role: text("role", { enum: ["admin", "user"] }).default("user").notNull(),
  ativo: integer("ativo", { mode: "boolean" }).default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull().$onUpdate(() => new Date()),
});

export type UsuarioLocal = typeof usuariosLocais.$inferSelect;
export type InsertUsuarioLocal = typeof usuariosLocais.$inferInsert;

// Tabela de Histórico de Honorários por Mês (para gráficos)
export const honorariosHistorico = sqliteTable("honorariosHistorico", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mes: text("mes").notNull(), // MM/YYYY
  valorRecebido: text("valorRecebido").default("0"),
  valorPendente: text("valorPendente").default("0"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull().$onUpdate(() => new Date()),
});

export type HonorarioHistorico = typeof honorariosHistorico.$inferSelect;
export type InsertHonorarioHistorico = typeof honorariosHistorico.$inferInsert;

// Tabela de Metas de Honorários
export const metasHonorarios = sqliteTable("metasHonorarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tipo: text("tipo", { enum: ["mes", "trimestre", "ano"] }).notNull(),
  periodo: text("periodo").notNull(), // MM/YYYY, Q1/YYYY ou YYYY
  valorMeta: text("valorMeta").notNull(),
  descricao: text("descricao"),
  ativo: integer("ativo", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull().$onUpdate(() => new Date()),
});

export type MetaHonorarios = typeof metasHonorarios.$inferSelect;
export type InsertMetaHonorarios = typeof metasHonorarios.$inferInsert;
