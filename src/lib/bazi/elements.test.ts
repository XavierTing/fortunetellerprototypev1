import { describe, expect, it } from "vitest";
import type { Element } from "./constants";
import type { Pillar, Pillars } from "./pillars";
import {
  computeDayMasterStrength,
  computeFavorableUnfavorable,
  tallyElements,
} from "./elements";

function pillar(stem: string, branch: string, hiddenStems: string[]): Pillar {
  // Minimal fixture builder — stemElement/branchElement/pinyin filled with
  // whatever's convenient; tallyElements only reads stemElement, hiddenStems,
  // and looks up each hidden stem's element via constants, so we only need
  // stemElement to be correct here (hiddenStems are looked up by character).
  const STEM_ELEMENT: Record<string, Element> = {
    甲: "wood", 乙: "wood", 丙: "fire", 丁: "fire", 戊: "earth",
    己: "earth", 庚: "metal", 辛: "metal", 壬: "water", 癸: "water",
  };
  return {
    stem,
    branch,
    stemPinyin: "",
    branchPinyin: "",
    stemElement: STEM_ELEMENT[stem],
    branchElement: "earth",
    hiddenStems,
  };
}

describe("tallyElements", () => {
  it("gives each stem 1 point and splits each branch's single hidden stem's element 1 point", () => {
    const pillars: Pillars = {
      year: pillar("甲", "子", ["癸"]), // wood stem, 1 hidden stem (water)
      month: pillar("甲", "子", ["癸"]),
      day: pillar("甲", "子", ["癸"]),
      hour: null,
    };
    const totals = tallyElements(pillars);
    // 3 stems (甲, wood) = 3; 3 branches with single hidden gan 癸 (water) = 3
    expect(totals.wood).toBeCloseTo(3, 2);
    expect(totals.water).toBeCloseTo(3, 2);
    expect(totals.fire).toBe(0);
    expect(totals.earth).toBe(0);
    expect(totals.metal).toBe(0);
  });

  it("splits a 3-hidden-stem branch as 0.6 main / 0.3 middle / 0.1 residual", () => {
    const pillars: Pillars = {
      year: pillar("甲", "寅", ["甲", "丙", "戊"]), // wood/fire/earth
      month: pillar("甲", "寅", ["甲", "丙", "戊"]),
      day: pillar("甲", "寅", ["甲", "丙", "戊"]),
      hour: pillar("甲", "寅", ["甲", "丙", "戊"]),
    };
    const totals = tallyElements(pillars);
    // 4 stems (甲, wood) = 4; 4 branches * (0.6 wood + 0.3 fire + 0.1 earth)
    expect(totals.wood).toBeCloseTo(4 + 4 * 0.6, 2);
    expect(totals.fire).toBeCloseTo(4 * 0.3, 2);
    expect(totals.earth).toBeCloseTo(4 * 0.1, 2);
    expect(totals.metal).toBe(0);
    expect(totals.water).toBe(0);
  });

  it("only tallies the 3 known pillars when hour is null (unknown birth time)", () => {
    const pillars: Pillars = {
      year: pillar("甲", "子", ["癸"]),
      month: pillar("甲", "子", ["癸"]),
      day: pillar("甲", "子", ["癸"]),
      hour: null,
    };
    const totals = tallyElements(pillars);
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(6, 2); // 3 stems + 3 branches, 1 point each
  });

  it("sums to 8 for a full 4-pillar chart (4 stems + 4 branches, 1 point each)", () => {
    const pillars: Pillars = {
      year: pillar("甲", "寅", ["甲", "丙", "戊"]),
      month: pillar("乙", "卯", ["乙"]),
      day: pillar("丙", "辰", ["戊", "乙", "癸"]),
      hour: pillar("丁", "巳", ["丙", "戊", "庚"]),
    };
    const totals = tallyElements(pillars);
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(8, 2);
  });
});

describe("computeDayMasterStrength", () => {
  it("is 'strong' when the day master's own + resource element dominate the chart", () => {
    const totals: Record<Element, number> = { wood: 5, fire: 1, earth: 1, metal: 0.5, water: 0.5 };
    // day master wood; resource of wood is water. supportive = wood+water = 5.5 / 8 = 0.6875
    expect(computeDayMasterStrength(totals, "wood")).toBe("strong");
  });

  it("is 'weak' when the day master's own + resource element are a small minority", () => {
    const totals: Record<Element, number> = { wood: 0.5, fire: 3, earth: 2, metal: 2, water: 0.5 };
    // supportive = wood(0.5) + water(0.5) = 1 / 8 = 0.125
    expect(computeDayMasterStrength(totals, "wood")).toBe("weak");
  });

  it("is 'balanced' in the middle band", () => {
    const totals: Record<Element, number> = { wood: 2, fire: 2, earth: 2, metal: 1, water: 1 };
    // supportive = wood(2) + water(1) = 3 / 8 = 0.375
    expect(computeDayMasterStrength(totals, "wood")).toBe("balanced");
  });
});

describe("computeFavorableUnfavorable", () => {
  it("weak day master: favorable = self + resource; unfavorable = output + wealth + officer", () => {
    const totals: Record<Element, number> = { wood: 0.5, fire: 3, earth: 2, metal: 2, water: 0.5 };
    const result = computeFavorableUnfavorable("wood", "weak", totals);
    expect(result.favorable.sort()).toEqual(["water", "wood"]);
    expect(result.unfavorable.sort()).toEqual(["earth", "fire", "metal"]);
  });

  it("strong day master: favorable/unfavorable are swapped relative to weak", () => {
    const totals: Record<Element, number> = { wood: 5, fire: 1, earth: 1, metal: 0.5, water: 0.5 };
    const result = computeFavorableUnfavorable("wood", "strong", totals);
    expect(result.favorable.sort()).toEqual(["earth", "fire", "metal"]);
    expect(result.unfavorable.sort()).toEqual(["water", "wood"]);
  });

  it("balanced day master: favorable = the 2 lowest-weight elements, unfavorable = the 2 highest", () => {
    const totals: Record<Element, number> = { wood: 3, fire: 2.5, earth: 1.2, metal: 0.5, water: 1 };
    const result = computeFavorableUnfavorable("wood", "balanced", totals);
    expect(result.favorable.sort()).toEqual(["metal", "water"].sort());
    expect(result.unfavorable.sort()).toEqual(["fire", "wood"].sort());
  });

  it("balanced day master breaks weight ties deterministically by canonical element order", () => {
    const totals: Record<Element, number> = { wood: 1, fire: 1, earth: 1, metal: 1, water: 1 };
    const result = computeFavorableUnfavorable("wood", "balanced", totals);
    // All tied — canonical order is wood,fire,earth,metal,water: lowest 2 = wood,fire; highest 2 = metal,water
    expect(result.favorable).toEqual(["wood", "fire"]);
    expect(result.unfavorable).toEqual(["metal", "water"]);
  });
});
