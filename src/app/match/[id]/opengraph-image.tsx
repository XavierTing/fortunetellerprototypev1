/**
 * Next.js file-convention hook (PRD §5.5 acceptance: "a share card image
 * renders server-side and looks good in a link-preview"): co-locating this
 * exact filename in the `[id]` segment makes Next.js auto-wire
 * `<meta property="og:image">` (+ width/height/type) for this route, no
 * manual `metadata.openGraph.images` wiring needed. Reuses the same
 * renderer + data loader as the generic `/api/share/compatibility/[id]`
 * route (`api/share/render.tsx` / `api/share/compat-data.ts`) so the two
 * integration points always produce byte-identical art for the same pair.
 *
 * Deliberately public (no session check) — link-preview crawlers never send
 * this app's session cookie. A stale/invalid id still returns a branded
 * fallback card instead of a broken-image icon.
 */
import { loadCompatCardData } from "@/app/api/share/compat-data";
import { renderCompatibilityCard, SHARE_SIZES } from "@/app/api/share/render";

export const alt = "Compatibility reading · Cinnabar";
export const size = SHARE_SIZES.og;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await loadCompatCardData(id);

  if (!data) {
    return renderCompatibilityCard(
      {
        nameA: "Cinnabar",
        nameB: "",
        dayMasterLabelA: "",
        dayMasterLabelB: "",
        score: 0,
        verdict: "A relationship reading between two charts.",
      },
      "og"
    );
  }

  return renderCompatibilityCard(data, "og");
}
