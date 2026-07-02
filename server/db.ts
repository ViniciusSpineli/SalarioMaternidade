import path from "path";
import fs from "fs";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { InsertUser, users, clientes, gps, honorarios, checklistDocumentos, tarefasUrgentes, usuariosLocais, honorariosHistorico, metasHonorarios, InsertCliente, InsertGPS, InsertHonorario, InsertChecklistDocumentos, InsertUsuarioLocal, UsuarioLocal, InsertMetaHonorarios, MetaHonorarios } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Resolve o caminho do arquivo SQLite a partir do DATABASE_URL.
// Aceita "file:./data/controle.db", um caminho comum, ou usa um padrão local.
function resolveSqlitePath(): string {
  let raw = (process.env.DATABASE_URL || "").trim();
  if (raw.startsWith("file:")) raw = raw.slice("file:".length);
  const filePath = raw
    ? (path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw))
    : path.join(process.cwd(), "data", "controle.db");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  return filePath;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db) {
    try {
      const sqlite = new Database(resolveSqlitePath());
      sqlite.pragma("journal_mode = WAL");
      sqlite.pragma("foreign_keys = ON");
      _db = drizzle(sqlite);

      // Cria/atualiza as tabelas automaticamente (idempotente).
      const migrationsFolder = path.join(process.cwd(), "drizzle");
      if (fs.existsSync(path.join(migrationsFolder, "meta", "_journal.json"))) {
        migrate(_db, { migrationsFolder });
      }

      // Garante colunas novas em bancos já existentes (migração leve, idempotente).
      ensureSchemaUpToDate(sqlite);

      // Cria o usuário administrador inicial na primeira execução.
      await seedInitialData(_db);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Adiciona colunas novas em bancos criados antes delas existirem no schema.
// Usa o handle bruto do better-sqlite3 (PRAGMA/ALTER), idempotente a cada start.
function ensureSchemaUpToDate(sqlite: Database.Database) {
  const colunaExiste = (tabela: string, coluna: string): boolean => {
    const cols = sqlite.prepare(`PRAGMA table_info(${tabela})`).all() as { name: string }[];
    return cols.some((c) => c.name === coluna);
  };

  try {
    // clientes.statusProcesso — clientes já existentes viram 'Cliente ativa' (uma vez só).
    if (!colunaExiste("clientes", "statusProcesso")) {
      sqlite.exec(
        `ALTER TABLE clientes ADD COLUMN statusProcesso TEXT NOT NULL DEFAULT 'Aguardando assinatura'`
      );
      sqlite.exec(`UPDATE clientes SET statusProcesso = 'Cliente ativa'`);
      console.log("[Database] Coluna clientes.statusProcesso criada; clientes existentes -> 'Cliente ativa'");
    }

    // honorarios.statusPagamento — registros antigos ficam como 'Pendente' (default).
    if (!colunaExiste("honorarios", "statusPagamento")) {
      sqlite.exec(
        `ALTER TABLE honorarios ADD COLUMN statusPagamento TEXT NOT NULL DEFAULT 'Pendente'`
      );
      // Se já estava marcado como recebido no modelo antigo, considera Quitada.
      sqlite.exec(`UPDATE honorarios SET statusPagamento = 'Quitada' WHERE recebido = 1`);
      console.log("[Database] Coluna honorarios.statusPagamento criada");
    }
  } catch (error) {
    console.warn("[Database] ensureSchemaUpToDate falhou:", error);
  }
}

// Insere o usuário administrador padrão se ainda não houver nenhum usuário local.
// Credenciais iniciais: Steffany / 12345 (o login não diferencia maiúsculas).
async function seedInitialData(db: NonNullable<typeof _db>) {
  const existentes = await db.select().from(usuariosLocais).limit(1);
  if (existentes.length > 0) return;

  const senhaHash = crypto.createHash("sha256").update("12345").digest("hex");
  await db.insert(usuariosLocais).values({
    email: "steffany",
    nome: "Steffany",
    senhaHash,
    role: "admin",
    ativo: true,
  });
  console.log("[Database] Usuário administrador criado -> usuário: Steffany | senha: 12345");
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== CONSTANTES ====================
const ETAPAS = [
  { id: 0, nome: 'Novas Clientes' },
  { id: 1, nome: 'Competência Calculada' },
  { id: 2, nome: 'GPS a Gerar' },
  { id: 3, nome: 'Pag. GPS Pendente' },
  { id: 4, nome: 'GPS Paga' },
  { id: 5, nome: 'Aguardando Nascimento' },
  { id: 6, nome: 'Aguardando Certidão de Nascimento' },
  { id: 7, nome: 'Pronto p/ Protocolo' },
  { id: 8, nome: 'Benefício Protocolado' },
  { id: 9, nome: 'Em Análise INSS' },
  { id: 15, nome: 'Em Recurso INSS' },
  { id: 10, nome: 'Benefício Concedido' },
  { id: 11, nome: 'Cobrança Honorários' },
  { id: 12, nome: 'Honorários Pendentes' },
  { id: 13, nome: 'Honorários Recebidos' },
  { id: 14, nome: 'Inadimplente' },
];

export function getEtapaById(id: number) {
  return ETAPAS.find(e => e.id === id);
}

export function getAllEtapas() {
  return ETAPAS;
}

// ==================== CLIENTES ====================
export async function createCliente(data: {
  nome: string;
  cpf: string;
  telefone?: string;
  origem?: string;
  dataContratacao: Date;
  dpp: Date;
  dataNascimento?: Date;
  observacoes?: string;
  statusProcesso?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calcular se é urgência absoluta
  const urgenteAbsoluta = data.dataNascimento && data.dataNascimento <= data.dataContratacao;
  const etapaInicial = urgenteAbsoluta ? 2 : 0; // GPS a Gerar se urgente, senão Novas Clientes

  const result = await db.insert(clientes).values({
    ...data,
    statusProcesso: data.statusProcesso || "Aguardando assinatura",
    etapa: etapaInicial,
    urgenteAbsoluta: !!urgenteAbsoluta,
  });

  // Criar checklist de documentos
  const clienteId = Number((result as any).lastInsertRowid);
  await db.insert(checklistDocumentos).values({ clienteId });

  return clienteId;
}

export async function getClienteById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
  return result[0];
}

export async function getAllClientes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientes).orderBy(clientes.updatedAt);
}

export async function updateCliente(id: number, data: Partial<InsertCliente>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Remove chaves com valor undefined para não sobrescrever colunas não enviadas.
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  if (Object.keys(clean).length === 0) return;
  await db.update(clientes).set(clean).where(eq(clientes.id, id));
}

export async function deleteCliente(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clientes).where(eq(clientes.id, id));
}

