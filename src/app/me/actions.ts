"use server";

/**
 * "Delete my data" (PRD §11's privacy commitment — README's Known
 * Limitations used to name "no profile deletion UI yet" as a real gap
 * before launch; this closes it). Deletes the session's `User` row, which
 * cascades (see prisma/schema.prisma's `onDelete: Cascade` on every
 * relation hanging off `User`/`Profile`) to every `Profile` this session
 * ever created, and everything keyed off those profiles: `Reading`,
 * `ChatThread` + its `ChatMessage`s, `DailyFortune`, and
 * `CompatibilityPair` (including the ad-hoc "person B" data embedded in
 * it). Then clears the session cookie so a later visit starts a genuinely
 * fresh anonymous identity rather than reusing a cookie pointing at a User
 * row that no longer exists.
 *
 * Destructive — the confirm-before-delete UX lives client-side in
 * `delete-data-button.tsx` (a plain `window.confirm`, since this is a
 * single irreversible action with no follow-up fields to review); this
 * action itself does no additional confirmation, matching the Server
 * Actions guide's guidance that render-time gating isn't a security
 * boundary — the boundary here is "must already own a valid session,"
 * checked below.
 */
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { clearSession, getSessionUserId } from "@/lib/session";

export async function deleteMyData(): Promise<void> {
  const userId = await getSessionUserId();
  if (userId) {
    try {
      await db.user.delete({ where: { id: userId } });
    } catch (err) {
      // P2025 = "record not found" (already deleted, e.g. a double-submit
      // racing itself) — nothing left to do. Any other error is real.
      const code = (err as { code?: string } | null)?.code;
      if (code !== "P2025") throw err;
    }
  }
  await clearSession();
  redirect("/me");
}
