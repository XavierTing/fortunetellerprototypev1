import { Solar } from "lunar-typescript";
import { describe, expect, it } from "vitest";
import { buildPillars } from "./pillars";

describe("buildPillars — oracle-matched golden cases", () => {
  // A Beijing-timezone birth, comfortably mid-day (far from any 2-hour zhi
  // boundary) and mid-month (far from any jieqi boundary). Because Beijing's
  // civil clock (Asia/Shanghai, fixed UTC+8, no DST) essentially *is* the
  // reference frame lunar-typescript's jieqi table is tabulated in, the
  // "Beijing reference" conversion is a no-op here, and the true-solar-time
  // longitude correction for Beijing city (116.4E, ~14 min west of the
  // 120E zone meridian) plus equation-of-time is small enough not to cross
  // any pillar boundary. That makes it safe to use lunar-typescript's own
  // *raw, uncorrected* Solar->Lunar->EightChar output (constructed directly
  // from the civil clock reading, right here in the test) as an independent
  // oracle for the year/month/day pillars.
  it("matches lunar-typescript's own EightChar for a Beijing noon birth", () => {
    // 2010 (not, say, 1990) deliberately: China observed summer DST from
    // 1986-1991, which would make "civil Asia/Shanghai" differ from the
    // fixed UTC+8 reference frame by an extra hour — a real, correctly
    // -handled effect (see the zi-hour describe block below), but a
    // needless confound for *this* "Beijing frame is a no-op" case.
    const oracleSolar = Solar.fromYmdHms(2010, 6, 15, 12, 0, 0);
    const oracleEc = oracleSolar.getLunar().getEightChar();

    const chart = buildPillars({
      date: "2010-06-15",
      time: "12:00",
      lat: 39.9042,
      lng: 116.4074,
      tzId: "Asia/Shanghai",
    });

    expect(chart.pillars.year.stem).toBe(oracleEc.getYearGan());
    expect(chart.pillars.year.branch).toBe(oracleEc.getYearZhi());
    expect(chart.pillars.month.stem).toBe(oracleEc.getMonthGan());
    expect(chart.pillars.month.branch).toBe(oracleEc.getMonthZhi());
    expect(chart.pillars.day.stem).toBe(oracleEc.getDayGan());
    expect(chart.pillars.day.branch).toBe(oracleEc.getDayZhi());
  });

  it("matches lunar-typescript's own EightChar for a second, unrelated Beijing birth", () => {
    const oracleSolar = Solar.fromYmdHms(2001, 11, 3, 9, 15, 0);
    const oracleEc = oracleSolar.getLunar().getEightChar();

    const chart = buildPillars({
      date: "2001-11-03",
      time: "09:15",
      lat: 39.9042,
      lng: 116.4074,
      tzId: "Asia/Shanghai",
    });

    expect(chart.pillars.year.stem + chart.pillars.year.branch).toBe(oracleEc.getYear());
    expect(chart.pillars.month.stem + chart.pillars.month.branch).toBe(oracleEc.getMonth());
    expect(chart.pillars.day.stem + chart.pillars.day.branch).toBe(oracleEc.getDay());
  });

  // Hand-verifiable checkpoint: 1900-01-31 is the widely-published epoch
  // anchor for the sexagenary day cycle used throughout Chinese calendrical
  // software — it is a 甲辰 (jiǎchén) day. This is independent of
  // lunar-typescript's own internals (it's cited in essentially every
  // Chinese perpetual-calendar reference), so it validates our day-pillar
  // plumbing without relying on the library to check itself.
  it("computes the well-known 1900-01-31 = 甲辰 day-pillar epoch anchor", () => {
    const chart = buildPillars({
      date: "1900-01-31",
      time: "12:00",
      lat: 39.9042,
      lng: 116.4074,
      tzId: "Asia/Shanghai",
    });
    expect(chart.pillars.day.stem).toBe("甲");
    expect(chart.pillars.day.branch).toBe("辰");
  });

  // Hand-verifiable checkpoint: Lichun (立春) 2024 is publicly documented as
  // 2024-02-04 16:27 China Standard Time — the widely-reported start of the
  // 甲辰 (Dragon) year. A birth a few minutes either side of that instant,
  // in Beijing's own timezone, must flip both year and month pillars right
  // at the boundary.
  it("flips the year pillar exactly at the publicly-documented 2024 Lichun instant (Beijing birth)", () => {
    const before = buildPillars({
      date: "2024-02-04",
      time: "16:20",
      lat: 39.9042,
      lng: 116.4074,
      tzId: "Asia/Shanghai",
    });
    const after = buildPillars({
      date: "2024-02-04",
      time: "16:35",
      lat: 39.9042,
      lng: 116.4074,
      tzId: "Asia/Shanghai",
    });
    expect(before.pillars.year.stem + before.pillars.year.branch).toBe("癸卯");
    expect(after.pillars.year.stem + after.pillars.year.branch).toBe("甲辰");
    expect(before.zodiac).toBe("Rabbit");
    expect(after.zodiac).toBe("Dragon");
  });

  // Same astronomical instant (Lichun 2024, 2024-02-04 08:27:07 UTC),
  // observed from New York (EST, UTC-5 in February, no DST) instead of
  // Beijing. This is the core "Western readiness" correctness claim: the
  // UTC-instant -> Beijing-reference-frame conversion must find the *same*
  // universal jieqi crossing regardless of the birth's own timezone.
  it("flips the year pillar at the same universal Lichun instant for a New York birth", () => {
    const before = buildPillars({
      date: "2024-02-04",
      time: "03:20",
      lat: 40.7128,
      lng: -74.006,
      tzId: "America/New_York",
    });
    const after = buildPillars({
      date: "2024-02-04",
      time: "03:35",
      lat: 40.7128,
      lng: -74.006,
      tzId: "America/New_York",
    });
    expect(before.pillars.year.stem + before.pillars.year.branch).toBe("癸卯");
    expect(after.pillars.year.stem + after.pillars.year.branch).toBe("甲辰");
  });
});

