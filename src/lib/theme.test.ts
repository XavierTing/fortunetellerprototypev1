import { describe, expect, it } from "vitest";
import { isTheme, THEME_STORAGE_KEY, toggleTheme } from "@/lib/theme";

describe("toggleTheme", () => {
  it("flips dark to light", () => {
    expect(toggleTheme("dark")).toBe("light");
  });

  it("flips light to dark", () => {
    expect(toggleTheme("light")).toBe("dark");
  });
});

describe("isTheme", () => {
  it("accepts valid theme strings", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isTheme("system")).toBe(false);
    expect(isTheme(null)).toBe(false);
    expect(isTheme(undefined)).toBe(false);
    expect(isTheme("")).toBe(false);
  });
});

describe("THEME_STORAGE_KEY", () => {
  it("is the versioned, namespaced localStorage key", () => {
    expect(THEME_STORAGE_KEY).toBe("cinnabar-theme-2");
  });
});
