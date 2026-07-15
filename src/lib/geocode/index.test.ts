import { describe, expect, it } from "vitest";
import { CITIES, cityLabel, findCityById, resolveTimezone, searchCities } from "./index";

describe("geocode dataset integrity", () => {
  it("has a reasonably sized curated dataset", () => {
    expect(CITIES.length).toBeGreaterThanOrEqual(400);
    expect(CITIES.length).toBeLessThanOrEqual(1500);
  });

  it("every city has a unique id", () => {
    const ids = new Set(CITIES.map((c) => c.id));
    expect(ids.size).toBe(CITIES.length);
  });

  it("every city has plausible coordinates and required fields", () => {
    for (const city of CITIES) {
      expect(city.name.length).toBeGreaterThan(0);
      expect(city.country.length).toBeGreaterThan(0);
      expect(city.lat).toBeGreaterThanOrEqual(-90);
      expect(city.lat).toBeLessThanOrEqual(90);
      expect(city.lng).toBeGreaterThanOrEqual(-180);
      expect(city.lng).toBeLessThanOrEqual(180);
      // Guards against accidental (0,0) placeholder coordinates.
      expect(city.lat === 0 && city.lng === 0).toBe(false);
    }
  });

  it("covers multiple continents (spot-check well-known countries)", () => {
    const countries = new Set(CITIES.map((c) => c.country));
    for (const country of [
      "United States",
      "United Kingdom",
      "China",
      "India",
      "Nigeria",
      "Brazil",
      "Australia",
      "Egypt",
    ]) {
      expect(countries.has(country)).toBe(true);
    }
  });
});

describe("cityLabel", () => {
  it("includes region when present", () => {
    const city = findCityById("new-york-ny-us");
    expect(city).toBeDefined();
    expect(cityLabel(city!)).toBe("New York, NY, United States");
  });

  it("omits region when absent", () => {
    const city = findCityById("london-uk");
    expect(city).toBeDefined();
    expect(cityLabel(city!)).toBe("London, United Kingdom");
  });
});

describe("findCityById", () => {
  it("returns the matching city", () => {
    expect(findCityById("tokyo-jp")?.name).toBe("Tokyo");
  });

  it("returns undefined for an unknown id", () => {
    expect(findCityById("not-a-real-city-id")).toBeUndefined();
  });
});

describe("searchCities", () => {
  it("returns [] for an empty or whitespace query", () => {
    expect(searchCities("")).toEqual([]);
    expect(searchCities("   ")).toEqual([]);
  });

  it("ranks exact name-prefix matches first", () => {
    const results = searchCities("lon");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe("London");
  });

  it("is case-insensitive and diacritic-insensitive", () => {
    const results = searchCities("ZURICH");
    expect(results.some((c) => c.name === "Zürich")).toBe(true);

    const saoPaulo = searchCities("sao paulo");
    expect(saoPaulo.some((c) => c.name === "São Paulo")).toBe(true);
  });

  it("matches a word within a multi-word city name", () => {
    const results = searchCities("york");
    expect(results.some((c) => c.name === "New York")).toBe(true);
  });

  it("falls back to country/region matches when no city name matches", () => {
    const results = searchCities("zealand");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((c) => c.country === "New Zealand")).toBe(true);
  });

  it("respects the limit parameter", () => {
    const results = searchCities("a", 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("disambiguates same-name cities via region", () => {
    const results = searchCities("portland");
    const regions = results.filter((c) => c.name === "Portland").map((c) => c.region);
    expect(regions).toEqual(expect.arrayContaining(["OR", "ME"]));
  });

  it("is deterministic across repeated calls", () => {
    expect(searchCities("san")).toEqual(searchCities("san"));
  });
});

describe("resolveTimezone", () => {
  it("resolves New York to America/New_York", () => {
    const city = findCityById("new-york-ny-us")!;
    expect(resolveTimezone(city.lat, city.lng)).toBe("America/New_York");
  });

  it("resolves Sydney to Australia/Sydney", () => {
    const city = findCityById("sydney-nsw-au")!;
    expect(resolveTimezone(city.lat, city.lng)).toBe("Australia/Sydney");
  });

  it("resolves Tokyo to Asia/Tokyo", () => {
    const city = findCityById("tokyo-jp")!;
    expect(resolveTimezone(city.lat, city.lng)).toBe("Asia/Tokyo");
  });
});
