import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

// A real end-to-end check that the Prisma 7 driver-adapter wiring in db.ts
// actually talks to Postgres (not just that it type-checks) — it creates and
// cleans up its own row. It needs a reachable database, so it runs ONLY when
// DATABASE_URL is a postgres:// URL (e.g. a Supabase connection you've put in
// .env), and is skipped otherwise so `npm test` stays green with no DB.
const hasPostgres = /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL ?? "");

describe.skipIf(!hasPostgres)("db (live Postgres)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("can create, read, and delete a User row", async () => {
    const user = await db.user.create({ data: {} });
    expect(user.id).toBeTruthy();
    expect(user.email).toBeNull();

    const found = await db.user.findUnique({ where: { id: user.id } });
    expect(found?.id).toBe(user.id);

    await db.user.delete({ where: { id: user.id } });
    const afterDelete = await db.user.findUnique({ where: { id: user.id } });
    expect(afterDelete).toBeNull();
  });
});
