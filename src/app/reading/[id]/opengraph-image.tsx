/**
 * Next.js file-convention hook: co-locating this exact filename in the
 * `[id]` segment auto-wires `<meta property="og:image">` for
 * `/reading/[id]`, no manual `metadata.openGraph.images` needed. Reuses
 * the same renderer + data loader as `/api/share/reading/[id]`
 * (`api/share/render.tsx` / `api/share/reading-data.ts`) so both
 * integration points produce byte-identical art — the same pattern
 * `match/[id]/opengraph-image.tsx` established.
 *
 * Deliberately public (no session check) — link-preview crawlers never
 * send this app's session cookie. A stale/invalid id still returns a
 * branded fallback card instead of a broken-image icon.
 */
import { loadReadingCardData } from "@/app/api/share/reading-data";
import { renderReadingCard, SHARE_SIZES } from "@/app/api/share/render";

export const alt = "Natal reading · Cinnabar";
export const size = SHARE_SIZES.og;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await loadReadingCardData(id);

  if (!data) {
    return renderReadingCard(
      {
        name: "",
        dayMasterElement: "wood",
        dayMasterElementLabel: "",
        dayMasterStrength: "balanced",
        zodiac: "",
        elements: { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 },
        favorableElements: [],
        tagline: "A chart-grounded natal reading — calculated, not guessed.",
      },
      "og"
    );
  }

  return renderReadingCard(data, "og");
}
