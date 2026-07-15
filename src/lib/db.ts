import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 uses driver adapters instead of a built-in query engine, so we
// build a SQLite adapter from DATABASE_URL and pass it to PrismaClient
// explicitly. Next.js loads `.env` for us at runtime, so this is populated
// automatically in both `next dev` and `next build && next start`.
const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
  return new PrismaClient({ adapter });
}

// Reuse a single PrismaClient across hot reloads in dev (Next.js clears the
// module cache on every edit, which would otherwise open a new SQLite
// connection per reload) and across serverless invocations in prod.
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
