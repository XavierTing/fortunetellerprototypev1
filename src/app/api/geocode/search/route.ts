/**
 * City-autocomplete backend for the birth-data form. Searches the bundled
 * offline city dataset (`@/lib/geocode`) server-side and returns only the
 * top matches — keeps the ~city dataset out of the client bundle entirely.
 * No external geocoding API is called (PRD §5.1).
 */
import { searchCities } from "@/lib/geocode";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const results = searchCities(q, 8);
  return Response.json({ results });
}
