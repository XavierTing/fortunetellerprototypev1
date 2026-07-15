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
 * T6 shipped "compatibility"; T7 (this task) adds "reading" (natal) and
 * "daily" as two more `renderXCard(data, sizeKey)` exports, following the
 * exact seam T6's file header predicted — no changes to the sizing/color/
 * route plumbing below, and no changes to `renderCompatibilityCard` itself.
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
import { ELEMENTS, ELEMENT_LABEL } from "@/lib/interpreter/five-elements";
import type { ElementRelation } from "@/lib/interpreter/five-elements";
import type { Element } from "@/lib/interpreter/types";

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

// ---------------------------------------------------------------------------
// Natal reading card (PRD §5.2's acceptance: "Each card renders a shareable
// image" — this is the reading-as-a-whole card: Day Master + element
// balance + one line, the same "day master + element balance + one line"
// brief this task was scoped to, not a per-card image).
// ---------------------------------------------------------------------------

const STRENGTH_LABEL: Record<"strong" | "weak" | "balanced", string> = {
  strong: "Strong",
  weak: "Weak",
  balanced: "Balanced",
};

/** Short Latin abbreviations standing in for each element in the colored monogram box — see file header on why hanzi/pinyin stay out of this raster. */
const ELEMENT_ABBR: Record<Element, string> = {
  wood: "WD",
  fire: "FI",
  earth: "EA",
  metal: "ME",
  water: "WA",
};

export interface ReadingCardData {
  /** Display name — empty string renders the generic "Your Day Master" framing. */
  name: string;
  dayMasterElement: Element;
  dayMasterElementLabel: string;
  dayMasterStrength: "strong" | "weak" | "balanced";
  zodiac: string;
  elements: Record<Element, number>;
  favorableElements: Element[];
  /** One line pulled from the reading's opening card (or a generic fallback) — the "+ one line" in this task's brief. */
  tagline: string;
}

/**
 * Renders the natal-reading share card: a Day-Master monogram, the
 * five-element balance as the same quiet bar motif `element-balance.tsx`
 * uses in-app, and one headline line from the reading. Pure given its
 * inputs — see `./reading-data.ts` for the loader.
 */
export function renderReadingCard(data: ReadingCardData, sizeKey: ShareSizeKey = "og") {
  const { width, height } = SHARE_SIZES[sizeKey];
  const isStory = sizeKey === "story";
  const name = truncate(data.name || "Your", 24);
  const tagline = truncate(data.tagline || "A chart-grounded reading, calculated not guessed.", isStory ? 92 : 108);
  const maxCount = Math.max(...ELEMENTS.map((el) => data.elements[el] ?? 0), 1);

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
              Natal Reading
            </span>
          </div>

          {/* Body */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: isStory ? 52 : 34 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: isStory ? "column" : "row",
                  alignItems: isStory ? "flex-start" : "center",
                  gap: isStory ? 36 : 44,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: isStory ? 200 : 140,
                    height: isStory ? 200 : 140,
                    backgroundColor: SHARE_COLORS.cinnabar,
                    color: SHARE_COLORS.lacquerDeep,
                    fontSize: isStory ? 52 : 38,
                    fontWeight: 700,
                    transform: "rotate(-4deg)",
                    borderRadius: 14,
                  }}
                >
                  {ELEMENT_ABBR[data.dayMasterElement]}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: isStory ? 820 : 620 }}>
                  <span
                    style={{
                      display: "flex",
                      fontSize: isStory ? 18 : 15,
                      letterSpacing: 3,
                      color: SHARE_COLORS.faint,
                      textTransform: "uppercase",
                    }}
                  >
                    {name}&rsquo;s Day Master
                  </span>
                  <span style={{ display: "flex", fontSize: isStory ? 46 : 33, fontWeight: 300, color: SHARE_COLORS.ink, lineHeight: 1.2 }}>
                    {data.dayMasterElementLabel} · {STRENGTH_LABEL[data.dayMasterStrength]}
                  </span>
                  <span style={{ display: "flex", fontSize: isStory ? 22 : 17, color: SHARE_COLORS.muted, lineHeight: 1.45 }}>
                    {tagline}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: isStory ? 16 : 10 }}>
                {ELEMENTS.map((el) => {
                  const count = data.elements[el] ?? 0;
                  const pct = Math.max(Math.round((count / maxCount) * 100), count > 0 ? 8 : 0);
                  const isDayMaster = el === data.dayMasterElement;
                  const isFavorable = data.favorableElements.includes(el);
                  const barColor = isDayMaster ? SHARE_COLORS.cinnabar : isFavorable ? SHARE_COLORS.jade : SHARE_COLORS.gold;
                  return (
                    <div key={el} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ display: "flex", width: isStory ? 96 : 78, fontSize: isStory ? 16 : 13, color: SHARE_COLORS.muted }}>
                        {ELEMENT_LABEL[el]}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          flex: 1,
                          height: isStory ? 12 : 9,
                          borderRadius: 999,
                          backgroundColor: "rgba(255,255,255,0.08)",
                        }}
                      >
                        <div style={{ display: "flex", width: `${pct}%`, borderRadius: 999, backgroundColor: barColor }} />
                      </div>
                      <span
                        style={{
                          display: "flex",
                          width: 20,
                          justifyContent: "flex-end",
                          fontSize: isStory ? 15 : 12,
                          color: SHARE_COLORS.faint,
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ display: "flex", fontSize: 15, letterSpacing: 2, color: SHARE_COLORS.muted }}>
              Calculated, not guessed.
            </span>
            <span style={{ display: "flex", fontSize: 15, letterSpacing: 2, color: SHARE_COLORS.faint }}>
              cinnabar.app/reading
            </span>
          </div>
        </div>
      </div>
    ),
    { width, height }
  );
}

