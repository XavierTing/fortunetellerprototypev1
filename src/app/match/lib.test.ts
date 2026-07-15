import { describe, expect, it } from "vitest";
import { branchInfo, stemInfo } from "@/lib/bazi/constants";
import type { Chart, DayMaster, Element, Pillar } from "@/lib/bazi";
import { deriveCompatibility } from "@/lib/interpreter/mock";
import { CompatSchema } from "@/lib/interpreter/types";
import { CHART_STRONG_WOOD, CHART_WEAK_WATER } from "@/lib/interpreter/test-fixtures";
import {
  computeClashingElements,
  computeComplementaryElements,
  computeCrossBranchRelations,
  computeDayMasterRelation,
  computeRelationFacts,
} from "./lib";

// ---------------------------------------------------------------------------
// A minimal, hand-built Chart factory for exercising each relation branch in
// isolation. Real charts (via computeChart) can't cheaply hit every element
// pairing (controls/controlled-by, every branch-relation type, arbitrary
// favorable/unfavorable sets) on demand, so this builds a structurally valid
// Chart directly from the engine's own stem/branch lexicon — every stem,
// branch, pinyin, and element still comes from `stemInfo`/`branchInfo`
// (@/lib/bazi/constants), never hand-typed, so a fixture can't silently drift
// from what the engine itself would produce.
// ---------------------------------------------------------------------------

const STEM_FOR_ELEMENT: Record<Element, string> = {
  wood: "甲",
  fire: "丙",
  earth: "戊",
  metal: "庚",
  water: "壬",
};

const ZERO_ELEMENTS: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };

function makePillar(stem: string, branch: string): Pillar {
  const s = stemInfo(stem);
  const b = branchInfo(branch);
  return {
    stem,
    branch,
    stemPinyin: s.pinyin,
    branchPinyin: b.pinyin,
    stemElement: s.element,
    branchElement: b.element,
    hiddenStems: [],
  };
}

function makeDayMaster(element: Element): DayMaster {
  const stem = STEM_FOR_ELEMENT[element];
  const s = stemInfo(stem);
  return { stem, stemPinyin: s.pinyin, element: s.element, yinYang: s.yinYang };
}

/** Builds a structurally valid Chart from just the facts these tests care about; everything else is a neutral placeholder. */
function makeChart(opts: {
  dayMasterElement: Element;
  branches: string[]; // 1-4 branches, filled positionally into year/month/day/hour (repeats collapse via dedup in chartBranches)
  favorableElements?: Element[];
  unfavorableElements?: Element[];
  elements?: Partial<Record<Element, number>>;
}): Chart {
  const filler = "子"; // inert padding branch when fewer than 4 are given; dedup means repeats are harmless
  const [yearB, monthB, dayB, hourB] = [
    opts.branches[0] ?? filler,
    opts.branches[1] ?? opts.branches[0] ?? filler,
    opts.branches[2] ?? opts.branches[0] ?? filler,
    opts.branches[3] ?? null,
  ];
  const dayMasterStem = STEM_FOR_ELEMENT[opts.dayMasterElement];

  return {
    input: { date: "2000-01-01", time: null, lat: 0, lng: 0, tzId: "UTC" },
    trueSolarTime: null,
    pillars: {
      year: makePillar(dayMasterStem, yearB),
      month: makePillar(dayMasterStem, monthB),
      day: makePillar(dayMasterStem, dayB),
      hour: hourB ? makePillar(dayMasterStem, hourB) : null,
    },
    dayMaster: makeDayMaster(opts.dayMasterElement),
    elements: { ...ZERO_ELEMENTS, ...opts.elements },
    dayMasterStrength: "balanced",
    favorableElements: opts.favorableElements ?? [],
    unfavorableElements: opts.unfavorableElements ?? [],
    luckPillars: { startAge: 8, forward: true, pillars: [] },
    zodiac: "Rat",
    branchRelations: [],
  };
}

