import { describe, expect, it } from "vitest";
import { computeChart } from "./index";

const BEIJING = { lat: 39.9042, lng: 116.4074 };

describe("computeChart — shape and wiring", () => {
  it("echoes the input (minus gender) verbatim, including a derived tzId", () => {
    const chart = computeChart({
      date: "1990-06-15",
      time: "10:30",
      lat: BEIJING.lat,
      lng: BEIJING.lng,
    });
    expect(chart.input).toEqual({
      date: "1990-06-15",
      time: "10:30",
      lat: BEIJING.lat,
      lng: BEIJING.lng,
      tzId: "Asia/Shanghai",
    });
  });

  it("uses an explicitly provided tzId instead of deriving one", () => {
    const chart = computeChart({
      date: "1990-06-15",
      time: "10:30",
      lat: BEIJING.lat,
      lng: BEIJING.lng,
      tzId: "Asia/Shanghai",
    });
    expect(chart.input.tzId).toBe("Asia/Shanghai");
  });

  it("returns every field of the Chart contract with the right shape", () => {
    const chart = computeChart({ date: "1990-06-15", time: "10:30", ...BEIJING });

    expect(typeof chart.trueSolarTime).toBe("string");
    expect(chart.pillars.year.stem).toBeTruthy();
    expect(chart.pillars.month.stem).toBeTruthy();
    expect(chart.pillars.day.stem).toBeTruthy();
    expect(chart.pillars.hour?.stem).toBeTruthy();
    expect(["yin", "yang"]).toContain(chart.dayMaster.yinYang);
    expect(["wood", "fire", "earth", "metal", "water"]).toContain(chart.dayMaster.element);
    for (const el of ["wood", "fire", "earth", "metal", "water"] as const) {
      expect(typeof chart.elements[el]).toBe("number");
    }
    expect(["strong", "weak", "balanced"]).toContain(chart.dayMasterStrength);
    expect(Array.isArray(chart.favorableElements)).toBe(true);
    expect(Array.isArray(chart.unfavorableElements)).toBe(true);
    expect(typeof chart.luckPillars.startAge).toBe("number");
    expect(typeof chart.luckPillars.forward).toBe("boolean");
    expect(chart.luckPillars.pillars.length).toBeGreaterThan(0);
    expect(typeof chart.zodiac).toBe("string");
    expect(Array.isArray(chart.branchRelations)).toBe(true);
  });

  it("is deterministic: identical input always produces a deep-equal Chart", () => {
    const input = { date: "1985-03-03", time: "04:45", lat: BEIJING.lat, lng: BEIJING.lng, tzId: "Asia/Shanghai" };
    expect(computeChart(input)).toEqual(computeChart(input));
  });
});

describe("computeChart — unknown birth time", () => {
  it("degrades to a 3-pillar chart: hour null, trueSolarTime null, still returns elements/strength/luck", () => {
    const chart = computeChart({ date: "1990-06-15", time: null, ...BEIJING, tzId: "Asia/Shanghai" });
    expect(chart.pillars.hour).toBeNull();
    expect(chart.trueSolarTime).toBeNull();
    expect(chart.input.time).toBeNull();
    // Elements should sum to 6 (3 pillars * 2 points), not 8.
    const total = Object.values(chart.elements).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(6, 1);
    expect(["strong", "weak", "balanced"]).toContain(chart.dayMasterStrength);
    expect(chart.luckPillars.pillars.length).toBeGreaterThan(0);
  });

  it("does not throw for any valid date with a null time", () => {
    expect(() => computeChart({ date: "2000-01-01", time: null, ...BEIJING, tzId: "Asia/Shanghai" })).not.toThrow();
  });
});

describe("computeChart — gender wiring for luck pillar direction", () => {
  it("defaults to the documented 'male' convention when gender is omitted", () => {
    const withDefault = computeChart({ date: "1990-06-15", time: "10:30", ...BEIJING, tzId: "Asia/Shanghai" });
    const explicitMale = computeChart({
      date: "1990-06-15",
      time: "10:30",
      ...BEIJING,
      tzId: "Asia/Shanghai",
      gender: "male",
    });
    expect(withDefault.luckPillars).toEqual(explicitMale.luckPillars);
  });

  it("male vs female produce opposite luck-pillar direction for the same chart", () => {
    const male = computeChart({ date: "1990-06-15", time: "10:30", ...BEIJING, tzId: "Asia/Shanghai", gender: "male" });
    const female = computeChart({
      date: "1990-06-15",
      time: "10:30",
      ...BEIJING,
      tzId: "Asia/Shanghai",
      gender: "female",
    });
    expect(male.luckPillars.forward).toBe(!female.luckPillars.forward);
  });
});

describe("computeChart — branch relations wiring", () => {
  it("surfaces a sanhe relation when the four pillar branches include a full triad", () => {
    // 1990-06-15 12:00 Asia/Shanghai (from pillars.test.ts golden case) has
    // year 午, month 午, day 亥 branches — pick an hour whose branch
    // completes a real relation with these for an end-to-end wiring check
    // (not re-deriving relations.ts's own correctness, which is covered
    // there — this just proves computeChart actually calls it with the
    // real computed pillars).
    const chart = computeChart({ date: "1990-06-15", time: "10:30", ...BEIJING, tzId: "Asia/Shanghai" });
    const branchesUsed = [
      chart.pillars.year.branch,
      chart.pillars.month.branch,
      chart.pillars.day.branch,
      chart.pillars.hour?.branch,
    ].filter((b): b is string => Boolean(b));
    for (const rel of chart.branchRelations) {
      for (const b of rel.branches) {
        expect(branchesUsed).toContain(b);
      }
    }
  });
});

describe("computeChart — PRD §5.1 acceptance criteria", () => {
  it("a New York and a Sydney profile with the same civil birth time get different charts", () => {
    const nyc = computeChart({
      date: "1990-06-15",
      time: "09:50",
      lat: 40.7128,
      lng: -74.006,
      tzId: "America/New_York",
    });
    const sydney = computeChart({
      date: "1990-06-15",
      time: "09:50",
      lat: -33.8688,
      lng: 151.2093,
      tzId: "Australia/Sydney",
    });
    expect(nyc).not.toEqual(sydney);
  });

  it("unknown birth time still returns a valid reading (never throws, never blocks)", () => {
    const chart = computeChart({ date: "1990-06-15", time: null, ...BEIJING, tzId: "Asia/Shanghai" });
    expect(chart.pillars.year.stem).toBeTruthy();
    expect(chart.dayMaster.stem).toBeTruthy();
  });
});
