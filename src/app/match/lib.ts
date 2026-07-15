/**
 * Cross-chart compatibility helpers (PRD §5.5): pure, deterministic, no
 * side effects, no interpreter/DB access. Computes the `RelationFacts` the
 * interpreter's `compatibility()` expects — engine-computed ground truth
 * per PRD §5.5's acceptance criterion ("relationship facts... are
 * engine-computed and correct").
 *
 * Reuse boundary:
 * - The Day-Master element relation reuses the interpreter's own
 *   `elementRelation` (`@/lib/interpreter/five-elements`), which itself is
 *   built only on the engine's `GENERATES`/`CONTROLS` tables
 *   (`@/lib/bazi/constants`) — no element-cycle math is re-derived here.
 * - Branch labels (pinyin gloss) reuse `branchInfo` from
 *   `@/lib/bazi/constants`.
 * - The branch-relation *pair tables* (六合/相冲/相刑/三合 — which specific
 *   branches combine) are, unfortunately, re-declared below rather than
 *   imported. `src/lib/bazi/relations.ts`'s `computeBranchRelations` only
 *   accepts a single chart's own 4-slot `Pillars` and reports relations
 *   *within* that one chart — it has no notion of "these two branches came
 *   from two different people," and its pair tables are module-private
 *   (not exported). Extending its public surface would mean modifying
 *   `src/lib/bazi/**`, which is out of this task's touch scope (read-only
 *   here). The tables below are the same closed, textbook correspondences
 *   as `relations.ts`'s (verified against it) — the same category of fact
 *   as `STEMS`/`BRANCHES` in constants.ts, just restated because they
 *   aren't exported. The *output shape* (`BranchRelation` /
 *   `CompatBranchRelation`) is reused unchanged from the engine's own types
 *   rather than a divergent local copy.
 */
import type { Chart, Element, Pillar } from "@/lib/bazi";
import { branchInfo } from "@/lib/bazi/constants";
import { ELEMENT_LABEL, ELEMENTS, elementRelation } from "@/lib/interpreter/five-elements";
import type {
  CompatBranchRelation,
  DayMasterRelation,
  DayMasterRelationType,
  RelationFacts,
} from "@/lib/interpreter/types";

// ---------------------------------------------------------------------------
// Branch-relation pair tables — mirrors src/lib/bazi/relations.ts (see file
// header for why these are re-declared rather than imported).
// ---------------------------------------------------------------------------

const LIUHE_PAIRS: [string, string, Element | null][] = [
  ["子", "丑", "earth"],
  ["寅", "亥", "wood"],
  ["卯", "戌", "fire"],
  ["辰", "酉", "metal"],
  ["巳", "申", "water"],
  ["午", "未", null],
];

const CHONG_PAIRS: [string, string][] = [
  ["子", "午"],
  ["丑", "未"],
  ["寅", "申"],
  ["卯", "酉"],
  ["辰", "戌"],
  ["巳", "亥"],
];

const SANHE_TRIADS: { branches: [string, string, string]; element: Element }[] = [
  { branches: ["申", "子", "辰"], element: "water" },
  { branches: ["亥", "卯", "未"], element: "wood" },
  { branches: ["寅", "午", "戌"], element: "fire" },
  { branches: ["巳", "酉", "丑"], element: "metal" },
];

const XING_PAIRS: [string, string, string][] = [
  ["寅", "巳", "无恩之刑 (ungrateful punishment)"],
  ["巳", "申", "无恩之刑 (ungrateful punishment)"],
  ["申", "寅", "无恩之刑 (ungrateful punishment)"],
  ["丑", "戌", "恃势之刑 (relying-on-power punishment)"],
  ["戌", "未", "恃势之刑 (relying-on-power punishment)"],
  ["未", "丑", "恃势之刑 (relying-on-power punishment)"],
  ["子", "卯", "无礼之刑 (impolite punishment)"],
];

function describeBranch(b: string): string {
  return `${b} (${branchInfo(b).pinyin})`;
}

/** Unique branches present across a chart's 3-4 pillars, in year→hour order, first-seen deduped. */
function chartBranches(chart: Chart): string[] {
  const pillars: (Pillar | null)[] = [chart.pillars.year, chart.pillars.month, chart.pillars.day, chart.pillars.hour];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const p of pillars) {
    if (!p || seen.has(p.branch)) continue;
    seen.add(p.branch);
    result.push(p.branch);
  }
  return result;
}

/** 六合/相冲/相刑 between every branch in A's chart and every branch in B's — genuinely cross-chart pairs. */
function crossPairwiseRelations(branchesA: string[], branchesB: string[]): CompatBranchRelation[] {
  const relations: CompatBranchRelation[] = [];

  for (const a of branchesA) {
    for (const b of branchesB) {
      const liuhe = LIUHE_PAIRS.find(([x, y]) => (x === a && y === b) || (x === b && y === a));
      if (liuhe) {
        const elementNote = liuhe[2] ? ` — combines toward ${liuhe[2]}` : "";
        relations.push({
          type: "liuhe",
          branches: [a, b],
          note: `Person A's ${describeBranch(a)} and Person B's ${describeBranch(b)} form a Six Harmony (六合 liùhé) across your charts — a softening, supportive pairing${elementNote}.`,
        });
      }

      const chong = CHONG_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
      if (chong) {
        relations.push({
          type: "chong",
          branches: [a, b],
          note: `Person A's ${describeBranch(a)} and Person B's ${describeBranch(b)} clash (相冲 xiāngchōng) — an opposing, restless pairing between your charts that tends to bring change.`,
        });
      }

      const xing = XING_PAIRS.find(([x, y]) => (x === a && y === b) || (x === b && y === a));
      if (xing) {
        relations.push({
          type: "xing",
          branches: [a, b],
          note: `Person A's ${describeBranch(a)} and Person B's ${describeBranch(b)} form a Punishment (相刑 xiāngxíng) across your charts — ${xing[2]}.`,
        });
      }
    }
  }

  return relations;
}

