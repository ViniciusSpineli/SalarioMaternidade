import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { clientesRouter } from "./routers/clientes";
import { gpsRouter } from "./routers/gps";
import { honorariosRouter } from "./routers/honorarios";
import { urgenciasRouter } from "./routers/urgencias";
import { relatoriosRouter } from "./routers/relatorios";
import { buscaRouter } from "./routers/busca";
import { graficosRouter } from "./routers/graficos";
import { metasRouter } from "./routers/metas";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: authRouter,

  clientes: clientesRouter,
  gps: gpsRouter,
  honorarios: honorariosRouter,
  urgencias: urgenciasRouter,
  relatorios: relatoriosRouter,
  busca: buscaRouter,
  graficos: graficosRouter,
  metas: metasRouter,
});

export type AppRouter = typeof appRouter;
