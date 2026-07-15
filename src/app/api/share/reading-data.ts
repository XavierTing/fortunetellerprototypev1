/**
 * Loads a `Profile` + its most recent `Reading` and reshapes them into the
 * plain `ReadingCardData` the renderer needs. Deliberately public/
 * unauthenticated (no `getSessionUserId` check) — same posture as
 * `compat-data.ts`'s file header explains: this is exactly what a
 * link-preview scraper or a friend clicking a shared card link needs to
 * fetch with no session cookie at all. Only the Day Master, element tally,
 * and one headline are exposed here — no birth date/place, no lat/lng, no
 * full card-by-card reading text. The detailed `/reading/[id]` page itself
 * still requires the profile owner's session (see that route).
 *
 * The id this module keys on is the *profile* id (`/reading/[id]`'s own
 * `id`, not a separate reading id) — there's no dedicated "reading detail"
 * route in this app, `/reading/[id]` always shows the latest Reading for
 * that profile, so the share card follows the same convention.
 */
import { db } from "@/lib/db";
import { ELEMENT_LABEL } from "@/lib/interpreter/five-elements";
import { getInterpreter } from "@/lib/interpreter/interpreter";
import type { Card, Chart } from "@/lib/interpreter/types";
import type { ReadingCardData } from "./render";

const HERO_CARD_ID = "chart-at-a-glance";

export async function loadReadingCardData(profileId: string): Promise<ReadingCardData | null> {
  const profile = await db.profile.findUnique({ where: { id: profileId } });
  if (!profile || !profile.chartCache) return null;
  const chart = JSON.parse(profile.chartCache) as Chart;

  const existing = await db.reading.findFirst({
    where: { profileId },
    orderBy: { generatedAt: "desc" },
  });

  let cards: Card[];
  if (existing) {
    cards = JSON.parse(existing.cards) as Card[];
  } else {
    // No reading has been generated for this profile yet (e.g. a share
    // link opened before the owner finished the natal-reading page).
    // `natalReading()` is the Interpreter contract's non-streaming
    // one-shot method (the streaming route uses the same interpreter,
    // just yielded card-by-card) — generate once and persist it, so a
    // later real visit to `/reading/[id]` reuses this exact reading
    // instead of paying for a second generation.
    const interpreter = getInterpreter();
    const reading = await interpreter.natalReading(chart);
    await db.reading.create({
      data: { profileId, cards: JSON.stringify(reading.cards), model: interpreter.model },
    });
    cards = reading.cards;
  }

  const hero = cards.find((c) => c.id === HERO_CARD_ID) ?? cards[0];

  return {
    name: profile.name?.trim() || "",
    dayMasterElement: chart.dayMaster.element,
    dayMasterElementLabel: ELEMENT_LABEL[chart.dayMaster.element],
    dayMasterStrength: chart.dayMasterStrength,
    zodiac: chart.zodiac,
    elements: chart.elements,
    favorableElements: chart.favorableElements,
    tagline: hero?.headline ?? "",
  };
}