/**
 * 三合 trines completed only by combining branches from BOTH charts —
 * flagged only when neither person's own branches complete the triad alone
 * (a same-person trine is already reported in that person's own
 * `chart.branchRelations`, so re-reporting it here would be redundant, not
 * a cross-chart fact).
 */
function crossSanheRelations(branchesA: string[], branchesB: string[]): CompatBranchRelation[] {
  const setA = new Set(branchesA);
  const setB = new Set(branchesB);
  const union = new Set([...branchesA, ...branchesB]);
  const relations: CompatBranchRelation[] = [];

  for (const triad of SANHE_TRIADS) {
    const complete = triad.branches.every((b) => union.has(b));
    if (!complete) continue;
    const completeFromAAlone = triad.branches.every((b) => setA.has(b));
    const completeFromBAlone = triad.branches.every((b) => setB.has(b));
    if (completeFromAAlone || completeFromBAlone) continue;

    relations.push({
      type: "sanhe",
      branches: [...triad.branches],
      note: `Together your charts complete a Three Harmony (三合 sānhé) trine — ${triad.branches.map(describeBranch).join(", ")}, combining toward ${triad.element}.`,
    });
  }

  return relations;
}

/** 三合/六合/相冲/相刑 between A's branches and B's branches — see file header for why the pair tables are local. */
export function computeCrossBranchRelations(chartA: Chart, chartB: Chart): CompatBranchRelation[] {
  const branchesA = chartBranches(chartA);
  const branchesB = chartBranches(chartB);
  return [...crossPairwiseRelations(branchesA, branchesB), ...crossSanheRelations(branchesA, branchesB)];
}

// ---------------------------------------------------------------------------
// Day-Master element relation (生/克/比) — reuses the interpreter's own
// elementRelation(), itself built on the engine's GENERATES/CONTROLS.
// ---------------------------------------------------------------------------

const DAY_MASTER_NOTE: Record<DayMasterRelationType, (a: Element, b: Element) => string> = {
  same: (a) =>
    `You share the same Day-Master element (比 bǐ — ${ELEMENT_LABEL[a]}) — instant familiarity, for better and worse.`,
  generates: (a, b) =>
    `Person A's ${ELEMENT_LABEL[a]} Day Master generates (生 shēng) Person B's ${ELEMENT_LABEL[b]} — a naturally supportive current running from A to B.`,
  "generated-by": (a, b) =>
    `Person B's ${ELEMENT_LABEL[b]} Day Master generates (生 shēng) Person A's ${ELEMENT_LABEL[a]} — the same supportive current, running from B to A.`,
  controls: (a, b) =>
    `Person A's ${ELEMENT_LABEL[a]} Day Master controls (克 kè) Person B's ${ELEMENT_LABEL[b]} — this can read as guidance or as pressure, depending on how it's carried.`,
  "controlled-by": (a, b) =>
    `Person B's ${ELEMENT_LABEL[b]} Day Master controls (克 kè) Person A's ${ELEMENT_LABEL[a]} — again, guidance or pressure, running the other direction.`,
};

export function computeDayMasterRelation(chartA: Chart, chartB: Chart): DayMasterRelation {
  const aElement = chartA.dayMaster.element;
  const bElement = chartB.dayMaster.element;
  const type = elementRelation(aElement, bElement) as DayMasterRelationType;
  return { type, aElement, bElement, note: DAY_MASTER_NOTE[type](aElement, bElement) };
}

// ---------------------------------------------------------------------------
// Element complementarity (泄/supply) — does B actually supply an element A
// is short on (and flagged favorable), and vice versa? Symmetric for the
// unfavorable/clashing case.
// ---------------------------------------------------------------------------

function present(chart: Chart, el: Element): boolean {
  return chart.elements[el] > 0;
}

/** Canonical-element-order, deduped view of a possibly-overlapping element list. */
function dedupeInOrder(elements: Element[]): Element[] {
  const set = new Set(elements);
  return ELEMENTS.filter((el) => set.has(el));
}

/** Elements one chart flags under `key` (favorable/unfavorable) that the OTHER chart actually has present, unioned both directions. */
function crossSupply(chartA: Chart, chartB: Chart, key: "favorableElements" | "unfavorableElements"): Element[] {
  const bSuppliesA = chartA[key].filter((el) => present(chartB, el));
  const aSuppliesB = chartB[key].filter((el) => present(chartA, el));
  return dedupeInOrder([...bSuppliesA, ...aSuppliesB]);
}

/** Elements each chart is favorable-short on that the other chart actually supplies (in either direction). */
export function computeComplementaryElements(chartA: Chart, chartB: Chart): Element[] {
  return crossSupply(chartA, chartB, "favorableElements");
}

/** Elements each chart flags unfavorable that the other chart actually brings, in either direction. */
export function computeClashingElements(chartA: Chart, chartB: Chart): Element[] {
  return crossSupply(chartA, chartB, "unfavorableElements");
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/** The full RelationFacts contract `Interpreter.compatibility()` expects (see `@/lib/interpreter/types`). */
export function computeRelationFacts(chartA: Chart, chartB: Chart): RelationFacts {
  return {
    dayMasterRelation: computeDayMasterRelation(chartA, chartB),
    branchRelations: computeCrossBranchRelations(chartA, chartB),
    complementaryElements: computeComplementaryElements(chartA, chartB),
    clashingElements: computeClashingElements(chartA, chartB),
  };
}
