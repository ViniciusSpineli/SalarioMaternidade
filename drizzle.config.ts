import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({ path: [".env.local", ".env"] });

// SQLite: DATABASE_URL é o caminho do arquivo (ex.: "file:./data/controle.db"
// ou "./data/controle.db"). Se não definido, usa o padrão local.
let dbPath = (process.env.DATABASE_URL || "./data/controle.db").trim();
if (dbPath.startsWith("file:")) dbPath = dbPath.slice("file:".length);

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
