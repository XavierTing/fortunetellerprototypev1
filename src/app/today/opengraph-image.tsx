/**
 * Next.js file-convention hook for `/today`'s link-preview image. Unlike
 * `/reading/[id]` and `/match/[id]`, this route has no id in its URL — it
 * always shows *the current session's* fortune — so this necessarily reads
 * the session cookie (`getSessionUserId`) rather than a route param. That
 * means an actual link-preview crawler (which never sends this app's
 * cookie) always sees the generic branded fallback below; the personalized
 * card is what the *page owner's own* browser would embed if it re-shared
 * `/today` from a context that reuses their cookie. The session-independent,
 * always-personalized artifact for a specific profile is
 * `/api/share/daily/[profileId]` (see `./share-button.tsx`) — that's the
 * link this route's own Share button actually hands out.
 */
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { loadDailyCardData } from "@/app/api/share/daily-data";
import { dailyCardFallback, renderDailyCard, SHARE_SIZES } from "@/app/api/share/render";

export const alt = "Today's fortune · Cinnabar";
export const size = SHARE_SIZES.og;
export const contentType = "image/png";

export default async function Image() {
  const userId = await getSessionUserId();
  const profile = userId
    ? await db.profile.findFirst({
        where: { userId, isSelf: true, chartCache: { not: null } },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const data = profile ? await loadDailyCardData(profile.id) : null;
  return renderDailyCard(data ?? dailyCardFallback(), "og");
}
