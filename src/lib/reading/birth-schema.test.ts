import { describe, expect, it } from "vitest";
import { BirthFormSchema, resolveBirthInput } from "./birth-schema";

function raw(overrides: Partial<Record<"name" | "date" | "time" | "timeUnknown" | "cityId", string>> = {}) {
  return {
    name: "",
    date: "1990-06-15",
    time: "10:30",
    timeUnknown: "",
    cityId: "new-york-ny-united-states",
    ...overrides,
  };
}

describe("BirthFormSchema", () => {
  it("accepts a fully valid submission", () => {
    const result = BirthFormSchema.safeParse(raw({ name: "Maya" }));
    expect(result.success).toBe(true);
  });

  it("accepts an empty name (optional field)", () => {
    const result = BirthFormSchema.safeParse(raw());
    expect(result.success).toBe(true);
  });

  it("rejects a malformed date", () => {
    const result = BirthFormSchema.safeParse(raw({ date: "06/15/1990" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.date?.[0]).toBeTruthy();
    }
  });

  it("rejects a birth year before 1900", () => {
    const result = BirthFormSchema.safeParse(raw({ date: "1850-01-01" }));
    expect(result.success).toBe(false);
  });

  it("rejects a birth year far in the future", () => {
    const result = BirthFormSchema.safeParse(raw({ date: "2999-01-01" }));
    expect(result.success).toBe(false);
  });

  it("rejects a missing time when timeUnknown is not set", () => {
    const result = BirthFormSchema.safeParse(raw({ time: "" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.time?.[0]).toBeTruthy();
    }
  });

  it("rejects a malformed time", () => {
    const result = BirthFormSchema.safeParse(raw({ time: "25:99" }));
    expect(result.success).toBe(false);
  });

  it("accepts a missing time when timeUnknown is 'on'", () => {
    const result = BirthFormSchema.safeParse(raw({ time: "", timeUnknown: "on" }));
    expect(result.success).toBe(true);
  });

  it("rejects a missing cityId", () => {
    const result = BirthFormSchema.safeParse(raw({ cityId: "" }));
    expect(result.success).toBe(false);
  });

  it("rejects an overlong name", () => {
    const result = BirthFormSchema.safeParse(raw({ name: "x".repeat(81) }));
    expect(result.success).toBe(false);
  });
});

describe("resolveBirthInput", () => {
  it("maps a known-time submission straight through", () => {
    const parsed = BirthFormSchema.parse(raw({ name: "Maya", time: "10:30" }));
    const resolved = resolveBirthInput(parsed);
    expect(resolved).toEqual({
      name: "Maya",
      date: "1990-06-15",
      time: "10:30",
      cityId: "new-york-ny-united-states",
    });
  });

  it("collapses timeUnknown into time: null even if a stray time value is present", () => {
    const parsed = BirthFormSchema.parse(raw({ time: "", timeUnknown: "on" }));
    const resolved = resolveBirthInput(parsed);
    expect(resolved.time).toBeNull();
  });

  it("maps an empty name to null", () => {
    const parsed = BirthFormSchema.parse(raw({ name: "" }));
    expect(resolveBirthInput(parsed).name).toBeNull();
  });

  it("trims a whitespace-only name to null", () => {
    const parsed = BirthFormSchema.parse(raw({ name: "   " }));
    expect(resolveBirthInput(parsed).name).toBeNull();
  });
});
