/**
 * Server-only, framework-agnostic (given plain data) share-image renderers,
 * built on `ImageResponse` from `next/og` (bundled with Next.js — no
 * `@vercel/og` package install needed, per PRD §7.5). Shared by both
 * integration points so the pixels are identical either way:
 *   - the generic `/api/share/[type]/[id]` Route Handler (one-tap
 *     "Share"/copy-link button on the result page), and
 *   - `src/app/match/[id]/opengraph-image.tsx` (the file-convention hook
 *     Next.js uses to wire `<meta property="og:image">` automatically for
 *     link-preview scrapers).
 *
 * Only "compatibility" is implemented (this task's scope); the `type`
 * switch lives in the Route Handler, not here — this module only knows how
 * to turn already-loaded card data into pixels, so a later `type` (reading,
 * daily) is just another `renderXCard(data, sizeKey)` export plus a switch
 * arm, no changes to the sizing/color/route plumbing below.
 *
 * Color note: `ImageResponse` renders via Satori/resvg, which does NOT
 * understand `oklch()` — only hex/rgb/hsl. The values below are the DESIGN.md
 * dark-theme OKLCH tokens (globals.css's `:root`) converted once through the
 * standard OKLCH → linear-sRGB → sRGB pipeline (Björn Ottosson's reference
 * formulas) and hand-checked; see `.build-reports/T6-report.md` for the
 * conversion script. They're deliberately hardcoded here rather than derived
 * at request time — a share image is a one-shot raster, not a themable
 * surface, so there's no runtime light/dark branching to preserve.
 *
 * Font note: this deliberately does NOT pass a custom `fonts` array to
 * `ImageResponse`. The app's real display/body faces (Cormorant Garamond,
 * Hanken Grotesk) are loaded via `next/font/google`, which self-hosts them
 * into Next's build cache rather than leaving a plain .ttf/.otf file on disk
 * this route could `readFile()` — and satori's bundled default font has no
 * CJK glyph coverage, so Chinese characters are deliberately kept OUT of
 * this raster (a Latin monogram "C" stands in for a seal mark instead). A
 * follow-up could vendor real Latin .ttf files under `public/fonts/` and
 * pass them via the `fonts` option for exact on-brand typography.
 */
import { ImageResponse } from "next/og";

export const SHARE_SIZES = {
  /** Link-preview / Open Graph card (Slack, iMessage, Twitter/X, Facebook). */
  og: { width: 1200, height: 630 },
  /** Instagram / TikTok story frame — tall portrait. */
  story: { width: 1080, height: 1920 },
} as const;

export type ShareSizeKey = keyof typeof SHARE_SIZES;

/** `?size=story` opts into the tall story frame; anything else (including absent) falls back to the og/link-preview size. */
export function resolveSizeKey(raw: string | null): ShareSizeKey {
  return raw === "story" ? "story" : "og";
}

/** Hex/rgba equivalents of the DESIGN.md dark-theme OKLCH tokens — see file header. */
export const SHARE_COLORS = {
  lacquer: "#0a0503",
  lacquerDeep: "#020100",
  raised: "#140c09",
  hairlineGold: "rgba(227,183,83,0.4)",
  gold: "#e3b753",
  goldPale: "#ebd6a3",
  cinnabar: "#e55033",
  jade: "#6ebda0",
  ink: "#eae7e4",
  text: "#dad7d4",
  muted: "#a6a4a2",
  faint: "#82807e",
} as const;

export interface CompatCardData {
  nameA: string;
  nameB: string;
  /** Display element label, e.g. "Wood" — empty string renders no tag. */
  dayMasterLabelA: string;
  dayMasterLabelB: string;
  score: number;
  verdict: string;
}

/** Jade = positive/harmonious (DESIGN.md §2: jade is "reserved for... a harmonious compatibility result"), gold = mixed, cinnabar = high-friction. */
function toneColor(score: number): string {
  if (score >= 70) return SHARE_COLORS.jade;
  if (score >= 45) return SHARE_COLORS.gold;
  return SHARE_COLORS.cinnabar;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function PersonChip({ name, dayMaster, large }: { name: string; dayMaster: string; large?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ display: "flex", fontSize: large ? 34 : 27, fontWeight: 600, color: SHARE_COLORS.ink }}>
        {name}
      </span>
      {dayMaster ? (
        <span
          style={{
            display: "flex",
            fontSize: large ? 16 : 14,
            letterSpacing: 2,
            color: SHARE_COLORS.faint,
            textTransform: "uppercase",
          }}
        >
          {dayMaster} Day Master
        </span>
      ) : null}
    </div>
  );
}

