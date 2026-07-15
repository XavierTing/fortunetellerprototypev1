/**
 * The deterministic BaZi (八字) engine — public entry point.
 *
 * `computeChart` is the module's only intended external API: pure,
 * side-effect-free, fully typed. See PRD.md §5.1/§5.2/§7.2/§11 for the
 * product requirements this satisfies, and `.build-reports/T1-report.md`
 * for how each internal is validated against lunar-typescript / hand
 * -verified reference points.
 */
import tzLookup from "tz-lookup";
import type { Element } from "./constants";
import { computeDayMasterStrength, computeFavorableUnfavorable, tallyElements } from "./elements";
import type { Gender } from "./luck";
import { computeLuckPillars } from "./luck";
import { buildPillars } from "./pillars";
import type { DayMaster, Pillars } from "./pillars";
import { computeBranchRelations } from "./relations";
import type { BranchRelation } from "./relations";

export type { Element } from "./constants";
export type { Pillar, Pillars, DayMaster } from "./pillars";
export type { BranchRelation } from "./relations";
export type { Gender } from "./luck";

export interface ChartInput {
  date: string;
  time: string | null;
  lat: number;
  lng: number;
  tzId?: string;
  /**
   * Optional; defaults to "male" if omitted — see luck.ts's file header for
   * the full convention and its product caveat (PRD's BirthInput doesn't
   * yet collect gender).
   */
  gender?: Gender;
}

export interface Chart {
  input: {
    date: string;
    time: string | null;
    lat: number;
    lng: number;
    tzId: string;
  };
  trueSolarTime: string | null;
  pillars: Pillars;
  dayMaster: DayMaster;
  elements: Record<Element, number>;
  dayMasterStrength: "strong" | "weak" | "balanced";
  favorableElements: Element[];
  unfavorableElements: Element[];
  luckPillars: {
    startAge: number;
    forward: boolean;
    pillars: { age: number; stem: string; branch: string }[];
  };
  zodiac: string;
  branchRelations: BranchRelation[];
}

export function computeChart(input: ChartInput): Chart {
  const tzId = input.tzId ?? tzLookup(input.lat, input.lng);

  const built = buildPillars({ date: input.date, time: input.time, lat: input.lat, lng: input.lng, tzId });

  const elements = tallyElements(built.pillars);
  const dayMasterStrength = computeDayMasterStrength(elements, built.dayMaster.element);
  const { favorable, unfavorable } = computeFavorableUnfavorable(
    built.dayMaster.element,
    dayMasterStrength,
    elements
  );

  const luckPillars = computeLuckPillars(built.beijingEightChar, input.gender ?? "male");
  const branchRelations = computeBranchRelations(built.pillars);

  return {
    input: { date: input.date, time: input.time, lat: input.lat, lng: input.lng, tzId },
    trueSolarTime: built.trueSolarTime,
    pillars: built.pillars,
    dayMaster: built.dayMaster,
    elements,
    dayMasterStrength,
    favorableElements: favorable,
    unfavorableElements: unfavorable,
    luckPillars,
    zodiac: built.zodiac,
    branchRelations,
  };
}