describe("computeDayMasterRelation", () => {
  it("flags 'same' when both charts share a Day-Master element", () => {
    const a = makeChart({ dayMasterElement: "wood", branches: ["寅"] });
    const b = makeChart({ dayMasterElement: "wood", branches: ["卯"] });
    const rel = computeDayMasterRelation(a, b);
    expect(rel).toMatchObject({ type: "same", aElement: "wood", bElement: "wood" });
  });

  it("flags 'generates' when A's element generates B's", () => {
    // wood generates fire
    const a = makeChart({ dayMasterElement: "wood", branches: ["寅"] });
    const b = makeChart({ dayMasterElement: "fire", branches: ["午"] });
    const rel = computeDayMasterRelation(a, b);
    expect(rel).toMatchObject({ type: "generates", aElement: "wood", bElement: "fire" });
  });

  it("flags 'generated-by' when B's element generates A's", () => {
    // water generates wood — matches the real engine fixtures below too
    const a = makeChart({ dayMasterElement: "wood", branches: ["寅"] });
    const b = makeChart({ dayMasterElement: "water", branches: ["子"] });
    const rel = computeDayMasterRelation(a, b);
    expect(rel).toMatchObject({ type: "generated-by", aElement: "wood", bElement: "water" });
  });

  it("flags 'controls' when A's element controls B's", () => {
    // wood controls earth
    const a = makeChart({ dayMasterElement: "wood", branches: ["寅"] });
    const b = makeChart({ dayMasterElement: "earth", branches: ["未"] });
    const rel = computeDayMasterRelation(a, b);
    expect(rel).toMatchObject({ type: "controls", aElement: "wood", bElement: "earth" });
  });

  it("flags 'controlled-by' when B's element controls A's", () => {
    const a = makeChart({ dayMasterElement: "earth", branches: ["未"] });
    const b = makeChart({ dayMasterElement: "wood", branches: ["寅"] });
    const rel = computeDayMasterRelation(a, b);
    expect(rel).toMatchObject({ type: "controlled-by", aElement: "earth", bElement: "wood" });
  });

  it("matches the real engine fixtures (strong wood vs. weak water)", () => {
    const rel = computeDayMasterRelation(CHART_STRONG_WOOD, CHART_WEAK_WATER);
    expect(rel.type).toBe("generated-by");
    expect(rel.aElement).toBe("wood");
    expect(rel.bElement).toBe("water");
    expect(rel.note.length).toBeGreaterThan(0);
  });
});

describe("computeCrossBranchRelations", () => {
  it("flags a cross-chart 六合 (liuhe) pair", () => {
    const a = makeChart({ dayMasterElement: "wood", branches: ["子"] });
    const b = makeChart({ dayMasterElement: "earth", branches: ["丑"] });
    const relations = computeCrossBranchRelations(a, b);
    expect(relations).toHaveLength(1);
    expect(relations[0]).toMatchObject({ type: "liuhe", branches: ["子", "丑"] });
  });

  it("flags a cross-chart 相冲 (chong) clash", () => {
    const a = makeChart({ dayMasterElement: "water", branches: ["子"] });
    const b = makeChart({ dayMasterElement: "fire", branches: ["午"] });
    const relations = computeCrossBranchRelations(a, b);
    expect(relations).toHaveLength(1);
    expect(relations[0]).toMatchObject({ type: "chong", branches: ["子", "午"] });
  });

  it("flags a cross-chart 相刑 (xing) punishment", () => {
    const a = makeChart({ dayMasterElement: "wood", branches: ["寅"] });
    const b = makeChart({ dayMasterElement: "fire", branches: ["巳"] });
    const relations = computeCrossBranchRelations(a, b);
    expect(relations).toHaveLength(1);
    expect(relations[0]).toMatchObject({ type: "xing", branches: ["寅", "巳"] });
  });

  it("flags a 三合 (sanhe) trine completed only by combining both charts' branches", () => {
    const a = makeChart({ dayMasterElement: "water", branches: ["申", "子"] });
    const b = makeChart({ dayMasterElement: "earth", branches: ["辰"] });
    const relations = computeCrossBranchRelations(a, b);
    const sanhe = relations.filter((r) => r.type === "sanhe");
    expect(sanhe).toHaveLength(1);
    expect(sanhe[0].branches).toEqual(["申", "子", "辰"]);
  });

  it("does NOT report a sanhe trine that one person's own chart already completes alone", () => {
    // A alone already has all three members of 申子辰 — that's A's own
    // within-chart relation (chart.branchRelations), not a cross-chart fact.
    const a = makeChart({ dayMasterElement: "water", branches: ["申", "子", "辰"] });
    const b = makeChart({ dayMasterElement: "earth", branches: ["未"] });
    const relations = computeCrossBranchRelations(a, b);
    expect(relations.filter((r) => r.type === "sanhe")).toHaveLength(0);
  });

  it("returns no relations for genuinely unrelated branches", () => {
    const a = makeChart({ dayMasterElement: "wood", branches: ["辰"] });
    const b = makeChart({ dayMasterElement: "metal", branches: ["未"] });
    expect(computeCrossBranchRelations(a, b)).toEqual([]);
  });
});

