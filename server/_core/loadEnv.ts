import dotenv from "dotenv";

// Carrega .env.local (usado pela documentação/instalação) e .env como fallback.
// Precisa ser importado ANTES de qualquer módulo que leia process.env no topo.
dotenv.config({ path: [".env.local", ".env"] });
