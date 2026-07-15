/**
 * Loads a `Profile` + today's ALREADY-CACHED `DailyFortune` (in the
 * profile's own tzId) and reshapes them into the plain `DailyCardData` the
 * renderer needs. Deliberately public/unauthenticated — same posture as
 * `compat-data.ts` and `reading-data.ts`.
 *
 * STRICTLY READ-ONLY (see FIX-report.md item 2): uses `@/app/today/lib`'s
 * `loadCachedDailyFortune`, which only ever reads — it never calls the
 * interpreter and never writes a `DailyFortune` row. Before this fix, this
 * loader called the generating `loadDailyFortune` directly, which meant a
 * link-preview bot (Slackbot/iMessage/Twitterbot unfurling a shared link,
 * or simply someone opening a share-image URL for a profile that never
 * visited `/today`) could trigger an unauthenticated, uncapped LLM
 * generation + a DB write with no session at all. Now: if nothing has been
 * cast yet, this returns `null` and the caller (the generic
 * `/api/share/[type]/[id]` route and `today/opengraph-image.tsx`) renders
 * the branded fallback card instead — generation stays exclusive to the
 * session-owner-gated `/today` page.
 */
import { db } from "@/lib/db";
import { loadCachedDailyFortune } from "@/app/today/lib";
import { ELEMENT_LABEL } from "@/lib/interpreter/five-elements";
import type { Chart } from "@/lib/interpreter/types";
import type { DailyCardData } from "./render";

export async function loadDailyCardData(profileId: string): Promise<DailyCardData | null> {
  const profile = await db.profile.findUnique({ where: { id: profileId } });
  if (!profile || !profile.chartCache) return null;
  const chart = JSON.parse(profile.chartCache) as Chart;

  const cached = await loadCachedDailyFortune(profile.id, chart, profile.tzId);
  if (!cached) return null;
  const { fortune, today, dayMasterRelation } = cached;

  return {
    name: profile.name?.trim() || "",
    date: today.date,
    stemElementLabel: ELEMENT_LABEL[today.parsed.stemElement],
    branchElementLabel: ELEMENT_LABEL[today.parsed.branchElement],
    branchAnimal: today.parsed.branchAnimal,
    dayMasterRelation,
    headline: fortune.headline,
    energy: fortune.energy,
    leanInto: fortune.leanInto,
    goEasyOn: fortune.goEasyOn,
  };
}
