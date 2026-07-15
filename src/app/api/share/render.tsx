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
 * T6 shipped "compatibility"; T7 added "reading" (natal) and "daily" as two
 * more `renderXCard(data, sizeKey)` exports. R1 (this task — see the 朱墨
 * design spec's "Reading as hanging scroll + seal share card" signature
 * moment) restyles all three as **seal-stamped rice paper**: a flat washi
 * ground, sumi ink text, a large light-weight title treatment standing in
 * for the app's Cormorant display face, and one solid cinnabar circle — the
 * Satori-safe reimplementation of `src/components/ui/seal.tsx`'s look —
 * carrying each card's one headline mark (the compatibility score, the day
 * master's Latin element abbreviation, the day's zodiac-animal tag). No
 * route/handler contract changed: same exported function names/signatures,
 * same `SHARE_SIZES` (1200×630 "og" + 1080×1920 "story"), same data-loader
 * seam.
 *
 * Color note: `ImageResponse` renders via Satori/resvg, which does NOT
 * understand `oklch()` — only hex/rgb/hsl. The hexes below are `globals.css`'s
 * `:root` washi-LIGHT block (the DEFAULT theme — a share image is a one-shot
 * raster with no theme toggle, so it always renders the light "washi" look)
 * converted once through the standard OKLCH → linear-sRGB → sRGB pipeline
 * (Björn Ottosson's reference formulas) and hand-checked:
 *
 *   token          oklch                    hex
 *   --paper        oklch(96.5% 0.006 90)    #f5f3ef
 *   --paper-deep   oklch(94%   0.007 88)    #edebe6
 *   --paper-sink   oklch(92%   0.008 88)    #e7e4df
 *   --ink          oklch(22%   0.012 60)    #1f1915
 *   --ink-soft     oklch(38%   0.011 60)    #47413d
 *   --muted        oklch(50%   0.009 60)    #67625e
 *   --faint        oklch(54%   0.007 60)    #726e6b
 *   --cinnabar     oklch(52%   0.19  33)    #bd2703
 *   --cinnabar-deep oklch(46%  0.17  32)    #a11d05
 *
 * (`--hairline` is `--ink` at 12% alpha — `rgba(31, 25, 21, 0.12)` — same
 * formula `globals.css` uses, restated as rgba since Satori has no CSS
 * custom properties either. Conversion script: `scratchpad/oklch2hex.mjs`,
 * a small Node implementation of the standard OKLab round-trip — same
 * script T6 used for the previous dark-theme palette.)
 *
 * Font note: this deliberately does NOT pass a custom `fonts` array to
 * `ImageResponse` — same constraint as before. The app's real display/body
 * faces (Cormorant Garamond, Ma Shan Zheng, Hanken Grotesk) are loaded via
 * `next/font/google`, which self-hosts them into Next's build cache rather
 * than leaving a plain .ttf/.otf file on disk this route could `readFile()`,
 * and satori's bundled default font has no CJK glyph coverage — so Chinese
 * characters stay OUT of this raster (a Latin monogram "C" stands in for
 * the brand mark, and short Latin abbreviations stand in for each element/
 * animal, same discipline as before) and the "brush/serif title" the design
 * spec asks for is expressed as a styling treatment on Satori's default
 * font (light weight, large size, generous tracking) rather than a literal
 * embedded typeface. A follow-up could vendor real Latin .ttf files under
 * `public/fonts/` and pass them via the `fonts` option for exact on-brand
 * typography.
 */
import type { CSSProperties } from "react";
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

/** Hex/rgba equivalents of the DESIGN.md washi-light OKLCH tokens — see file header. */
export const SHARE_COLORS = {
  paper: "#f5f3ef",
  paperDeep: "#edebe6",
  paperSink: "#e7e4df",
  ink: "#1f1915",
  inkSoft: "#47413d",
  muted: "#67625e",
  faint: "#726e6b",
  cinnabar: "#bd2703",
  cinnabarDeep: "#a11d05",
  hairline: "rgba(31, 25, 21, 0.12)",
} as const;

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

// ---------------------------------------------------------------------------
// Shared "seal-stamped rice paper" chrome — the flat washi ground, the
// bordered paper-deep panel (Satori-safe restatement of `Card`'s look), the
// brand row, and the cinnabar seal mark reused by all three card renderers
// below so the three surfaces read as one system rather than three
// independent one-off layouts.
// ---------------------------------------------------------------------------

function outerStyle(isStory: boolean): CSSProperties {
  return {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    backgroundColor: SHARE_COLORS.paper,
    padding: isStory ? "76px 68px" : "60px 72px",
    fontFamily: "sans-serif",
  };
}

function panelStyle(isStory: boolean): CSSProperties {
  return {
    flex: 1,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    backgroundColor: SHARE_COLORS.paperDeep,
    border: `1px solid ${SHARE_COLORS.hairline}`,
    borderRadius: 12,
    padding: isStory ? "52px 44px" : "44px 52px",
  };
}

/** The header row: a small solid-cinnabar "seal" monogram + the wordmark, plus one right-aligned section label — the one place each card names itself. */
function BrandRow({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            display: "flex",
            width: 42,
            height: 42,
            borderRadius: 999,
            backgroundColor: SHARE_COLORS.cinnabar,
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 600,
            color: SHARE_COLORS.paper,
          }}
        >
          C
        </div>
        <span
          style={{
            display: "flex",
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: 5,
            color: SHARE_COLORS.ink,
            textTransform: "uppercase",
          }}
        >
          Cinnabar
        </span>
      </div>
      <span
        style={{
          display: "flex",
          fontSize: 14,
          letterSpacing: 3,
          color: SHARE_COLORS.faint,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/** The footer row: quiet tagline + the path this card was cast from. */
function FooterRow({ path }: { path: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ display: "flex", fontSize: 15, letterSpacing: 2, color: SHARE_COLORS.muted }}>
        Calculated, not guessed.
      </span>
      <span style={{ display: "flex", fontSize: 15, letterSpacing: 2, color: SHARE_COLORS.faint }}>
        cinnabar.app/{path}
      </span>
    </div>
  );
}

/**
 * SealMark — the one filled-cinnabar circle each card carries: the Satori-
 * safe restatement of `src/components/ui/seal.tsx`'s look (a real Tailwind
 * component can't be reused here — Satori reads inline styles only, never
 * CSS classes/custom properties). A faint rotation is deliberate: a hanko
 * stamped by hand never lands perfectly square.
 */
function SealMark({ size, fontSize, children }: { size: number; fontSize: number; children: string | number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: 999,
        backgroundColor: SHARE_COLORS.cinnabar,
        border: `3px solid ${SHARE_COLORS.cinnabarDeep}`,
        color: SHARE_COLORS.paper,
        fontSize,
        fontWeight: 700,
        transform: "rotate(-4deg)",
      }}
    >
      {children}
    </div>
  );
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

