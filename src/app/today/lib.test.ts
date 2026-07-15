import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { CHART_STRONG_WOOD, CHART_WEAK_WATER } from "@/lib/interpreter/test-fixtures";
import { computeTodayInfo, dayPillarInteraction } from "./lib";

describe("computeTodayInfo", () => {
  it("resolves the civil date and a parsed day ganzhi in the given timezone", () => {
    const now = DateTime.fromISO("2026-07-15T10:00:00", { zone: "America/New_York" });
    const info = computeTodayInfo("America/New_York", now);
    expect(info.date).toBe("2026-07-15");
    expect(info.ganZhi).toHaveLength(2);
    expect(info.parsed.stem).toBe(info.ganZhi[0]);
    expect(info.parsed.branch).toBe(info.ganZhi[1]);
  });

  it("is deterministic for the same instant + zone", () => {
    const now = DateTime.fromISO("2026-07-15T10:00:00", { zone: "America/New_York" });
    const a = computeTodayInfo("America/New_York", now);
    const b = computeTodayInfo("America/New_York", now);
    expect(a).toEqual(b);
  });

  it("can land on a different civil date depending on timezone near the day boundary", () => {
    // 00:30 on the 16th in Tokyo (UTC+9) is still 08:30 on the 15th in Los
    // Angeles (UTC-7 under DST) — the same instant, two different civil days.
    const instant = DateTime.fromISO("2026-07-16T00:30:00", { zone: "Asia/Tokyo" });
    const tokyo = computeTodayInfo("Asia/Tokyo", instant);
    const losAngeles = computeTodayInfo("America/Los_Angeles", instant);
    expect(tokyo.date).toBe("2026-07-16");
    expect(losAngeles.date).toBe("2026-07-15");
    expect(tokyo.ganZhi).not.toBe(losAngeles.ganZhi);
  });

  it("falls back to the server zone (the injected `now`'s own zone) when tzId is missing or unrecognized", () => {
    const now = DateTime.fromISO("2026-07-15T10:00:00", { zone: "utc" });
    const missing = computeTodayInfo(undefined, now);
    const bogus = computeTodayInfo("Not/AZone", now);
    expect(missing.date).toBe("2026-07-15");
    expect(bogus.date).toBe("2026-07-15");
  });

  it("advances the ganzhi on consecutive civil days", () => {
    const day1 = computeTodayInfo("UTC", DateTime.fromISO("2026-07-15T00:00:00", { zone: "utc" }));
    const day2 = computeTodayInfo("UTC", DateTime.fromISO("2026-07-16T00:00:00", { zone: "utc" }));
    expect(day1.ganZhi).not.toBe(day2.ganZhi);
  });
});

describe("dayPillarInteraction", () => {
  it("flags a clash (相冲) when today's branch is the chart's day-branch opposite", () => {
    // CHART_STRONG_WOOD's day pillar is known from its fixture birth data
    // (1960-01-27 19:30, Beijing) — read its own day branch back out rather
    // than re-deriving it, then pick a chong-partner date for that branch
    // from the classical (fixed) opposite-branch pairing.
    const dayBranch = CHART_STRONG_WOOD.pillars.day.branch;
    const CHONG_PARTNER: Record<string, string> = {
      子: "午",
      丑: "未",
      寅: "申",
      卯: "酉",
      辰: "戌",
      巳: "亥",
      午: "子",
      未: "丑",
      申: "寅",
      酉: "卯",
      戌: "辰",
      亥: "巳",
    };
    const wantBranch = CHONG_PARTNER[dayBranch];

    // Scan forward from a fixed date for a civil day whose ganzhi branch
    // matches the wanted chong partner (branches cycle every 12 days).
    let found: ReturnType<typeof computeTodayInfo> | null = null;
    for (let i = 0; i < 12; i++) {
      const candidate = computeTodayInfo("UTC", DateTime.fromISO("2026-07-15T00:00:00", { zone: "utc" }).plus({ days: i }));
      if (candidate.parsed.branch === wantBranch) {
        found = candidate;
        break;
      }
    }
    expect(found).not.toBeNull();

    const interaction = dayPillarInteraction(CHART_STRONG_WOOD, found!);
    expect(interaction).not.toBeNull();
    expect(interaction!.type).toBe("chong");
    expect(interaction!.note).toContain("相冲");
  });

  it("returns null on an ordinary day with no classical relation to the day pillar", () => {
    // Rather than hand-picking a branch known to have no relation to
    // CHART_WEAK_WATER's day pillar, scan a full 12-day cycle (branches
    // repeat every 12 days) and assert at least one civil day in it comes
    // back neutral — a chart only has a handful of special partner
    // branches (one chong, one liuhe, up to two xing) out of the other 11.
    const results = Array.from({ length: 12 }, (_, i) =>
      dayPillarInteraction(
        CHART_WEAK_WATER,
        computeTodayInfo("UTC", DateTime.fromISO("2026-07-15T00:00:00", { zone: "utc" }).plus({ days: i }))
      )
    );
    expect(results.some((r) => r === null)).toBe(true);
  });
});
