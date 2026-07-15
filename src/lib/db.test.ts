import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

// A real end-to-end check that the Prisma 7 driver-adapter wiring in db.ts
// actually talks to SQLite (not just that it type-checks) — creates and
// cleans up its own row against the local dev.db.
describe("db", () => {
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
