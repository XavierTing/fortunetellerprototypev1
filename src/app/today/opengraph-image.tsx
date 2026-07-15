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
import { renderDailyCard, SHARE_SIZES } from "@/app/api/share/render";

export const alt = "Today's fortune · Cinnabar";
export const size = SHARE_SIZES.og;
export const contentType = "image/png";

const FALLBACK = {
  name: "",
  date: new Date().toISOString().slice(0, 10),
  stemElementLabel: "",
  branchElementLabel: "",
  branchAnimal: "",
  dayMasterRelation: "same" as const,
  headline: "A short, honest daily fortune tied to your own chart.",
  energy: "",
  leanInto: "",
  goEasyOn: "",
};

export default async function Image() {
  const userId = await getSessionUserId();
  const profile = userId
    ? await db.profile.findFirst({
        where: { userId, isSelf: true, chartCache: { not: null } },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const data = profile ? await loadDailyCardData(profile.id) : null;
  if (!data) return renderDailyCard(FALLBACK, "og");
  return renderDailyCard(data, "og");
}