/**
 * Renders the compatibility share card at the given size. Pure given its
 * inputs (no DB/network access) — callers load the data first (see
 * `./compat-data.ts`) so this stays a plain, cheap-to-reason-about renderer.
 */
export function renderCompatibilityCard(data: CompatCardData, sizeKey: ShareSizeKey = "og") {
  const { width, height } = SHARE_SIZES[sizeKey];
  const isStory = sizeKey === "story";
  const accent = toneColor(data.score);
  const nameA = truncate(data.nameA || "You", 20);
  const nameB = truncate(data.nameB || "Them", 20);
  const verdict = truncate(data.verdict || "A compatibility reading, calculated not guessed.", isStory ? 58 : 74);
  const score = Math.max(0, Math.min(100, Math.round(data.score)));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: SHARE_COLORS.lacquer,
          backgroundImage: `linear-gradient(160deg, ${SHARE_COLORS.raised} 0%, ${SHARE_COLORS.lacquer} 55%, ${SHARE_COLORS.lacquerDeep} 100%)`,
          padding: isStory ? "76px 68px" : "60px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            flex: 1,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: `1px solid ${SHARE_COLORS.hairlineGold}`,
            borderRadius: 8,
            padding: isStory ? "52px 44px" : "44px 52px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  width: 46,
                  height: 46,
                  borderRadius: 999,
                  border: `2px solid ${SHARE_COLORS.gold}`,
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 600,
                  color: SHARE_COLORS.gold,
                }}
              >
                C
              </div>
              <span style={{ display: "flex", fontSize: 24, letterSpacing: 6, color: SHARE_COLORS.gold, textTransform: "uppercase" }}>
                Cinnabar
              </span>
            </div>
            <span
              style={{
                display: "flex",
                fontSize: 15,
                letterSpacing: 3,
                color: SHARE_COLORS.faint,
                textTransform: "uppercase",
              }}
            >
              Compatibility Reading
            </span>
          </div>

          {/* Body — flex:1 + centered so it fills the middle space evenly
              instead of leaving dead gaps (a 3-child space-between column
              looks fine at 630px tall but leaves huge empty bands at the
              1920px story height). */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: isStory ? 56 : 36 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: isStory ? "column" : "row",
                  alignItems: isStory ? "flex-start" : "center",
                  gap: isStory ? 40 : 44,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: isStory ? 220 : 152,
                    height: isStory ? 220 : 152,
                    backgroundColor: accent,
                    color: SHARE_COLORS.lacquerDeep,
                    fontSize: isStory ? 92 : 62,
                    fontWeight: 700,
                    transform: "rotate(-4deg)",
                    borderRadius: 14,
                  }}
                >
                  {score}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: isStory ? 820 : 600 }}>
                  <span
                    style={{
                      display: "flex",
                      fontSize: isStory ? 18 : 15,
                      letterSpacing: 3,
                      color: SHARE_COLORS.faint,
                      textTransform: "uppercase",
                    }}
                  >
                    Compatibility Score
                  </span>
                  <span
                    style={{
                      display: "flex",
                      fontSize: isStory ? 56 : 40,
                      fontWeight: 300,
                      color: SHARE_COLORS.ink,
                      lineHeight: 1.18,
                    }}
                  >
                    {verdict}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: isStory ? 26 : 22 }}>
                <PersonChip name={nameA} dayMaster={data.dayMasterLabelA} large={isStory} />
                <span style={{ display: "flex", fontSize: isStory ? 32 : 26, color: SHARE_COLORS.faint }}>×</span>
                <PersonChip name={nameB} dayMaster={data.dayMasterLabelB} large={isStory} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ display: "flex", fontSize: 15, letterSpacing: 2, color: SHARE_COLORS.muted }}>
              Calculated, not guessed.
            </span>
            <span style={{ display: "flex", fontSize: 15, letterSpacing: 2, color: SHARE_COLORS.faint }}>
              cinnabar.app/match
            </span>
          </div>
        </div>
      </div>
    ),
    { width, height }
  );
}
