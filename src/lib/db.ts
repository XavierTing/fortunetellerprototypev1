import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 uses driver adapters instead of a bundled query engine. We use the
// node-postgres adapter, so the app talks to any Postgres — locally and, in
// production, to Supabase.
//
// On serverless hosts (Netlify/Vercel) use Supabase's **connection-pooler**
// URL (Supavisor, transaction mode) as DATABASE_URL — a fresh function
// instance mustn't open a direct 5432 connection per request. The pooler
// multiplexes them; node-postgres issues unnamed queries, which are safe
// through a transaction-mode pooler. See DEPLOY-NETLIFY.md.
//
// Next.js loads `.env` at runtime, so DATABASE_URL is populated in `next dev`
// and `next build && next start` alike.
const connectionString = process.env.DATABASE_URL;

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// Reuse a single PrismaClient (and its underlying pg pool) across hot reloads
// in dev and across serverless invocations that share a warm instance.
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
