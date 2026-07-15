/**
 * Local mirror of the deterministic BaZi `Chart` shape produced by the
 * (not-yet-built) `@/lib/bazi` engine module.
 *
 * WHY THIS FILE EXISTS: the interpreter layer needs to compile, run, and be
 * unit-tested independently of the engine module, which another task builds.
 * Once `@/lib/bazi` exists and exports these types for real, every file in
 * `src/lib/interpreter/**` should switch its import from
 * `./chart-types` to `@/lib/bazi` (the field names/shapes below were written
 * to match the task brief's `Chart` type exactly, so the swap should be a
 * pure import-path change — no field renames expected). Do not deepen this
 * file into engine logic; it is a type mirror only.
 */

/** The five Chinese elements (Wu Xing / 五行). */
export type Element = "wood" | "fire" | "earth" | "metal" | "water";

export type YinYang = "yin" | "yang";

/** A single stem-branch pillar (干支) — year/month/day/hour. */
export interface Pillar {
  /** Heavenly stem, Chinese character (e.g. "甲"). */
  stem: string;
  /** Heavenly stem, pinyin with tone marks (e.g. "jiǎ"). */
  stemPinyin: string;
  /** Earthly branch, Chinese character (e.g. "子"). */
  branch: string;
  /** Earthly branch, pinyin with tone marks (e.g. "zǐ"). */
  branchPinyin: string;
  /** Element of the pillar's heavenly stem. */
  element: Element;
  /** Yin/Yang polarity of the pillar's heavenly stem. */
  yinYang: YinYang;
}

export interface Pillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  /** Null when birth time is unknown — engine degrades gracefully (PRD §5.1). */
  hour: Pillar | null;
}

export interface DayMaster {
  stem: string;
  stemPinyin: string;
  element: Element;
  yinYang: YinYang;
}

/** One 大运 (luck pillar) segment in the sequence. */
export interface LuckPillar {
  /** Age at which this luck pillar begins. */
  startAge: number;
  stem: string;
  stemPinyin: string;
  branch: string;
  branchPinyin: string;
  element: Element;
}

export interface LuckPillars {
  /** Age at which the very first luck pillar takes effect. */
  startAge: number;
  /** Whether the sequence runs forward or reverse through the 12 branches. */
  forward: boolean;
  pillars: LuckPillar[];
}

/** A branch relationship (三合/六合/相冲/相刑/…) found in the chart. */
export interface BranchRelation {
  /** e.g. "三合" (three-harmony), "六合" (six-harmony), "相冲" (clash), "相刑" (punishment). */
  type: string;
  /** The branches involved, Chinese characters. */
  branches: string[];
  /** Plain-language note the engine attaches (ground truth, never invented by the LLM). */
  note: string;
}

export interface Chart {
  input: {
    date: string;
    time: string | null;
    lat: number;
    lng: number;
    tzId: string;
  };
  /** ISO-ish local time string once true-solar-time correction is applied, or null if unknown time. */
  trueSolarTime: string | null;
  pillars: Pillars;
  dayMaster: DayMaster;
  elements: Record<Element, number>;
  dayMasterStrength: "strong" | "weak" | "balanced";
  favorableElements: Element[];
  unfavorableElements: Element[];
  luckPillars: LuckPillars;
  /** Year-branch zodiac animal, e.g. "Rabbit". */
  zodiac: string;
  branchRelations: BranchRelation[];
}