describe("computeComplementaryElements / computeClashingElements", () => {
  it("flags an element as complementary only when the OTHER chart actually has it present", () => {
    const a = makeChart({ dayMasterElement: "wood", branches: ["寅"], favorableElements: ["fire", "water"] });
    const b = makeChart({ dayMasterElement: "fire", branches: ["午"], elements: { fire: 2 } }); // water absent from B
    expect(computeComplementaryElements(a, b)).toEqual(["fire"]);
  });

  it("unions complementary elements from both directions, in canonical element order", () => {
    const a = makeChart({ dayMasterElement: "wood", branches: ["寅"], favorableElements: ["fire"], elements: { metal: 1 } });
    const b = makeChart({
      dayMasterElement: "metal",
      branches: ["申"],
      favorableElements: ["metal"],
      elements: { fire: 3 },
    });
    // A wants fire, B has fire (elements.fire=3) => "fire" complementary
    // B wants metal, A has metal (elements.metal=1) => "metal" complementary
    expect(computeComplementaryElements(a, b)).toEqual(["fire", "metal"]);
  });

  it("mirrors the same present/absent logic for clashing (unfavorable) elements", () => {
    const a = makeChart({ dayMasterElement: "wood", branches: ["寅"], unfavorableElements: ["metal"] });
    const b = makeChart({ dayMasterElement: "metal", branches: ["申"], elements: { metal: 4 } });
    expect(computeClashingElements(a, b)).toEqual(["metal"]);
  });

  it("returns an empty list when nothing overlaps", () => {
    const a = makeChart({ dayMasterElement: "wood", branches: ["寅"], favorableElements: ["water"] });
    const b = makeChart({ dayMasterElement: "fire", branches: ["午"] }); // no water present
    expect(computeComplementaryElements(a, b)).toEqual([]);
  });
});

describe("computeRelationFacts", () => {
  it("assembles the full RelationFacts shape", () => {
    const a = makeChart({
      dayMasterElement: "wood",
      branches: ["子"],
      favorableElements: ["fire"],
      unfavorableElements: ["metal"],
    });
    const b = makeChart({
      dayMasterElement: "water",
      branches: ["丑"],
      elements: { fire: 1, metal: 2 },
    });

    const facts = computeRelationFacts(a, b);

    expect(facts.dayMasterRelation).toMatchObject({ type: "generated-by", aElement: "wood", bElement: "water" });
    expect(facts.branchRelations).toHaveLength(1);
    expect(facts.branchRelations[0].type).toBe("liuhe");
    expect(facts.complementaryElements).toEqual(["fire"]);
    expect(facts.clashingElements).toEqual(["metal"]);
  });

  it("produces RelationFacts the mock interpreter can consume end-to-end (real engine charts)", () => {
    const facts = computeRelationFacts(CHART_STRONG_WOOD, CHART_WEAK_WATER);

    // Structural sanity — every field is present and well-typed.
    expect(["same", "generates", "generated-by", "controls", "controlled-by"]).toContain(
      facts.dayMasterRelation.type
    );
    expect(Array.isArray(facts.branchRelations)).toBe(true);
    expect(Array.isArray(facts.complementaryElements)).toBe(true);
    expect(Array.isArray(facts.clashingElements)).toBe(true);

    // The mock interpreter (used whenever DEEPSEEK_API_KEY is unset) must be
    // able to consume this RelationFacts shape and produce schema-valid output.
    const compat = deriveCompatibility(CHART_STRONG_WOOD, CHART_WEAK_WATER, facts);
    expect(() => CompatSchema.parse(compat)).not.toThrow();
    expect(compat.score).toBeGreaterThanOrEqual(0);
    expect(compat.score).toBeLessThanOrEqual(100);
  });

  it("is deterministic given the same two charts", () => {
    const facts1 = computeRelationFacts(CHART_STRONG_WOOD, CHART_WEAK_WATER);
    const facts2 = computeRelationFacts(CHART_STRONG_WOOD, CHART_WEAK_WATER);
    expect(facts1).toEqual(facts2);
  });
});
