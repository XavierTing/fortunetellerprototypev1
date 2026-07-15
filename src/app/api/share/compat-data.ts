/**
 * Loads a `CompatibilityPair` row and reshapes it into the plain
 * `CompatCardData` the renderer needs. Deliberately public/unauthenticated
 * (no `getSessionUserId` check) — this is exactly what a link-preview
 * scraper (Slackbot, Twitterbot, an iMessage/WhatsApp unfurl) or a friend
 * clicking a shared image link needs to fetch with no session cookie at
 * all. Only the score, verdict, and the two display names are exposed here
 * — no birth data, no pillars, no full reading text — the detailed
 * `/match/[id]` page itself still requires the profileA owner's session
 * (see that route), matching this app's existing birth-data privacy
 * posture (PRD §11).
 */
import { db } from "@/lib/db";
import { ELEMENT_LABEL } from "@/lib/interpreter/five-elements";
import type { Chart, Compat } from "@/lib/interpreter/types";
import type { PersonBRecord } from "@/app/match/types";
import type { CompatCardData } from "./render";

export async function loadCompatCardData(id: string): Promise<CompatCardData | null> {
  const pair = await db.compatibilityPair.findUnique({
    where: { id },
    include: { profileA: true },
  });
  if (!pair) return null;

  const result = JSON.parse(pair.result) as Compat;
  const personB = JSON.parse(pair.personB) as PersonBRecord;
  const chartA = pair.profileA.chartCache ? (JSON.parse(pair.profileA.chartCache) as Chart) : null;

  return {
    nameA: pair.profileA.name?.trim() || "You",
    nameB: personB.name?.trim() || "Them",
    dayMasterLabelA: chartA ? ELEMENT_LABEL[chartA.dayMaster.element] : "",
    dayMasterLabelB: personB.chart ? ELEMENT_LABEL[personB.chart.dayMaster.element] : "",
    score: result.score,
    verdict: result.verdict,
  };
}
