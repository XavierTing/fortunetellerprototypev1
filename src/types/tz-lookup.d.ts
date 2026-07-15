/**
 * `tz-lookup` ships no types and has no @types/tz-lookup package. It's a
 * single default export: given a lat/lng, returns the IANA timezone id
 * (e.g. "America/New_York") — used by the bazi engine (PRD §7.2) to turn a
 * birth place into a timezone without asking the user to pick a UTC offset.
 */
declare module "tz-lookup" {
  function tzLookup(latitude: number, longitude: number): string;
  export default tzLookup;
}
