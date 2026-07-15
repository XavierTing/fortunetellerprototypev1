/**
 * Server-only helpers for the Daily Fortune route (PRD §5.4). `src/lib/bazi`
 * only exposes a full BIRTH-chart API (`computeChart`) — there's no "just
 * give me today's day pillar" helper (see src/lib/bazi/index.ts), so today's
 * 干支 is computed here directly via lunar-typescript
 * (`Solar.fromYmd(...).getLunar().getDayInGanZhi()`, per T5's brief), the
 * same calendar-math oracle `src/lib/bazi/pillars.ts` wraps. The result is
 * parsed through the *interpreter's* `parseGanZhi` (`@/lib/interpreter/
 * five-elements`), which itself keys straight into the engine's own
 * STEMS/BRANCHES tables (`@/lib/bazi/constants`) — so nothing here
 * duplicates the stem/branch/pinyin/element lexicon.
 *
 * No true-solar-time correction is applied to "today": that correction
 * exists to place a BIRTH instant relative to the person's own birth
 * longitude, which doesn't apply to "what calendar day is it right now" —
 * mirroring the engine's own "unknown birth time" path (`pillars.ts`'s
 * `noonSolar` branch), which also skips the correction and reads the
 * calendar date at face value.
 *
 * Caches one DailyFortune row per (profileId, date) — see `loadDailyFortune`
 * — so a same-day revisit always returns the cached card, never
 * regenerating (PRD §5.4/§10, `@@unique([profileId, date])` in
 * prisma/schema.prisma).
 */
import { Solar } from "lunar-typescript";
import { DateTime } from "luxon";
import type { Pillar, Pillars } from "@/lib/bazi";
import type { BranchRelation } from "@/lib/bazi";
import { computeBranchRelations } from "@/lib/bazi/relations";
import { db } from "@/lib/db";
import { getInterpreter } from "@/lib/interpreter/interpreter";
import type { Chart, DailyFortune } from "@/lib/interpreter/types";
import { elementRelation, parseGanZhi, type ElementRelation } from "@/lib/interpreter/five-elements";
import { checkDualRateLimit, RateLimitExceededError } from "@/lib/rate-limit";

export interface TodayInfo {
  /** "YYYY-MM-DD" civil date this fortune is cast for, in the resolved zone. */
  date: string;
  /** Two-character 干支 for today's day pillar, e.g. "甲子". */
  ganZhi: string;
  parsed: NonNullable<ReturnType<typeof parseGanZhi>>;
}

/**
 * Resolves "today" in `tzId` (falling back to the server's own local zone if
 * `tzId` is missing or unrecognized by the Intl/luxon zone database) and
 * computes that date's day-pillar 干支. `now` is injectable so callers
 * (tests) can pin the wall clock instead of racing real time.
 */
export function computeTodayInfo(tzId?: string, now: DateTime = DateTime.now()): TodayInfo {
  let zoned = tzId ? now.setZone(tzId) : now;
  if (!zoned.isValid) zoned = now;

  const solar = Solar.fromYmd(zoned.year, zoned.month, zoned.day);
  const ganZhi = solar.getLunar().getDayInGanZhi();
  const parsed = parseGanZhi(ganZhi);
  if (!parsed) {
    // lunar-typescript's stem/branch characters always round-trip through
    // the engine's own STEMS/BRANCHES tables — this can't actually fire,
    // but keep the return type honest rather than asserting past it.
    throw new Error(`today/lib: unparseable day ganzhi "${ganZhi}"`);
  }

  return { date: zoned.toISODate() as string, ganZhi, parsed };
}

export interface DayInteraction {
  type: BranchRelation["type"];
  note: string;
}

function relationKey(r: BranchRelation): string {
  return `${r.type}:${[...r.branches].sort().join(",")}`;
}

/**
 * Whether today's branch forms a classical relation (相冲 clash, 六合
 * harmony, 三合/相刑 punishment) against the user's own natal branches — the
 * standard almanac "does today clash with your chart" reading. Reuses the
 * engine's real `computeBranchRelations` (imported read-only straight from
 * `src/lib/bazi/relations.ts` — not re-exported through the `@/lib/bazi`
 * barrel, but nothing in it is duplicated here) rather than a hand-rolled
 * clash table: today's pillar takes the `hour` slot (the only nullable slot
 * on `Pillars`, so year/month/day always carry the real natal pillars), and
 * the result is diffed against `chart.branchRelations` (the natal chart's
 * own, already-computed relations) rather than merely filtered by branch
 * character — a plain "does this relation mention today's branch" filter
 * would misfire whenever today's branch happens to coincide with a natal
 * branch that's already in an unrelated relation with a *different* natal
 * pillar. When the birth hour is known, this necessarily checks today
 * against year/month/day only, not the natal hour pillar (there's no fifth
 * slot to hold both).
 */
export function dayPillarInteraction(chart: Chart, today: TodayInfo): DayInteraction | null {
  const todayPillar: Pillar = {
    stem: today.parsed.stem,
    branch: today.parsed.branch,
    stemPinyin: today.parsed.stemPinyin,
    branchPinyin: today.parsed.branchPinyin,
    stemElement: today.parsed.stemElement,
    branchElement: today.parsed.branchElement,
    hiddenStems: [],
  };
  const withToday: Pillars = {
    year: chart.pillars.year,
    month: chart.pillars.month,
    day: chart.pillars.day,
    hour: todayPillar,
  };
  const baseline = new Set(chart.branchRelations.map(relationKey));
  const relation = computeBranchRelations(withToday).find(
    (r) => !baseline.has(relationKey(r)) && r.branches.includes(today.parsed.branch)
  );
  return relation ? { type: relation.type, note: relation.note } : null;
}