export interface CompatCardData {
  nameA: string;
  nameB: string;
  /** Display element label, e.g. "Wood" — empty string renders no tag. */
  dayMasterLabelA: string;
  dayMasterLabelB: string;
  score: number;
  verdict: string;
}

/**
 * Renders the compatibility share card at the given size. Pure given its
 * inputs (no DB/network access) — callers load the data first (see
 * `./compat-data.ts`) so this stays a plain, cheap-to-reason-about renderer.
 */
export function renderCompatibilityCard(data: CompatCardData, sizeKey: ShareSizeKey = "og") {
  const { width, height } = SHARE_SIZES[sizeKey];
  const isStory = sizeKey === "story";
  const nameA = truncate(data.nameA || "You", 20);
  const nameB = truncate(data.nameB || "Them", 20);
  const verdict = truncate(data.verdict || "A compatibility reading, calculated not guessed.", isStory ? 58 : 74);
  const score = Math.max(0, Math.min(100, Math.round(data.score)));

  return new ImageResponse(
    (
      <div style={outerStyle(isStory)}>
        <div style={panelStyle(isStory)}>
          <BrandRow label="Compatibility Reading" />

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
                <SealMark size={isStory ? 200 : 140} fontSize={isStory ? 76 : 54}>
                  {score}
                </SealMark>
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
                      fontSize: isStory ? 54 : 38,
                      fontWeight: 300,
                      color: SHARE_COLORS.ink,
                      lineHeight: 1.2,
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

          <FooterRow path="match" />
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

/** Short Latin abbreviations standing in for each element in the seal mark — see file header on why hanzi/pinyin stay out of this raster. */
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
 * Renders the natal-reading share card: a Day-Master seal, the five-element
 * balance as a quiet bar motif echoing `element-balance.tsx`'s ink/cinnabar
 * split (one accent, everything else ink — enso rings don't translate
 * cleanly to a 140px-tall raster row, so the bars stay the simpler stand-in
 * here), and one headline line from the reading. Pure given its inputs —
 * see `./reading-data.ts` for the loader.
 */
export function renderReadingCard(data: ReadingCardData, sizeKey: ShareSizeKey = "og") {
  const { width, height } = SHARE_SIZES[sizeKey];
  const isStory = sizeKey === "story";
  const name = truncate(data.name || "Your", 24);
  const tagline = truncate(data.tagline || "A chart-grounded reading, calculated not guessed.", isStory ? 92 : 108);
  const maxCount = Math.max(...ELEMENTS.map((el) => data.elements[el] ?? 0), 1);

  return new ImageResponse(
    (
      <div style={outerStyle(isStory)}>
        <div style={panelStyle(isStory)}>
          <BrandRow label="Natal Reading" />

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
                <SealMark size={isStory ? 188 : 132} fontSize={isStory ? 46 : 34}>
                  {ELEMENT_ABBR[data.dayMasterElement]}
                </SealMark>
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
                  <span
                    style={{ display: "flex", fontSize: isStory ? 46 : 33, fontWeight: 300, color: SHARE_COLORS.ink, lineHeight: 1.2 }}
                  >
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
                  const barColor = isDayMaster ? SHARE_COLORS.cinnabar : SHARE_COLORS.inkSoft;
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
                          backgroundColor: SHARE_COLORS.paperSink,
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

          <FooterRow path="reading" />
        </div>
      </div>
    ),
    { width, height }
  );
}

// ---------------------------------------------------------------------------
// Daily fortune card (PRD §5.4's acceptance: "Card is share-native").
// ---------------------------------------------------------------------------

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
 * (Latin, uppercased short form) inside the seal mark and its element
 * pairing in English instead, mirroring `today/daily-card.tsx`'s own
 * subtitle line. The seal stays solid cinnabar regardless of
 * `dayMasterRelation` (a prior version tinted it per-relation across gold/
 * jade/cinnabar — a small rainbow the One-Accent Rule retires; the day's
 * relation to the Day Master is legible from the headline/energy copy
 * itself, it doesn't need a second accent hue to carry it).
 */
export function renderDailyCard(data: DailyCardData, sizeKey: ShareSizeKey = "og") {
  const { width, height } = SHARE_SIZES[sizeKey];
  const isStory = sizeKey === "story";
  const name = truncate(data.name || "Today", 24);
  const headline = truncate(data.headline || "A short, honest read of today's real energy.", isStory ? 74 : 90);
  const energy = data.energy ? truncate(data.energy, isStory ? 92 : 120) : "";
  const animalTag = (data.branchAnimal || "—").slice(0, 3).toUpperCase();

  return new ImageResponse(
    (
      <div style={outerStyle(isStory)}>
        <div style={panelStyle(isStory)}>
          <BrandRow label="Daily Fortune" />

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
                <SealMark size={isStory ? 188 : 132} fontSize={isStory ? 36 : 27}>
                  {animalTag}
                </SealMark>
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
                      <span style={{ display: "flex", fontSize: 14, letterSpacing: 2, color: SHARE_COLORS.ink, textTransform: "uppercase" }}>
                        Lean into
                      </span>
                      <span style={{ display: "flex", fontSize: isStory ? 18 : 15, color: SHARE_COLORS.inkSoft, lineHeight: 1.5 }}>
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
                      <span style={{ display: "flex", fontSize: isStory ? 18 : 15, color: SHARE_COLORS.inkSoft, lineHeight: 1.5 }}>
                        {truncate(data.goEasyOn, 90)}
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <FooterRow path="today" />
        </div>
      </div>
    ),
    { width, height }
  );
}

// ---------------------------------------------------------------------------
// Branded fallback data (FIX-report.md item 2): a single source of truth for
// "nothing's been generated for this id yet" — used by BOTH the generic
// `/api/share/[type]/[id]` route and each feature's `opengraph-image.tsx`
// file-convention hook, so a stale/unvisited/not-yet-generated id always
// renders this on-brand card instead of a 404 or a broken-image icon, and
// so the two integration points stay byte-identical (this file's header's
// own stated goal). Deliberately generic/non-personal copy — these are
// rendered on a public, sessionless path with no chart or reading to draw
// from (that's the whole point: reaching this data means nothing is
// persisted for `id` yet, so nothing here may come from a fresh LLM call).
// ---------------------------------------------------------------------------

export const READING_CARD_FALLBACK: ReadingCardData = {
  name: "",
  dayMasterElement: "wood",
  dayMasterElementLabel: "",
  dayMasterStrength: "balanced",
  zodiac: "",
  elements: { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 },
  favorableElements: [],
  tagline: "A chart-grounded natal reading — calculated, not guessed.",
};

export const COMPAT_CARD_FALLBACK: CompatCardData = {
  nameA: "Cinnabar",
  nameB: "",
  dayMasterLabelA: "",
  dayMasterLabelB: "",
  score: 0,
  verdict: "A relationship reading between two charts.",
};

/** A function (not a constant) so `date` reflects "today" per-request rather than freezing at module load in a long-running server process. */
export function dailyCardFallback(): DailyCardData {
  return {
    name: "",
    date: new Date().toISOString().slice(0, 10),
    stemElementLabel: "",
    branchElementLabel: "",
    branchAnimal: "",
    dayMasterRelation: "same",
    headline: "A short, honest daily fortune tied to your own chart.",
    energy: "",
    leanInto: "",
    goEasyOn: "",
  };
}
