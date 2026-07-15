import { describe, expect, it } from "vitest";
import { computeBranchRelations } from "./relations";
import type { Pillar, Pillars } from "./pillars";

function stub(branch: string): Pillar {
  return {
    stem: "甲",
    branch,
    stemPinyin: "jiǎ",
    branchPinyin: "",
    stemElement: "wood",
    branchElement: "wood",
    hiddenStems: [],
  };
}

function pillars(year: string, month: string, day: string, hour: string | null): Pillars {
  return {
    year: stub(year),
    month: stub(month),
    day: stub(day),
    hour: hour === null ? null : stub(hour),
  };
}

describe("computeBranchRelations — 六合 (six harmony)", () => {
  it("detects a liuhe pair between two pillars", () => {
    const rels = computeBranchRelations(pillars("子", "丑", "寅", "卯"));
    const liuhe = rels.filter((r) => r.type === "liuhe");
    expect(liuhe).toHaveLength(1);
    expect(liuhe[0].branches.sort()).toEqual(["丑", "子"]);
  });

  it("finds no relations among branches with no known combination", () => {
    const rels = computeBranchRelations(pillars("子", "寅", "辰", null));
    // 子-寅: none; 子-辰: half of 申子辰 sanhe but incomplete (only 2 of 3) so
    // no sanhe reported; 寅-辰: none.
    expect(rels).toHaveLength(0);
  });
});

describe("computeBranchRelations — 三合 (three harmony)", () => {
  it("detects a full sanhe triad across three pillars", () => {
    const rels = computeBranchRelations(pillars("申", "子", "辰", null));
    const sanhe = rels.filter((r) => r.type === "sanhe");
    expect(sanhe).toHaveLength(1);
    expect(sanhe[0].branches.sort()).toEqual(["子", "申", "辰"].sort());
    expect(sanhe[0].note).toMatch(/water|水/i);
  });

  it("does not report a sanhe when only 2 of the 3 triad members are present", () => {
    const rels = computeBranchRelations(pillars("申", "子", "寅", null));
    expect(rels.filter((r) => r.type === "sanhe")).toHaveLength(0);
  });
});

describe("computeBranchRelations — 相冲 (clash)", () => {
  it("detects a chong pair", () => {
    const rels = computeBranchRelations(pillars("子", "午", "寅", null));
    const chong = rels.filter((r) => r.type === "chong");
    expect(chong).toHaveLength(1);
    expect(chong[0].branches.sort()).toEqual(["午", "子"].sort());
  });

  it("detects all 6 canonical clash pairs", () => {
    const pairs: [string, string][] = [
      ["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"],
    ];
    for (const [a, b] of pairs) {
      // Reuse `a` as the day branch too (self-punishment only fires for
      // 辰/午/酉/亥ーonly one of our pairs risks that, so pick a neutral
      // stand-in for those two instead) — the point here is only "does a
      // chong get detected for this pair," other incidental relations from
      // the filler are irrelevant to this assertion.
      const filler = a === "辰" || a === "午" ? "寅" : a;
      const rels = computeBranchRelations(pillars(a, b, filler, null));
      expect(rels.some((r) => r.type === "chong" && r.branches.includes(a) && r.branches.includes(b))).toBe(true);
    }
  });
});

describe("computeBranchRelations — 相刑 (punishment)", () => {
  it("detects the 寅巳申 ungrateful-punishment triangle as 3 pairwise relations when all 3 present", () => {
    const rels = computeBranchRelations(pillars("寅", "巳", "申", null));
    const xing = rels.filter((r) => r.type === "xing");
    expect(xing).toHaveLength(3);
  });

  it("detects a single 寅巳 punishment pair when only 2 of 3 are present", () => {
    const rels = computeBranchRelations(pillars("寅", "巳", "子", null));
    const xing = rels.filter((r) => r.type === "xing");
    expect(xing).toHaveLength(1);
    expect(xing[0].branches.sort()).toEqual(["巳", "寅"].sort());
  });

  it("detects the 子卯 mutual (impolite) punishment", () => {
    const rels = computeBranchRelations(pillars("子", "卯", "申", null));
    const xing = rels.filter((r) => r.type === "xing");
    expect(xing).toHaveLength(1);
    expect(xing[0].branches.sort()).toEqual(["子", "卯"].sort());
  });

  it("detects self-punishment when a self-punishing branch repeats across pillars", () => {
    const rels = computeBranchRelations(pillars("辰", "丑", "辰", null));
    const xing = rels.filter((r) => r.type === "xing");
    expect(xing.some((r) => r.branches.every((b) => b === "辰"))).toBe(true);
  });
});

describe("computeBranchRelations — general behavior", () => {
  it("returns an empty array for a chart with no relations at all", () => {
    // 丑/寅/辰: verified pairwise against every liuhe/chong/xing table and
    // every sanhe triad (no 2 of these 3 share a listed relation, and no
    // sanhe triad has more than 1 of its 3 members present).
    const rels = computeBranchRelations(pillars("丑", "寅", "辰", null));
    expect(rels).toEqual([]);
  });

  it("handles a null hour pillar without crashing (3-branch chart)", () => {
    expect(() => computeBranchRelations(pillars("申", "子", "辰", null))).not.toThrow();
  });

  it("every relation has a non-empty human-readable note", () => {
    const rels = computeBranchRelations(pillars("子", "午", "申", "辰"));
    for (const r of rels) {
      expect(r.note.length).toBeGreaterThan(0);
    }
  });

  it("is deterministic — same input always returns relations in the same order", () => {
    const input = pillars("寅", "巳", "申", "辰");
    expect(computeBranchRelations(input)).toEqual(computeBranchRelations(input));
  });
});