describe("buildPillars — 子时 (zi-hour) day rollover", () => {
  // 2010 (not 1990): China's 1986-1991 summer DST would shift these
  // boundary-sensitive fixtures by an extra hour — correctly handled by the
  // engine (civil time really is DST-aware), but not what this block is
  // testing, so we pick a date outside that historical window.
  it("keeps the hour pillar's stem internally consistent with the day pillar it reports at 23:xx", () => {
    // sect=1 (day rolls at 23:00) is chosen specifically so the reported day
    // pillar always matches what the classical five-rat-escaping rule (五鼠遁)
    // used to derive the hour stem — see pillars.ts for the full rationale.
    const chart = buildPillars({
      date: "2010-06-15",
      time: "23:30",
      lat: 39.9042,
      lng: 116.4074,
      tzId: "Asia/Shanghai",
    });
    // Independently re-derive the expected hour stem from the reported day
    // stem via the classical rule table (五鼠遁诀): the day-stem's own
    // "starting" hour stem for the 子 branch.
    const FIVE_RAT_ZI_STEM: Record<string, string> = {
      甲: "甲", 己: "甲",
      乙: "丙", 庚: "丙",
      丙: "戊", 辛: "戊",
      丁: "庚", 壬: "庚",
      戊: "壬", 癸: "壬",
    };
    expect(chart.pillars.hour?.branch).toBe("子");
    expect(chart.pillars.hour?.stem).toBe(FIVE_RAT_ZI_STEM[chart.pillars.day.stem]);
  });

  it("rolls the day pillar forward for a 23:xx birth vs. the following day's 00:xx", () => {
    const lateNight = buildPillars({
      date: "2010-06-15",
      time: "23:15",
      lat: 39.9042,
      lng: 116.4074,
      tzId: "Asia/Shanghai",
    });
    const earlyNextDay = buildPillars({
      date: "2010-06-16",
      time: "00:15",
      lat: 39.9042,
      lng: 116.4074,
      tzId: "Asia/Shanghai",
    });
    // Both are "zi hour" and (under the sect=1 convention) share the same
    // rolled-forward day pillar.
    expect(lateNight.pillars.day.stem + lateNight.pillars.day.branch).toBe(
      earlyNextDay.pillars.day.stem + earlyNextDay.pillars.day.branch
    );
    expect(lateNight.pillars.hour?.branch).toBe("子");
    expect(earlyNextDay.pillars.hour?.branch).toBe("子");
  });

  it("does NOT roll the day pillar for a birth just before 23:00", () => {
    const justBefore = buildPillars({
      date: "2010-06-15",
      time: "22:59",
      lat: 39.9042,
      lng: 116.4074,
      tzId: "Asia/Shanghai",
    });
    const lateNight = buildPillars({
      date: "2010-06-15",
      time: "23:15",
      lat: 39.9042,
      lng: 116.4074,
      tzId: "Asia/Shanghai",
    });
    expect(justBefore.pillars.day.stem + justBefore.pillars.day.branch).not.toBe(
      lateNight.pillars.day.stem + lateNight.pillars.day.branch
    );
  });
});

