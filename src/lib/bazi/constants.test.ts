import { describe, expect, it } from "vitest";
import {
  BRANCHES,
  CONTROLS,
  ELEMENT_ORDER,
  GENERATES,
  STEMS,
  branchInfo,
  elementThatControls,
  elementThatGenerates,
  stemInfo,
} from "./constants";

describe("STEMS", () => {
  it("has exactly the 10 heavenly stems", () => {
    expect(Object.keys(STEMS)).toHaveLength(10);
    expect(Object.keys(STEMS)).toEqual([
      "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸",
    ]);
  });

  it("alternates yang/yin starting with 甲=yang", () => {
    const order = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
    order.forEach((stem, i) => {
      expect(STEMS[stem].yinYang).toBe(i % 2 === 0 ? "yang" : "yin");
    });
  });

  it("assigns elements in the correct wood/fire/earth/metal/water pairs", () => {
    expect(STEMS["甲"].element).toBe("wood");
    expect(STEMS["乙"].element).toBe("wood");
    expect(STEMS["丙"].element).toBe("fire");
    expect(STEMS["丁"].element).toBe("fire");
    expect(STEMS["戊"].element).toBe("earth");
    expect(STEMS["己"].element).toBe("earth");
    expect(STEMS["庚"].element).toBe("metal");
    expect(STEMS["辛"].element).toBe("metal");
    expect(STEMS["壬"].element).toBe("water");
    expect(STEMS["癸"].element).toBe("water");
  });

  it("has tone-marked pinyin for every stem", () => {
    expect(STEMS["甲"].pinyin).toBe("jiǎ");
    expect(STEMS["癸"].pinyin).toBe("guǐ");
  });
});

describe("BRANCHES", () => {
  it("has exactly the 12 earthly branches in canonical order", () => {
    expect(Object.keys(BRANCHES)).toEqual([
      "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥",
    ]);
  });

  it("maps each branch to its correct English zodiac animal", () => {
    expect(BRANCHES["子"].zodiac).toBe("Rat");
    expect(BRANCHES["丑"].zodiac).toBe("Ox");
    expect(BRANCHES["寅"].zodiac).toBe("Tiger");
    expect(BRANCHES["卯"].zodiac).toBe("Rabbit");
    expect(BRANCHES["辰"].zodiac).toBe("Dragon");
    expect(BRANCHES["巳"].zodiac).toBe("Snake");
    expect(BRANCHES["午"].zodiac).toBe("Horse");
    expect(BRANCHES["未"].zodiac).toBe("Goat");
    expect(BRANCHES["申"].zodiac).toBe("Monkey");
    expect(BRANCHES["酉"].zodiac).toBe("Rooster");
    expect(BRANCHES["戌"].zodiac).toBe("Dog");
    expect(BRANCHES["亥"].zodiac).toBe("Pig");
  });

  it("assigns each branch's own primary (dominant qi) element", () => {
    expect(BRANCHES["子"].element).toBe("water");
    expect(BRANCHES["午"].element).toBe("fire");
    expect(BRANCHES["卯"].element).toBe("wood");
    expect(BRANCHES["酉"].element).toBe("metal");
    expect(BRANCHES["辰"].element).toBe("earth");
    expect(BRANCHES["戌"].element).toBe("earth");
    expect(BRANCHES["丑"].element).toBe("earth");
    expect(BRANCHES["未"].element).toBe("earth");
  });
});

describe("stemInfo / branchInfo lookups", () => {
  it("returns info for a known stem/branch", () => {
    expect(stemInfo("甲").element).toBe("wood");
    expect(branchInfo("寅").zodiac).toBe("Tiger");
  });

  it("throws on an unrecognized character", () => {
    expect(() => stemInfo("X")).toThrow();
    expect(() => branchInfo("X")).toThrow();
  });
});

describe("five-element generation (生) and control (克) cycles", () => {
  it("GENERATES cycles wood->fire->earth->metal->water->wood", () => {
    expect(GENERATES.wood).toBe("fire");
    expect(GENERATES.fire).toBe("earth");
    expect(GENERATES.earth).toBe("metal");
    expect(GENERATES.metal).toBe("water");
    expect(GENERATES.water).toBe("wood");
  });

  it("CONTROLS cycles wood->earth->water->fire->metal->wood", () => {
    expect(CONTROLS.wood).toBe("earth");
    expect(CONTROLS.earth).toBe("water");
    expect(CONTROLS.water).toBe("fire");
    expect(CONTROLS.fire).toBe("metal");
    expect(CONTROLS.metal).toBe("wood");
  });

  it("elementThatGenerates is the exact inverse of GENERATES", () => {
    for (const el of ELEMENT_ORDER) {
      expect(elementThatGenerates(GENERATES[el])).toBe(el);
    }
  });

  it("elementThatControls is the exact inverse of CONTROLS", () => {
    for (const el of ELEMENT_ORDER) {
      expect(elementThatControls(CONTROLS[el])).toBe(el);
    }
  });
});
