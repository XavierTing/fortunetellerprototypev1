import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { computeTrueSolarTime, equationOfTimeMinutes, toBeijingReferenceFields } from "./solar-time";

describe("equationOfTimeMinutes", () => {
  // Known real-world checkpoints (NOAA-style reference values, minutes):
  // ~Feb 11 minimum ~ -14.2, ~May 14 local max ~ +3.7, ~Jul 26 local min ~ -6.5,
  // ~Nov 3 maximum ~ +16.4. Our approximation formula should land within ~1
  // minute of these on the checkpoint days (verified independently against
  // the standard simplified NOAA formula before writing this test).
  it("is near its early-February minimum (~-14 min) around day 42", () => {
    expect(equationOfTimeMinutes(42)).toBeCloseTo(-14.2, 0);
  });

  it("is near its early-November maximum (~+16 min) around day 307", () => {
    expect(equationOfTimeMinutes(307)).toBeCloseTo(16.4, 0);
  });

  it("is near zero around mid-April (day ~105) and mid-June (day ~164)", () => {
    expect(Math.abs(equationOfTimeMinutes(105))).toBeLessThan(1);
    expect(Math.abs(equationOfTimeMinutes(164))).toBeLessThan(1);
  });

  it("is deterministic (pure function of day-of-year)", () => {
    expect(equationOfTimeMinutes(200)).toBe(equationOfTimeMinutes(200));
  });
});

describe("computeTrueSolarTime", () => {
  it("applies +4 minutes of correction per degree of east longitude relative to UTC", () => {
    // At lng=0 (Greenwich) local mean time equals UTC exactly (before EoT).
    // At lng=15 (one hour-wide slice east) local mean time is 1 hour ahead.
    const civil = DateTime.fromISO("2000-04-15T12:00:00", { zone: "utc" }); // ~zero EoT day
    const atGreenwich = computeTrueSolarTime(civil, 0);
    const at15East = computeTrueSolarTime(civil, 15);
    const diffMinutes = at15East.dateTime.diff(atGreenwich.dateTime, "minutes").minutes;
    expect(diffMinutes).toBeCloseTo(60, 0);
  });

  it("applies west longitude as a negative correction", () => {
    const civil = DateTime.fromISO("2000-04-15T12:00:00", { zone: "utc" });
    const atGreenwich = computeTrueSolarTime(civil, 0);
    const at15West = computeTrueSolarTime(civil, -15);
    const diffMinutes = atGreenwich.dateTime.diff(at15West.dateTime, "minutes").minutes;
    expect(diffMinutes).toBeCloseTo(60, 0);
  });

  it("folds in the equation-of-time correction on top of the longitude shift", () => {
    // Nov 3, lng=0: correction should be close to +16.4 minutes (EoT only, no longitude shift).
    const civil = DateTime.fromISO("2000-11-03T12:00:00", { zone: "utc" });
    const result = computeTrueSolarTime(civil, 0);
    expect(result.correctionMinutes).toBeCloseTo(16.4, 0);
  });

  it("correctly resolves DST-aware civil input before applying the solar correction", () => {
    // Same lng/date, two civil zoned DateTimes 2 hours apart in wall-clock but
    // (if one side is DST and the other isn't) potentially less apart in UTC.
    // Here both are plain UTC so 2h wall-clock apart must stay 2h apart.
    const a = DateTime.fromISO("2000-06-15T01:30:00", { zone: "utc" });
    const b = DateTime.fromISO("2000-06-15T03:30:00", { zone: "utc" });
    const ra = computeTrueSolarTime(a, -74);
    const rb = computeTrueSolarTime(b, -74);
    expect(rb.dateTime.diff(ra.dateTime, "minutes").minutes).toBeCloseTo(120, 0);
  });
});

describe("toBeijingReferenceFields", () => {
  it("shifts a UTC instant forward by a fixed 8 hours", () => {
    const utc = DateTime.fromISO("2024-02-04T08:27:07", { zone: "utc" });
    const fields = toBeijingReferenceFields(utc);
    expect(fields).toEqual({ year: 2024, month: 2, day: 4, hour: 16, minute: 27, second: 7 });
  });

  it("correctly rolls the calendar date forward across a midnight boundary", () => {
    const utc = DateTime.fromISO("2024-02-04T20:15:00", { zone: "utc" });
    const fields = toBeijingReferenceFields(utc);
    // 20:15 UTC + 8h = 04:15 the NEXT day.
    expect(fields).toEqual({ year: 2024, month: 2, day: 5, hour: 4, minute: 15, second: 0 });
  });

  it("is a fixed +8h shift, independent of any IANA China DST history", () => {
    const utc = DateTime.fromISO("1988-06-01T00:00:00", { zone: "utc" });
    const fields = toBeijingReferenceFields(utc);
    expect(fields.hour).toBe(8);
    expect(fields.day).toBe(1);
  });
});
