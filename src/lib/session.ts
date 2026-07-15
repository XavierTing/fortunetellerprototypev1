import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { User } from "@/generated/prisma/client";

/**
 * Cinnabar has no real auth in the prototype (PRD §7.6 — freemium is
 * *designed*, not enforced). Instead every visitor gets an anonymous,
 * httpOnly `cid` cookie holding a UUID that doubles as their User.id, so
 * saved profiles/readings/chat history survive a refresh without a signup
 * step (PRD §5.1 — never gate the first "aha" behind auth).
 */
const CID_COOKIE = "cid";
const CID_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

/**
 * Reads the `cid` cookie and returns the matching User, creating both the
 * cookie and the User row on first visit.
 *
 * Next.js only allows writing cookies from a Server Action or Route
 * Handler (not from a Server Component render) — call this from one of
 * those. For a read-only lookup inside a Server Component, use
 * `getSessionUserId` instead and treat a missing id as "not signed in yet".
 */
export async function getOrCreateUser(): Promise<User> {
  const cookieStore = await cookies();
  const existingId = cookieStore.get(CID_COOKIE)?.value;

  if (existingId) {
    const user = await db.user.findUnique({ where: { id: existingId } });
    if (user) return user;
  }

  // No cookie yet, or it pointed at a User row that no longer exists
  // (e.g. a reset local dev database) — mint a fresh anonymous identity.
  const user = await db.user.create({ data: { id: randomUUID() } });

  cookieStore.set(CID_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CID_MAX_AGE_SECONDS,
  });

  return user;
}

/**
 * Read-only variant safe to call from Server Components: returns the
 * session's User id if the cookie is present, or undefined otherwise.
 * Does not create a cookie or a User row.
 */
export async function getSessionUserId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CID_COOKIE)?.value;
}

/**
 * Clears the anon session cookie — used by the "Delete my data" flow
 * (PRD §11's privacy commitment, `/me`'s deletion action) so a visit right
 * after deleting the underlying `User` row mints a brand-new anonymous
 * identity instead of reusing a cookie pointing at a row that's gone (the
 * same "stale cookie, missing row" case `getOrCreateUser` already
 * tolerates — this just triggers it intentionally rather than by
 * accident). Callable only from a Server Action or Route Handler, same
 * restriction as `getOrCreateUser`.
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CID_COOKIE);
}
