import { z } from "zod";
import crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { publicProcedure, router } from "../_core/trpc";
import { sdk } from "../_core/sdk";
import { ENV } from "../_core/env";
import { getUserLocalByEmail, upsertUser } from "../db";

// Hash de senha (SHA-256). Simples e suficiente para uso local.
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export const authRouter = router({
  // Usuário logado atual (null se não autenticado)
  me: publicProcedure.query(opts => opts.ctx.user),

  // Login com email e senha: valida contra usuariosLocais e cria a sessão (cookie JWT)
  login: publicProcedure
    .input(
      z.object({
        // "email" aqui é o identificador de login (pode ser um email ou um
        // usuário simples como "admin@local"), por isso não exigimos formato estrito.
        email: z.string().min(1),
        senha: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const email = input.email.trim().toLowerCase();
      const usuario = await getUserLocalByEmail(email);

      const senhaOk =
        !!usuario && !!usuario.ativo && hashPassword(input.senha) === usuario.senhaHash;

      if (!usuario || !senhaOk) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou senha inválidos",
        });
      }

      // Garante um registro correspondente em `users` — é dele que as rotas
      // protegidas (protectedProcedure) leem o usuário da sessão.
      const openId = `local:${usuario.email}`;
      await upsertUser({
        openId,
        name: usuario.nome,
        email: usuario.email,
        loginMethod: "local",
        role: usuario.role,
        lastSignedIn: new Date(),
      });

      // Assina o JWT de sessão (mesma máquina de cookies do OAuth) e grava o cookie.
      const token = await sdk.signSession(
        { openId, appId: ENV.appId || "local", name: usuario.nome },
        { expiresInMs: ONE_YEAR_MS }
      );
      ctx.res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: false,
        maxAge: ONE_YEAR_MS,
      });

      return {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        role: usuario.role,
      };
    }),

  // Logout: limpa o cookie de sessão
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(COOKIE_NAME, { path: "/" });
    return { success: true } as const;
  }),
});
