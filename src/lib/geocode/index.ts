/**
 * Offline city geocoding for the birth-data form (PRD §5.1 — "Place
 * autocomplete resolves to lat/long + IANA timezone", no external
 * geocoding API). `cities.json` is a curated, bundled dataset (name,
 * optional region, country, lat, lng); this module turns a free-text
 * query into ranked city matches and a picked city into
 * {lat, lng, tzId}.
 *
 * Pure and side-effect-free (aside from importing the static dataset), so
 * it's usable from both a Route Handler (autocomplete) and a Server
 * Action (resolving the submitted `cityId`).
 */
import tzLookup from "tz-lookup";
import rawCities from "./cities.json";

export interface City {
  /** Stable, unique kebab-case id — the value a form submits and this module looks records up by. */
  id: string;
  name: string;
  /** State/province/admin1, only present where it disambiguates (e.g. US states). */
  region?: string;
  country: string;
  lat: number;
  lng: number;
}

export const CITIES: readonly City[] = rawCities as City[];

/** Human-readable label for display in the autocomplete input/list. */
export function cityLabel(city: City): string {
  return city.region ? `${city.name}, ${city.region}, ${city.country}` : `${city.name}, ${city.country}`;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Ranked, prefix-first search over the bundled city dataset. Lower rank
 * sorts first: 0 = name starts with the query, 1 = a word within the name
 * starts with it, 2 = the name contains it, 3 = region/country starts with
 * it, 4 = region/country contains it. Deterministic given the same query.
 */
export function searchCities(query: string, limit = 8): City[] {
  const q = normalize(query);
  if (!q) return [];

  const scored: { city: City; rank: number }[] = [];
  for (const city of CITIES) {
    const name = normalize(city.name);
    const country = normalize(city.country);
    const region = city.region ? normalize(city.region) : "";

    let rank: number | null = null;
    if (name.startsWith(q)) rank = 0;
    else if (name.split(/\s+/).some((word) => word.startsWith(q))) rank = 1;
    else if (name.includes(q)) rank = 2;
    else if (region.startsWith(q) || country.startsWith(q)) rank = 3;
    else if (region.includes(q) || country.includes(q)) rank = 4;

    if (rank !== null) scored.push({ city, rank });
  }

  scored.sort(
    (a, b) => a.rank - b.rank || a.city.name.length - b.city.name.length || a.city.name.localeCompare(b.city.name)
  );

  return scored.slice(0, limit).map((s) => s.city);
}

/** Look up a single city by the id an autocomplete selection (or a submitted form) references. */
export function findCityById(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}

/** IANA timezone id for a lat/lng — thin wrapper so callers only import from `@/lib/geocode`, not `tz-lookup` directly. */
export function resolveTimezone(lat: number, lng: number): string {
  return tzLookup(lat, lng);
}
