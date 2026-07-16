import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 uses driver adapters instead of a bundled query engine. We use the
// libsql adapter so the SAME code runs everywhere:
//   • local dev  → a plain SQLite file (`DATABASE_URL="file:./dev.db"`)
//   • production → Turso over libsql (`DATABASE_URL="libsql://…"` + auth token)
// This matters on serverless hosts (Netlify/Vercel): their filesystem is
// ephemeral and read-only, so a file-based SQLite DB can't persist writes — a
// hosted libsql database (Turso) is required. Next.js loads `.env` at runtime,
// so these are populated in `next dev` and `next build && next start` alike.
const url = process.env.DATABASE_URL ?? "file:./dev.db";
// Only set for a remote Turso database. Undefined for local `file:` URLs, which
// libsql simply ignores — so the same construction works in both environments.
const authToken = process.env.TURSO_AUTH_TOKEN;

function createPrismaClient() {
  const adapter = new PrismaLibSql({ url, authToken });
  return new PrismaClient({ adapter });
}

// Reuse a single PrismaClient across hot reloads in dev (Next.js clears the
// module cache on every edit, which would otherwise open a new connection per
// reload) and across serverless invocations in prod.
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
