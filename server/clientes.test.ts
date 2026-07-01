import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createTestContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "test",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("clientes router", () => {
  it("should list all clientes", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clientes.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get etapas", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const etapas = await caller.clientes.getEtapas();
    expect(Array.isArray(etapas)).toBe(true);
    expect(etapas.length).toBe(15);
    expect(etapas[0].nome).toBe("Novas Clientes");
    expect(etapas[14].nome).toBe("Inadimplente");
  });
});

describe("gps router", () => {
  it("should list gps by competencia", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.gps.listByCompetencia();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("honorarios router", () => {
  it("should list honorarios by status", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const pendentes = await caller.honorarios.listByStatus({ status: "pendentes" });
    expect(Array.isArray(pendentes)).toBe(true);

    const recebidos = await caller.honorarios.listByStatus({ status: "recebidos" });
    expect(Array.isArray(recebidos)).toBe(true);

    const inadimplentes = await caller.honorarios.listByStatus({ status: "inadimplentes" });
    expect(Array.isArray(inadimplentes)).toBe(true);
  });
});

describe("urgencias router", () => {
  it("should list urgentes", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.urgencias.listUrgentes();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("relatorios router", () => {
  it("should list clientes with filters", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.relatorios.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get origens", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.relatorios.getOrigens();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should export CSV", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const csv = await caller.relatorios.exportarCSV({});
    expect(typeof csv).toBe("string");
    expect(csv.startsWith("\uFEFF")).toBe(true); // BOM UTF-8
  });
});
