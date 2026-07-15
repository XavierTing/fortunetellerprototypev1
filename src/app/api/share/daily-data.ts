/**
 * Loads a `Profile` + today's `DailyFortune` (in the profile's own tzId)
 * and reshapes them into the plain `DailyCardData` the renderer needs.
 * Deliberately public/unauthenticated — same posture as `compat-data.ts`
 * and `reading-data.ts`.
 *
 * Reuses `@/app/today/lib`'s `loadDailyFortune` wholesale rather than
 * re-deriving "what day is it, cache-or-generate" logic here: that
 * function already resolves today's date in the profile's own timezone,
 * returns the cached row when one exists, and otherwise generates +
 * persists one via the interpreter with the same race-safe upsert the
 * `/today` page itself relies on — so a share link opened before the
 * owner ever visited `/today` still renders a real (and subsequently
 * cached) card instead of a placeholder or a 404.
 */
import { db } from "@/lib/db";
import { loadDailyFortune } from "@/app/today/lib";
import { ELEMENT_LABEL } from "@/lib/interpreter/five-elements";
import type { Chart } from "@/lib/interpreter/types";
import type { DailyCardData } from "./render";

export async function loadDailyCardData(profileId: string): Promise<DailyCardData | null> {
  const profile = await db.profile.findUnique({ where: { id: profileId } });
  if (!profile || !profile.chartCache) return null;
  const chart = JSON.parse(profile.chartCache) as Chart;

  const { fortune, today, dayMasterRelation } = await loadDailyFortune(profile.id, chart, profile.tzId);

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
