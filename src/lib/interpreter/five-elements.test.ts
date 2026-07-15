import { describe, expect, it } from "vitest";
import {
  ELEMENTS,
  elementRelation,
  outputElement,
  wealthElement,
  resourceElement,
  authorityElement,
  parseGanZhi,
  hashString,
  seededPick,
  dominantElement,
  scarceElement,
} from "./five-elements";
import type { Element } from "./chart-types";

describe("elementRelation", () => {
  it("identifies the same element", () => {
    expect(elementRelation("wood", "wood")).toBe("same");
  });

  it("walks the full generative cycle: wood -> fire -> earth -> metal -> water -> wood", () => {
    expect(elementRelation("wood", "fire")).toBe("generates");
    expect(elementRelation("fire", "earth")).toBe("generates");
    expect(elementRelation("earth", "metal")).toBe("generates");
    expect(elementRelation("metal", "water")).toBe("generates");
    expect(elementRelation("water", "wood")).toBe("generates");
  });

  it("is the mirror of generates in the other direction", () => {
    expect(elementRelation("fire", "wood")).toBe("generated-by");
    expect(elementRelation("wood", "water")).toBe("generated-by");
  });

  it("walks the full controlling cycle: wood -> earth -> water -> fire -> metal -> wood", () => {
    expect(elementRelation("wood", "earth")).toBe("controls");
    expect(elementRelation("earth", "water")).toBe("controls");
    expect(elementRelation("water", "fire")).toBe("controls");
    expect(elementRelation("fire", "metal")).toBe("controls");
    expect(elementRelation("metal", "wood")).toBe("controls");
  });

  it("is the mirror of controls in the other direction", () => {
    expect(elementRelation("earth", "wood")).toBe("controlled-by");
  });
});

describe("day-master element roles", () => {
  it("derives output/wealth/resource/authority consistently around the cycle", () => {
    for (const el of ELEMENTS) {
      expect(elementRelation(el, outputElement(el))).toBe("generates");
      expect(elementRelation(el, wealthElement(el))).toBe("controls");
      expect(elementRelation(el, resourceElement(el))).toBe("generated-by");
      expect(elementRelation(el, authorityElement(el))).toBe("controlled-by");
    }
  });
});

describe("parseGanZhi", () => {
  it("parses a valid two-character ganzhi string", () => {
    const parsed = parseGanZhi("甲子");
    expect(parsed).not.toBeNull();
    expect(parsed?.stem).toBe("甲");
    expect(parsed?.stemElement).toBe("wood");
    expect(parsed?.stemYinYang).toBe("yang");
    expect(parsed?.branch).toBe("子");
    expect(parsed?.branchAnimal).toBe("Rat");
    expect(parsed?.branchElement).toBe("water");
  });

  it("returns null for malformed input", () => {
    expect(parseGanZhi("")).toBeNull();
    expect(parseGanZhi("甲")).toBeNull();
    expect(parseGanZhi("XY")).toBeNull();
  });
});

describe("hashString / seededPick determinism", () => {
  it("is a pure function of its input", () => {
    expect(hashString("hello")).toBe(hashString("hello"));
    expect(hashString("hello")).not.toBe(hashString("world"));
  });

  it("always returns an in-range, deterministic index", () => {
    const options = ["a", "b", "c", "d"] as const;
    const seed = hashString("some-chart-seed");
    const first = seededPick(seed, 5, options);
    const second = seededPick(seed, 5, options);
    expect(first).toBe(second);
    expect(options).toContain(first);
  });
});

describe("dominantElement / scarceElement", () => {
  it("finds the max and min of an element tally", () => {
    const tally: Record<Element, number> = { wood: 3, fire: 2, earth: 2, metal: 1, water: 0 };
    expect(dominantElement(tally)).toBe("wood");
    expect(scarceElement(tally)).toBe("water");
  });
});
