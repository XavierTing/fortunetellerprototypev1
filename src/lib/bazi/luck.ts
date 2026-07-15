/**
 * 大运 (luck pillar) sequence.
 *
 * GENDER CONVENTION: BaZi's 大运 direction depends on both the year stem's
 * yin/yang polarity AND the person's gender (yang-year male / yin-year
 * female runs forward through the 60-cycle; yang-year female / yin-year
 * male runs backward). `gender` is OPTIONAL here and defaults to "male"
 * when omitted — this is an arbitrary but deterministic choice, made
 * because PRD §5.1's `BirthInput` doesn't currently collect gender at all.
 * Flagged in the T1 report as a product follow-up: the birth-data form
 * should add a gender field before this default matters for real users,
 * since a wrong default silently reverses forward/backward direction for
 * roughly half of them.
 *
 * The `sect` passed to lunar-typescript's `EightChar.getYun` is fixed at 1,
 * matching the sect=1 choice made for the day/hour pillars in pillars.ts —
 * both need to agree on where the 23:00 zi-hour boundary falls.
 */
import type { EightChar } from "lunar-typescript";

export type Gender = "male" | "female";

export interface LuckPillarEntry {
  age: number;
  stem: string;
  branch: string;
}

export interface LuckPillars {
  startAge: number;
  forward: boolean;
  pillars: LuckPillarEntry[];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * @param eightChar The Beijing-reference-frame EightChar (see pillars.ts) —
 *   大运 timing is jieqi-relative, so it must use the same reference frame
 *   as the year/month pillars.
 * @param gender Defaults to "male" — see file header.
 * @param pillarCount How many real (post-index-0) luck pillars to return.
 */
export function computeLuckPillars(
  eightChar: EightChar,
  gender: Gender = "male",
  pillarCount = 8
): LuckPillars {
  const genderNum = gender === "male" ? 1 : 0;
  const yun = eightChar.getYun(genderNum, 1);
  const forward = yun.isForward();
  const startAge = yun.getStartYear() + yun.getStartMonth() / 12 + yun.getStartDay() / 360;

  const daYuns = yun.getDaYun(pillarCount + 1); // index 0 is the pre-luck placeholder
  const pillars: LuckPillarEntry[] = daYuns
    .filter((d) => d.getIndex() >= 1)
    .map((d) => {
      const gz = d.getGanZhi();
      return { age: d.getStartAge(), stem: gz.charAt(0), branch: gz.charAt(1) };
    });

  return { startAge: round2(startAge), forward, pillars };
}