describe("buildPillars — DST transition", () => {
  it("resolves civil clock time through the IANA zone's historical DST correctly", () => {
    // 2020-03-08 is US spring-forward (America/New_York: 02:00 -> 03:00 EDT).
    // 01:30 is EST (UTC-5); 03:30 is EDT (UTC-4) — only 1 real hour apart in
    // UTC despite being 2 hours apart on the civil clock. If DST weren't
    // honored (e.g. a naive fixed UTC-5 offset), these would be 2 UTC hours
    // apart instead of 1.
    const before = buildPillars({
      date: "2020-03-08",
      time: "01:30",
      lat: 40.7128,
      lng: -74.006,
      tzId: "America/New_York",
    });
    const after = buildPillars({
      date: "2020-03-08",
      time: "03:30",
      lat: 40.7128,
      lng: -74.006,
      tzId: "America/New_York",
    });
    expect(before.trueSolarTime).not.toBeNull();
    expect(after.trueSolarTime).not.toBeNull();
    const t1 = new Date(before.trueSolarTime + "Z").getTime();
    const t2 = new Date(after.trueSolarTime + "Z").getTime();
    expect((t2 - t1) / 60000).toBeCloseTo(60, 0);
  });

  it("does not crash on a civil time that falls in the spring-forward gap", () => {
    expect(() =>
      buildPillars({
        date: "2020-03-08",
        time: "02:30",
        lat: 40.7128,
        lng: -74.006,
        tzId: "America/New_York",
      })
    ).not.toThrow();
  });
});

describe("buildPillars — southern hemisphere", () => {
  it("computes a full, well-formed chart for a Sydney birth", () => {
    const chart = buildPillars({
      date: "1990-01-15",
      time: "14:00",
      lat: -33.8688,
      lng: 151.2093,
      tzId: "Australia/Sydney",
    });
    expect(chart.pillars.year.stem).toMatch(/^[甲乙丙丁戊己庚辛壬癸]$/);
    expect(chart.pillars.hour).not.toBeNull();
    expect(chart.trueSolarTime).not.toBeNull();
  });
});

describe("buildPillars — unknown birth time", () => {
  it("returns a 3-pillar chart: hour null, trueSolarTime null, no crash", () => {
    const chart = buildPillars({
      date: "1990-06-15",
      time: null,
      lat: 39.9042,
      lng: 116.4074,
      tzId: "Asia/Shanghai",
    });
    expect(chart.pillars.hour).toBeNull();
    expect(chart.trueSolarTime).toBeNull();
    expect(chart.pillars.year.stem).toMatch(/^[甲乙丙丁戊己庚辛壬癸]$/);
    expect(chart.pillars.month.stem).toMatch(/^[甲乙丙丁戊己庚辛壬癸]$/);
    expect(chart.pillars.day.stem).toMatch(/^[甲乙丙丁戊己庚辛壬癸]$/);
  });

  it("uses the same day pillar as a matching noon birth-time chart (safe internal default)", () => {
    const unknown = buildPillars({
      date: "1990-06-15",
      time: null,
      lat: 39.9042,
      lng: 116.4074,
      tzId: "Asia/Shanghai",
    });
    const noon = buildPillars({
      date: "1990-06-15",
      time: "12:00",
      lat: 39.9042,
      lng: 116.4074,
      tzId: "Asia/Shanghai",
    });
    expect(unknown.pillars.day.stem + unknown.pillars.day.branch).toBe(
      noon.pillars.day.stem + noon.pillars.day.branch
    );
  });
});

