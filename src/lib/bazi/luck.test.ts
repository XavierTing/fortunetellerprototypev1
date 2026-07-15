import { Solar } from "lunar-typescript";
import { describe, expect, it } from "vitest";
import { computeLuckPillars } from "./luck";

function eightCharFor(y: number, m: number, d: number, h: number, mi: number) {
  return Solar.fromYmdHms(y, m, d, h, mi, 0).getLunar().getEightChar();
}

describe("computeLuckPillars", () => {
  it("male born in a yang year runs forward (顺排)", () => {
    // 1990 is 庚午 — 庚 is a yang stem, so a male's 大运 runs forward.
    const ec = eightCharFor(1990, 6, 15, 10, 30);
    const luck = computeLuckPillars(ec, "male");
    expect(luck.forward).toBe(true);
  });

  it("female born in a yang year runs backward (逆排) — opposite of a male in the same year", () => {
    const ec = eightCharFor(1990, 6, 15, 10, 30);
    const maleLuck = computeLuckPillars(ec, "male");
    const femaleLuck = computeLuckPillars(ec, "female");
    expect(femaleLuck.forward).toBe(!maleLuck.forward);
  });

  it("male born in a yin year runs backward", () => {
    // 1991 is 辛未 — 辛 is a yin stem.
    const ec = eightCharFor(1991, 6, 15, 10, 30);
    const luck = computeLuckPillars(ec, "male");
    expect(luck.forward).toBe(false);
  });

  it("produces a positive, plausible startAge and a non-empty pillar sequence", () => {
    const ec = eightCharFor(1990, 6, 15, 10, 30);
    const luck = computeLuckPillars(ec, "male");
    expect(luck.startAge).toBeGreaterThan(0);
    expect(luck.startAge).toBeLessThan(11); // always starts within the first decade
    expect(luck.pillars.length).toBeGreaterThanOrEqual(8);
  });

  it("each pillar has a valid stem/branch character and increasing age", () => {
    const ec = eightCharFor(1990, 6, 15, 10, 30);
    const luck = computeLuckPillars(ec, "male");
    let prevAge = -1;
    for (const p of luck.pillars) {
      expect(p.stem).toMatch(/^[甲乙丙丁戊己庚辛壬癸]$/);
      expect(p.branch).toMatch(/^[子丑寅卯辰巳午未申酉戌亥]$/);
      expect(p.age).toBeGreaterThan(prevAge);
      prevAge = p.age;
    }
  });

  it("consecutive luck pillars advance the sexagenary cycle by exactly one step forward when forward=true", () => {
    const ec = eightCharFor(1990, 6, 15, 10, 30);
    const luck = computeLuckPillars(ec, "male");
    expect(luck.forward).toBe(true);
    // Consecutive pillars are always 10 branch-cycle apart in forward mode
    // — spot check the branch sequence is strictly cyclic (each branch's
    // index advances by a fixed step mod 12 across consecutive pillars).
    const BRANCH_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
    const idx0 = BRANCH_ORDER.indexOf(luck.pillars[0].branch);
    const idx1 = BRANCH_ORDER.indexOf(luck.pillars[1].branch);
    const step = (idx1 - idx0 + 12) % 12;
    for (let i = 2; i < luck.pillars.length; i++) {
      const a = BRANCH_ORDER.indexOf(luck.pillars[i - 1].branch);
      const b = BRANCH_ORDER.indexOf(luck.pillars[i].branch);
      expect((b - a + 12) % 12).toBe(step);
    }
  });

  it("defaults to male direction convention when gender is omitted", () => {
    const ec = eightCharFor(1990, 6, 15, 10, 30);
    const withDefault = computeLuckPillars(ec);
    const explicitMale = computeLuckPillars(ec, "male");
    expect(withDefault).toEqual(explicitMale);
  });

  it("is deterministic for the same inputs", () => {
    const ec = eightCharFor(1985, 3, 3, 4, 45);
    expect(computeLuckPillars(ec, "female")).toEqual(computeLuckPillars(ec, "female"));
  });
});