export interface DailyFortuneResult {
  fortune: DailyFortune;
  today: TodayInfo;
  /** Today's stem element vs. the user's Day Master element — the ground truth the interpreter itself narrates in `fortune.body`/`fortune.energy`. */
  dayMasterRelation: ElementRelation;
  /** Today's branch vs. the natal Day Pillar's branch, if any classical relation fires — null on an ordinary, unremarkable day. */
  interaction: DayInteraction | null;
  /** True if this request returned an already-cached row (no regeneration). */
  cacheHit: boolean;
  castAt: Date;
}

/** Keys `checkDualRateLimit` needs — see `src/lib/rate-limit.ts`. */
export interface DailyRateLimitKeys {
  sessionKey: string;
  ipKey: string;
}

function rowToResult(
  content: string,
  createdAt: Date,
  today: TodayInfo,
  dayMasterRelation: ElementRelation,
  interaction: DayInteraction | null
): DailyFortuneResult {
  return {
    fortune: JSON.parse(content) as DailyFortune,
    today,
    dayMasterRelation,
    interaction,
    cacheHit: true,
    castAt: createdAt,
  };
}

/**
 * Read-only lookup: returns today's cached DailyFortune for `profileId` if
 * one already exists, or `null` otherwise — NEVER calls the interpreter or
 * writes to the database. This is the only daily-fortune loader the public,
 * sessionless share/OG surfaces (`api/share/daily-data.ts`,
 * `today/opengraph-image.tsx`'s fallback path) are allowed to call (see
 * FIX-report.md item 2 — a link-preview bot hitting an unvisited profile's
 * share image must never trigger a paid LLM generation or a DB write).
 * Generation stays exclusive to `loadDailyFortune` below, reached only from
 * the session-owner-gated `/today` page.
 */
export async function loadCachedDailyFortune(
  profileId: string,
  chart: Chart,
  tzId: string
): Promise<DailyFortuneResult | null> {
  const today = computeTodayInfo(tzId);
  const dayMasterRelation = elementRelation(chart.dayMaster.element, today.parsed.stemElement);
  const interaction = dayPillarInteraction(chart, today);

  const existing = await db.dailyFortune.findUnique({
    where: { profileId_date: { profileId, date: today.date } },
  });
  if (!existing) return null;
  return rowToResult(existing.content, existing.createdAt, today, dayMasterRelation, interaction);
}

/**
 * The owner-facing `/today` page's entry point: resolve today's date/干支,
 * return the cached DailyFortune for (profileId, date) if one already
 * exists, or generate + persist one via the interpreter otherwise. Handles
 * the rare concurrent-first-visit race (two requests both miss the cache)
 * by catching the unique-constraint write and re-reading instead of
 * erroring — the cache's whole point is exactly one row per
 * (profileId, date).
 *
 * `rateLimitKeys` is REQUIRED (not optional) precisely because this
 * function is the one place in the app allowed to trigger a fresh
 * `interpreter.dailyFortune()` call — see PRD §11 ("cost control... rate-
 * limit"). A cache hit never touches the limiter (replaying an already-paid-
 * for row is free); only the generate branch below checks and consumes a
 * token, throwing `RateLimitExceededError` when the caller is over budget
 * so `/today` can render a friendly inline state instead of a 500.
 */
export async function loadDailyFortune(
  profileId: string,
  chart: Chart,
  tzId: string,
  rateLimitKeys: DailyRateLimitKeys
): Promise<DailyFortuneResult> {
  const today = computeTodayInfo(tzId);
  const dayMasterRelation = elementRelation(chart.dayMaster.element, today.parsed.stemElement);
  const interaction = dayPillarInteraction(chart, today);

  const existing = await db.dailyFortune.findUnique({
    where: { profileId_date: { profileId, date: today.date } },
  });
  if (existing) {
    return rowToResult(existing.content, existing.createdAt, today, dayMasterRelation, interaction);
  }

  const rateLimit = checkDualRateLimit("daily", rateLimitKeys.sessionKey, rateLimitKeys.ipKey);
  if (!rateLimit.allowed) {
    throw new RateLimitExceededError("daily", rateLimit.retryAfterMs ?? 60_000);
  }

  const interpreter = getInterpreter();
  const fortune = await interpreter.dailyFortune(chart, today.ganZhi, today.date, interaction);

  try {
    const created = await db.dailyFortune.create({
      data: { profileId, date: today.date, content: JSON.stringify(fortune) },
    });
    return { fortune, today, dayMasterRelation, interaction, cacheHit: false, castAt: created.createdAt };
  } catch (err) {
    const raced = await db.dailyFortune.findUnique({
      where: { profileId_date: { profileId, date: today.date } },
    });
    if (raced) {
      return rowToResult(raced.content, raced.createdAt, today, dayMasterRelation, interaction);
    }
    throw err;
  }
}
