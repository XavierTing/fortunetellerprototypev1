/**
 * Builds the four (or three, if birth time is unknown) BaZi pillars using
 * lunar-typescript as the calendar-math oracle, plus the true-solar-time and
 * Beijing-reference-frame corrections from solar-time.ts.
 *
 * TWO SEPARATE lunar-typescript EightChar objects are constructed per chart:
 *
 *   - `beijingEightChar` — the birth's UTC instant re-expressed in the fixed
 *     UTC+8 frame lunar-typescript's jieqi table is tabulated in. Sourced
 *     ONLY for the YEAR and MONTH pillars (jieqi-relative).
 *   - `localEightChar` — the birth's TRUE SOLAR TIME (longitude + equation
 *     of time corrected local apparent time). Sourced ONLY for the DAY and
 *     HOUR pillars (the person's own solar day/hour, not Beijing's).
 *
 * See solar-time.ts's file header for the full rationale — this split is
 * deliberate, not an oversight, and is the crux of the "correctness moat"
 * for non-Chinese birth locations.
 *
 * `beijingEightChar` is also returned (not part of the public Chart shape)
 * because luck.ts needs the SAME jieqi-relative reference frame to compute
 * 大运 (luck pillar) timing.
 */
import { Solar } from "lunar-typescript";
import type { EightChar } from "lunar-typescript";
import { DateTime } from "luxon";
import { Element, YinYang, branchInfo, stemInfo } from "./constants";
import { computeTrueSolarTime, toBeijingReferenceFields } from "./solar-time";

export interface Pillar {
  stem: string;
  branch: string;
  stemPinyin: string;
  branchPinyin: string;
  stemElement: Element;
  branchElement: Element;
  hiddenStems: string[];
}

export interface DayMaster {
  stem: string;
  stemPinyin: string;
  element: Element;
  yinYang: YinYang;
}

export interface Pillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
}

export interface PillarsInput {
  date: string;
  time: string | null;
  lat: number;
  lng: number;
  tzId: string;
}

export interface BuiltPillars {
  pillars: Pillars;
  trueSolarTime: string | null;
  dayMaster: DayMaster;
  zodiac: string;
  /** The Beijing-reference EightChar, exposed for luck.ts's 大运 computation. */
  beijingEightChar: EightChar;
}

function buildPillar(stem: string, branch: string, hiddenStems: string[]): Pillar {
  const s = stemInfo(stem);
  const b = branchInfo(branch);
  return {
    stem,
    branch,
    stemPinyin: s.pinyin,
    branchPinyin: b.pinyin,
    stemElement: s.element,
    branchElement: b.element,
    hiddenStems,
  };
}

function parseCivil(date: string, time: string | null, tzId: string): DateTime {
  const timePart = time ?? "12:00:00";
  const normalizedTime = timePart.length === 5 ? `${timePart}:00` : timePart;
  const dt = DateTime.fromISO(`${date}T${normalizedTime}`, { zone: tzId });
  if (!dt.isValid) {
    throw new Error(
      `bazi/pillars: invalid birth date/time/timezone ("${date}T${normalizedTime}" @ "${tzId}"): ${dt.invalidReason} ${dt.invalidExplanation ?? ""}`.trim()
    );
  }
  return dt;
}

export function buildPillars(input: PillarsInput): BuiltPillars {
  const civilLocal = parseCivil(input.date, input.time, input.tzId);

  // --- Year / Month: jieqi-relative, use the Beijing reference frame. ---
  const beijingFields = toBeijingReferenceFields(civilLocal.toUTC());
  const beijingSolar = Solar.fromYmdHms(
    beijingFields.year,
    beijingFields.month,
    beijingFields.day,
    beijingFields.hour,
    beijingFields.minute,
    beijingFields.second
  );
  const beijingEightChar = beijingSolar.getLunar().getEightChar();

  const yearPillar = buildPillar(
    beijingEightChar.getYearGan(),
    beijingEightChar.getYearZhi(),
    beijingEightChar.getYearHideGan()
  );
  const monthPillar = buildPillar(
    beijingEightChar.getMonthGan(),
    beijingEightChar.getMonthZhi(),
    beijingEightChar.getMonthHideGan()
  );

  // --- Day / Hour: the birth's own local solar day/hour. ---
  let dayPillar: Pillar;
  let hourPillar: Pillar | null;
  let trueSolarTimeIso: string | null;

  if (input.time !== null) {
    const trueSolar = computeTrueSolarTime(civilLocal, input.lng);
    const t = trueSolar.dateTime;
    const localSolar = Solar.fromYmdHms(t.year, t.month, t.day, t.hour, t.minute, t.second);
    const localEightChar = localSolar.getLunar().getEightChar();
    // sect=1 makes the reported day pillar roll forward at 23:00 rather than
    // civil midnight — the only choice that stays consistent with
    // lunar-typescript's hour-stem derivation (see file header + T1 report).
    localEightChar.setSect(1);
    dayPillar = buildPillar(localEightChar.getDayGan(), localEightChar.getDayZhi(), localEightChar.getDayHideGan());
    hourPillar = buildPillar(
      localEightChar.getTimeGan(),
      localEightChar.getTimeZhi(),
      localEightChar.getTimeHideGan()
    );
    trueSolarTimeIso = t.toFormat("yyyy-MM-dd'T'HH:mm:ss");
  } else {
    // No birth time: use the given local calendar date at a neutral noon
    // (no true-solar correction is possible without a clock time; noon
    // avoids the 23:00 day-rollover edge case entirely).
    const noonSolar = Solar.fromYmdHms(civilLocal.year, civilLocal.month, civilLocal.day, 12, 0, 0);
    const noonEightChar = noonSolar.getLunar().getEightChar();
    noonEightChar.setSect(1);
    dayPillar = buildPillar(noonEightChar.getDayGan(), noonEightChar.getDayZhi(), noonEightChar.getDayHideGan());
    hourPillar = null;
    trueSolarTimeIso = null;
  }

  const dayMaster: DayMaster = {
    stem: dayPillar.stem,
    stemPinyin: dayPillar.stemPinyin,
    element: dayPillar.stemElement,
    yinYang: stemInfo(dayPillar.stem).yinYang,
  };

  const zodiac = branchInfo(yearPillar.branch).zodiac;

  return {
    pillars: { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar },
    trueSolarTime: trueSolarTimeIso,
    dayMaster,
    zodiac,
    beijingEightChar,
  };
}
