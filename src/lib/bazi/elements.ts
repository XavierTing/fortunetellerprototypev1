/**
 * Five-Element (五行) tallying, Day-Master strength, and favorable/
 * unfavorable elements.
 *
 * IMPORTANT CAVEAT (documented up front, and again in the T1 report): unlike
 * the pillar GanZhi themselves — which are objective calendar facts we get
 * right by construction (lunar-typescript + correct solar-time handling) —
 * "how strong is the day master" and "which elements are favorable" are
 * matters of genuine, long-standing disagreement between BaZi schools (they
 * weigh season/月令 rooting, 通根, combinations, and more, well beyond a
 * static weighted tally). This module implements one reasonable, fully
 * deterministic, documented heuristic — NOT a claim to the one "correct"
 * classical method. Product-wise this fits PRD's anti-persona (§2: "we are
 * not building a professional 排盘 tool with all 神煞 exposed") — the goal
 * is a stable, explainable signal for the LLM interpretation layer, not
 * professional-grade 格局 analysis.
 */
import { CONTROLS, ELEMENT_ORDER, Element, GENERATES, elementThatControls, elementThatGenerates, stemInfo } from "./constants";
import type { Pillars } from "./pillars";

/**
 * How a branch's total weight of 1 is split across its hidden stems
 * (藏干), ordered main-qi first: 1 hidden stem keeps all the weight; 2 split
 * 0.7/0.3; 3 split 0.6/0.3/0.1. This mirrors the commonly cited main/middle
 * /residual-qi apportionment used by many simplified BaZi scoring systems —
 * a deterministic convention, not a universally fixed standard (see file
 * header).
 */
function hiddenStemWeights(count: number): number[] {
  if (count === 1) return [1];
  if (count === 2) return [0.7, 0.3];
  if (count === 3) return [0.6, 0.3, 0.1];
  throw new Error(`bazi/elements: unexpected hidden-stem count ${count}`);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Weighted Five-Element tally across the 3 or 4 present pillars: each
 * pillar's stem contributes 1 full point to its own element, and each
 * pillar's branch contributes a total of 1 point split across its hidden
 * stems (see hiddenStemWeights). Total = 2 * (3 or 4).
 */
export function tallyElements(pillars: Pillars): Record<Element, number> {
  const totals: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const active = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(
    (p): p is NonNullable<typeof p> => p !== null
  );
  for (const p of active) {
    totals[p.stemElement] += 1;
    const weights = hiddenStemWeights(p.hiddenStems.length);
    p.hiddenStems.forEach((hs, i) => {
      totals[stemInfo(hs).element] += weights[i];
    });
  }
  for (const el of ELEMENT_ORDER) totals[el] = round2(totals[el]);
  return totals;
}

/**
 * Day-Master strength: the fraction of the chart's total weighted elements
 * that supports the day master (its own element + its resource/印 element,
 * the one that generates it). > 45% -> strong; < 30% -> weak; otherwise
 * balanced. Thresholds are a deterministic, documented simplification (see
 * file header) — not classical 格局 analysis (season rooting, combinations,
 * etc. are not modeled).
 */
export function computeDayMasterStrength(
  elements: Record<Element, number>,
  dayMasterElement: Element
): "strong" | "weak" | "balanced" {
  const total = ELEMENT_ORDER.reduce((sum, el) => sum + elements[el], 0);
  if (total <= 0) return "balanced";
  const resource = elementThatGenerates(dayMasterElement);
  const supportive = elements[dayMasterElement] + elements[resource];
  const ratio = supportive / total;
  if (ratio > 0.45) return "strong";
  if (ratio < 0.3) return "weak";
  return "balanced";
}

export interface FavorableUnfavorable {
  favorable: Element[];
  unfavorable: Element[];
}

/**
 * Favorable/unfavorable elements relative to the day master:
 * - weak day master: favorable = {self, resource}; unfavorable = {output, wealth, officer}
 *   (bringing in support helps a weak day master).
 * - strong day master: the exact swap (draining/controlling elements become
 *   favorable, since a strong day master needs an outlet or a check).
 * - balanced: data-driven off the actual tally rather than Ten-God theory —
 *   favorable = the 2 lowest-weight elements (the chart's own scarcity says
 *   what it needs more of), unfavorable = the 2 highest-weight elements
 *   (don't add to an existing excess). Ties break by canonical element
 *   order (wood, fire, earth, metal, water) for determinism.
 */
export function computeFavorableUnfavorable(
  dayMasterElement: Element,
  strength: "strong" | "weak" | "balanced",
  elements: Record<Element, number>
): FavorableUnfavorable {
  if (strength === "balanced") {
    const sorted = [...ELEMENT_ORDER].sort((a, b) => {
      const diff = elements[a] - elements[b];
      return diff !== 0 ? diff : ELEMENT_ORDER.indexOf(a) - ELEMENT_ORDER.indexOf(b);
    });
    return { favorable: sorted.slice(0, 2), unfavorable: sorted.slice(-2) };
  }

  const resource = elementThatGenerates(dayMasterElement);
  const output = GENERATES[dayMasterElement];
  const wealth = CONTROLS[dayMasterElement];
  const officer = elementThatControls(dayMasterElement);

  const supportive = [dayMasterElement, resource];
  const draining = [output, wealth, officer];

  return strength === "weak"
    ? { favorable: supportive, unfavorable: draining }
    : { favorable: draining, unfavorable: supportive };
}
