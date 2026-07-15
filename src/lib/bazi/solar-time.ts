/**
 * True solar time (真太阳时) and the "Beijing reference frame" conversion.
 *
 * WHY TWO DIFFERENT TIME CORRECTIONS EXIST IN THIS FILE (read this before
 * touching pillars.ts, which is where they're actually applied):
 *
 * 1. `computeTrueSolarTime` — local apparent solar time at the birth's exact
 *    longitude: civil clock -> UTC instant (via luxon, IANA-zone +
 *    historical-DST aware) -> + longitude correction (4 min per degree east)
 *    -> + the equation of time (the sun's ~±16 min "fast/slow" wobble over
 *    the year). This is what the 12 two-hour 时辰 windows are traditionally
 *    defined against, and it's the PRD's "why your hour pillar is precise"
 *    feature (§5.1) — it's what makes the DAY and HOUR pillars correct for a
 *    birth far from its timezone's nominal meridian (the "Singapore/Malaysia
 *    click here" problem PRD §14 calls out).
 *
 * 2. `toBeijingReferenceFields` — a *different* correction, needed because
 *    lunar-typescript's precomputed 节气 (solar term) table is tabulated in
 *    China Standard Time (a fixed UTC+8, confirmed empirically: feeding
 *    `Solar.fromYmdHms(2024,2,4,16,27,7,...)` flips the year/month pillar at
 *    exactly the publicly-documented Lichun 2024 instant, 2024-02-04 16:27
 *    Beijing time). The YEAR and MONTH pillars are defined by jieqi
 *    crossings — a single global astronomical instant — so to compare a
 *    birth anywhere in the world against that table correctly, the birth's
 *    UTC instant must be re-expressed in that *same* UTC+8 reference frame
 *    first. This has nothing to do with the birth's own longitude/DST; it's
 *    a fixed +8h shift, deliberately NOT using the `Asia/Shanghai` IANA zone
 *    (which carries China's real 1986-1991 DST history) because the
 *    published Chinese almanac's "Beijing time" convention for solar terms
 *    is, and always has been, a fixed UTC+8 — see pillars.ts for how both
 *    corrections are combined.
 */
import { DateTime } from "luxon";

/**
 * Equation of time (minutes), the difference between apparent (sundial) and
 * mean solar time. Standard simplified NOAA-style approximation, accurate to
 * within about a minute of true ephemeris values — more than sufficient
 * precision for placing a birth within one of the 12 two-hour 时辰 windows.
 *
 * `dayOfYear` is 1-366 (ordinal day). Verified against well-known reference
 * checkpoints in solar-time.test.ts (early-Feb minimum ~-14min, early-Nov
 * maximum ~+16min, zero crossings near mid-April/mid-June).
 */
export function equationOfTimeMinutes(dayOfYear: number): number {
  const b = (2 * Math.PI * (dayOfYear - 81)) / 365;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

export interface TrueSolarResult {
  /** UTC-anchored DateTime whose calendar fields are the true local solar wall-clock reading. */
  dateTime: DateTime;
  /** Total correction applied (longitude + equation of time), in minutes. */
  correctionMinutes: number;
}

/**
 * Local apparent (true) solar time for a civil instant at a given longitude.
 *
 * `civilLocal` must already be a *valid* zoned DateTime (i.e. the caller
 * resolved the birth's IANA tzId + historical DST via luxon) — this function
 * only adds the longitude + equation-of-time corrections on top of the UTC
 * instant it represents; it does no timezone lookup itself.
 */
export function computeTrueSolarTime(civilLocal: DateTime, lng: number): TrueSolarResult {
  const utc = civilLocal.toUTC();
  const longitudeMinutes = lng * 4; // 4 minutes of time per degree, east positive
  const eot = equationOfTimeMinutes(utc.ordinal);
  const correctionMinutes = longitudeMinutes + eot;
  return { dateTime: utc.plus({ minutes: correctionMinutes }), correctionMinutes };
}

/**
 * Re-express a UTC instant's calendar fields as if read off a fixed UTC+8
 * ("Beijing time") clock — see the file-level comment for why this fixed
 * (non-DST, non-IANA) shift is the correct reference frame for comparing a
 * birth against lunar-typescript's jieqi table.
 */
export function toBeijingReferenceFields(utc: DateTime): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const shifted = utc.toUTC().plus({ hours: 8 });
  return {
    year: shifted.year,
    month: shifted.month,
    day: shifted.day,
    hour: shifted.hour,
    minute: shifted.minute,
    second: shifted.second,
  };
}