// ---------------------------------------------------------------------------
// Daily fortune card (PRD §5.4's acceptance: "Card is share-native").
// ---------------------------------------------------------------------------

/** Same tone mapping as `today/daily-card.tsx`'s DAY_MASTER_RELATION_TAG, restated in hex for the raster. */
const RELATION_ACCENT: Record<ElementRelation, string> = {
  same: SHARE_COLORS.faint,
  generates: SHARE_COLORS.gold,
  "generated-by": SHARE_COLORS.jade,
  controls: SHARE_COLORS.gold,
  "controlled-by": SHARE_COLORS.cinnabar,
};

export interface DailyCardData {
  /** Display name — empty string renders the generic "Today" framing. */
  name: string;
  /** "YYYY-MM-DD" civil date this fortune is cast for. */
  date: string;
  stemElementLabel: string;
  branchElementLabel: string;
  branchAnimal: string;
  dayMasterRelation: ElementRelation;
  headline: string;
  energy: string;
  leanInto: string;
  goEasyOn: string;
}

function formatShareDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/**
 * Renders the daily-fortune share card. Deliberately avoids the raw 干支
 * hanzi (see file header) — the day is identified by its zodiac animal
 * (Latin, uppercased short form) and its element pairing in English
 * instead, mirroring `today/daily-card.tsx`'s own subtitle line.
 */
export function renderDailyCard(data: DailyCardData, sizeKey: ShareSizeKey = "og") {
  const { width, height } = SHARE_SIZES[sizeKey];
  const isStory = sizeKey === "story";
  const accent = RELATION_ACCENT[data.dayMasterRelation];
  const name = truncate(data.name || "Today", 24);
  const headline = truncate(data.headline || "A short, honest read of today's real energy.", isStory ? 74 : 90);
  const energy = data.energy ? truncate(data.energy, isStory ? 92 : 120) : "";
  const animalTag = (data.branchAnimal || "—").slice(0, 3).toUpperCase();

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
              Daily Fortune
            </span>
          </div>

          {/* Body */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: isStory ? 48 : 32 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: isStory ? "column" : "row",
                  alignItems: isStory ? "flex-start" : "center",
                  gap: isStory ? 36 : 44,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: isStory ? 200 : 140,
                    height: isStory ? 200 : 140,
                    backgroundColor: accent,
                    color: SHARE_COLORS.lacquerDeep,
                    fontSize: isStory ? 40 : 30,
                    fontWeight: 700,
                    transform: "rotate(-4deg)",
                    borderRadius: 14,
                  }}
                >
                  {animalTag}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: isStory ? 820 : 620 }}>
                  <span
                    style={{
                      display: "flex",
                      fontSize: isStory ? 18 : 15,
                      letterSpacing: 3,
                      color: SHARE_COLORS.faint,
                      textTransform: "uppercase",
                    }}
                  >
                    {name} · {formatShareDate(data.date)} · {data.stemElementLabel} over {data.branchElementLabel}
                  </span>
                  <span style={{ display: "flex", fontSize: isStory ? 42 : 30, fontWeight: 300, color: SHARE_COLORS.ink, lineHeight: 1.22 }}>
                    {headline}
                  </span>
                  {energy ? (
                    <span style={{ display: "flex", fontSize: isStory ? 20 : 16, color: SHARE_COLORS.muted, lineHeight: 1.45 }}>
                      {energy}
                    </span>
                  ) : null}
                </div>
              </div>

              {(data.leanInto || data.goEasyOn) && (
                <div style={{ display: "flex", flexDirection: isStory ? "column" : "row", gap: isStory ? 24 : 40 }}>
                  {data.leanInto ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: isStory ? 820 : 360 }}>
                      <span style={{ display: "flex", fontSize: 14, letterSpacing: 2, color: SHARE_COLORS.jade, textTransform: "uppercase" }}>
                        Lean into
                      </span>
                      <span style={{ display: "flex", fontSize: isStory ? 18 : 15, color: SHARE_COLORS.text, lineHeight: 1.5 }}>
                        {truncate(data.leanInto, 90)}
                      </span>
                    </div>
                  ) : null}
                  {data.goEasyOn ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: isStory ? 820 : 360 }}>
                      <span
                        style={{ display: "flex", fontSize: 14, letterSpacing: 2, color: SHARE_COLORS.cinnabar, textTransform: "uppercase" }}
                      >
                        Go easy on
                      </span>
                      <span style={{ display: "flex", fontSize: isStory ? 18 : 15, color: SHARE_COLORS.text, lineHeight: 1.5 }}>
                        {truncate(data.goEasyOn, 90)}
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ display: "flex", fontSize: 15, letterSpacing: 2, color: SHARE_COLORS.muted }}>
              Calculated, not guessed.
            </span>
            <span style={{ display: "flex", fontSize: 15, letterSpacing: 2, color: SHARE_COLORS.faint }}>
              cinnabar.app/today
            </span>
          </div>
        </div>
      </div>
    ),
    { width, height }
  );
}