describe("buildPillars — different birthplaces, same civil clock reading", () => {
  // 09:50 local is deliberately chosen: NYC's true solar time runs ~55min
  // BEHIND its civil (EDT) clock (its longitude sits ~14° west of EDT's
  // nominal -60° meridian), while Sydney's runs ~6min AHEAD of its civil
  // (AEST) clock (its longitude sits ~1.2° east of AEST's nominal 150°
  // meridian) — verified by direct computation before writing this test.
  // That's enough of a gap to push the two births into DIFFERENT 2-hour
  // 时辰 windows even though every other pillar (year/month/day, since both
  // land on the same true-solar calendar date) matches — which is itself
  // the point: true solar correction is a small, location-specific nudge,
  // not a wholesale re-interpretation, and PRD §5.1's "different charts for
  // different birthplaces at the same civil time" shows up precisely here,
  // in the hour pillar and the true-solar-time string.
  it("produces a different hour pillar for New York vs. Sydney at the same civil clock time", () => {
    const nyc = buildPillars({
      date: "1990-06-15",
      time: "09:50",
      lat: 40.7128,
      lng: -74.006,
      tzId: "America/New_York",
    });
    const sydney = buildPillars({
      date: "1990-06-15",
      time: "09:50",
      lat: -33.8688,
      lng: 151.2093,
      tzId: "Australia/Sydney",
    });
    expect(nyc.pillars.hour?.branch).toBe("辰");
    expect(sydney.pillars.hour?.branch).toBe("巳");
    expect(nyc.pillars.hour?.branch).not.toBe(sydney.pillars.hour?.branch);
    expect(nyc.trueSolarTime).not.toBe(sydney.trueSolarTime);
  });

  it("always produces a different trueSolarTime for different tzId/lng even at identical civil clock readings", () => {
    const tokyo = buildPillars({
      date: "1990-06-15",
      time: "10:30",
      lat: 35.6762,
      lng: 139.6503,
      tzId: "Asia/Tokyo",
    });
    const nyc = buildPillars({
      date: "1990-06-15",
      time: "10:30",
      lat: 40.7128,
      lng: -74.006,
      tzId: "America/New_York",
    });
    expect(tokyo.trueSolarTime).not.toBe(nyc.trueSolarTime);
  });
});

describe("buildPillars — pillar shape", () => {
  it("attaches pinyin, element, and hidden stems from lunar-typescript's own hidden-gan table", () => {
    const chart = buildPillars({
      date: "2022-02-10",
      time: "10:00",
      lat: 39.9042,
      lng: 116.4074,
      tzId: "Asia/Shanghai",
    });
    // 寅 month around this date — canonical hidden stems 甲(main)丙(mid)戊(residual).
    expect(chart.pillars.month.branch).toBe("寅");
    expect(chart.pillars.month.hiddenStems).toEqual(["甲", "丙", "戊"]);
    expect(chart.pillars.month.branchPinyin).toBe("yín");
    expect(chart.pillars.month.branchElement).toBe("wood");
    expect(chart.pillars.year.stemPinyin.length).toBeGreaterThan(0);
  });

  it("throws a clear error on an invalid tzId or malformed date", () => {
    expect(() =>
      buildPillars({ date: "not-a-date", time: "10:00", lat: 0, lng: 0, tzId: "Asia/Shanghai" })
    ).toThrow();
    expect(() =>
      buildPillars({ date: "1990-06-15", time: "10:00", lat: 0, lng: 0, tzId: "Not/AZone" })
    ).toThrow();
  });
});