// ==================== GPS ====================
export async function createGPS(clienteId: number, competencia: string, vencimento: Date, valor?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(gps).values({ clienteId, competencia, vencimento, valor: valor ? valor.toString() : "178.00" });
  return Number((result as any).lastInsertRowid);
}

export async function getGPSByClienteId(clienteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gps).where(eq(gps.clienteId, clienteId));
}

export async function updateGPS(id: number, data: Partial<InsertGPS>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(gps).set(data).where(eq(gps.id, id));
}

// ==================== HONORÁRIOS ====================
export async function createHonorario(data: InsertHonorario) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(honorarios).values(data);
  return Number((result as any).lastInsertRowid);
}

export async function getHonorariosByClienteId(clienteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(honorarios).where(eq(honorarios.clienteId, clienteId));
}

export async function updateHonorario(id: number, data: Partial<InsertHonorario>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(honorarios).set(data).where(eq(honorarios.id, id));
}

// ==================== CHECKLIST DOCUMENTOS ====================
export async function getChecklistByClienteId(clienteId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(checklistDocumentos).where(eq(checklistDocumentos.clienteId, clienteId)).limit(1);
  return result[0];
}

export async function updateChecklist(clienteId: number, data: Partial<InsertChecklistDocumentos>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(checklistDocumentos).set(data).where(eq(checklistDocumentos.clienteId, clienteId));
}

// ==================== TAREFAS URGENTES ====================
export async function createTarefaUrgente(clienteId: number, tarefa: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tarefasUrgentes).values({ clienteId, tarefa });
  return Number((result as any).lastInsertRowid);
}

export async function getTarefasUrgentes(clienteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tarefasUrgentes).where(eq(tarefasUrgentes.clienteId, clienteId));
}

export async function updateTarefaUrgente(id: number, concluida: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tarefasUrgentes).set({ concluida }).where(eq(tarefasUrgentes.id, id));
}

// ==================== USUARIOS LOCAIS ====================
export async function getUserLocalByEmail(email: string): Promise<UsuarioLocal | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(usuariosLocais).where(eq(usuariosLocais.email, email)).limit(1);
  return result[0];
}

export async function createUserLocal(data: InsertUsuarioLocal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(usuariosLocais).values(data);
  return Number((result as any).lastInsertRowid);
}

export async function getAllUsersLocal() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(usuariosLocais);
}

// ==================== HISTORICO HONORARIOS ====================
export async function getHonorarioHistorico() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(honorariosHistorico);
}

export async function updateHonorarioHistorico(mes: string, valorRecebido: string, valorPendente: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(honorariosHistorico).where(eq(honorariosHistorico.mes, mes)).limit(1);
  
  if (existing.length > 0) {
    await db.update(honorariosHistorico).set({ valorRecebido, valorPendente }).where(eq(honorariosHistorico.mes, mes));
  } else {
    await db.insert(honorariosHistorico).values({ mes, valorRecebido, valorPendente });
  }
}

// TODO: add feature queries here as your schema grows.
