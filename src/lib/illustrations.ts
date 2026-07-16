/**
 * Shared naming helpers for the AI-generated illustration assets under
 * `/public` — see the ART-WIRING task's shared asset-path contract:
 *   - `/illustrations/hero.png`, `/illustrations/share-motif.png`
 *   - `/illustrations/empty-{master,today,me,match}.png`
 *   - `/elements/{wood,fire,earth,metal,water}.png`
 *   - `/zodiac/{rat,ox,tiger,rabbit,dragon,snake,horse,goat,monkey,rooster,dog,pig}.png`
 *
 * Centralizing the slug/path conventions here means every consumer — the
 * in-app `next/image` slots AND `src/app/api/share/render.tsx` (which reads
 * these same files straight off disk for Satori, since `ImageResponse` has
 * no access to Next's `/public` URL space) — derives the same filename from
 * the same input (a `Chart.zodiac` / `parseGanZhi().branchAnimal` string, or
 * an `Element`) instead of re-deriving `.toLowerCase()` independently in
 * four different places.
 *
 * Pure string helpers only — no filesystem/`next/image` imports — so this
 * stays safe to import from both client components and the server-only
 * share renderer.
 */
import type { Element } from "@/lib/interpreter/types";

export type EmptyStateKey = "master" | "today" | "me" | "match";

/**
 * English zodiac animal name (e.g. "Rabbit", straight from `Chart.zodiac` or
 * `parseGanZhi().branchAnimal` — see `src/lib/bazi/constants.ts`'s `BRANCHES`
 * table, the source of both) → the `/public/zodiac/*.png` filename stem.
 */
export function zodiacSlug(zodiac: string): string {
  return zodiac.trim().toLowerCase();
}

/** `next/image`-ready path for a given zodiac animal's brush emblem. */
export function zodiacImageSrc(zodiac: string): string {
  return `/zodiac/${zodiacSlug(zodiac)}.png`;
}

/** `next/image`-ready path for a given Five-Element emblem. */
export function elementImageSrc(element: Element): string {
  return `/elements/${element}.png`;
}

/** `next/image`-ready path for one of the four quiet empty-state illustrations. */
export function emptyStateImageSrc(key: EmptyStateKey): string {
  return `/illustrations/empty-${key}.png`;
}
