import { describe, expect, it } from "vitest";
import { isNavItemActive, NAV_ITEMS } from "@/lib/nav";

describe("NAV_ITEMS", () => {
  it("has the five primary routes in order", () => {
    expect(NAV_ITEMS.map((item) => item.href)).toEqual([
      "/",
      "/master",
      "/today",
      "/match",
      "/me",
    ]);
  });

  it("has a label for every item", () => {
    for (const item of NAV_ITEMS) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });
});

describe("isNavItemActive", () => {
  it("matches the root route exactly", () => {
    expect(isNavItemActive("/", "/")).toBe(true);
    expect(isNavItemActive("/", "/master")).toBe(false);
  });

  it("matches nested routes by prefix", () => {
    expect(isNavItemActive("/master", "/master")).toBe(true);
    expect(isNavItemActive("/master", "/master/thread-1")).toBe(true);
    expect(isNavItemActive("/master", "/today")).toBe(false);
  });

  it("does not treat a similarly-named route as a prefix match", () => {
    expect(isNavItemActive("/me", "/master")).toBe(false);
  });
});
