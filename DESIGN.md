---
name: 朱墨 — Cinnabar & Ink
description: "Near-white washi paper, warm sumi ink, one vermilion cinnabar seal. A reading should feel like receiving a hand-brushed scroll, not opening an app. Light washi is the default; a calm, warm 'night ink' dark mode is a fully committed, equal alternate."

# All values below mirror src/app/globals.css verbatim. That file is the
# source of truth; this frontmatter is the portable export. If a token
# changes there, update both. Colors are OKLCH directly (project doctrine:
# OKLCH-only, tinted neutrals) — accept the Stitch hex-linter warning
# rather than splitting the source of truth into a second hex copy.
colors:
  # The one accent — used like a hanko seal
  cinnabar: "oklch(52% 0.19 33)" # the ONLY accent — seal mark, one primary CTA, active state, focus ring
  cinnabar-deep: "oklch(46% 0.17 32)" # hover/active/pressed cinnabar

  # Washi surfaces (light, default theme)
  paper: "oklch(96.5% 0.006 90)" # ground — warm rice paper, low chroma so it reads considered, not AI-cream
  paper-deep: "oklch(94% 0.007 88)" # raised/panel surfaces — cards
  paper-sink: "oklch(92% 0.008 88)" # insets — input fields, wells

  # Sumi ink ramp (light)
  ink: "oklch(22% 0.012 60)" # headlines, brightest/darkest text — warm sumi near-black, never pure #000
  ink-soft: "oklch(38% 0.011 60)" # body copy
  muted: "oklch(50% 0.009 60)" # captions, meta
  faint: "oklch(54% 0.007 60)" # subdued labels, disabled — see the Faint-Clears-AA rule below

  hairline: "oklch(22% 0.012 60 / 0.12)" # default border/divider
  glow-cinnabar: "oklch(52% 0.19 33 / 0.05)" # one ambient hero moment, not a reusable surface

  # "Night ink" — committed, non-default dark mode. Retuned to be calm
  # (brightened text, warmed ground), never gloomy.
  dark-paper: "oklch(16% 0.006 60)"
  dark-paper-deep: "oklch(20% 0.007 60)"
  dark-paper-sink: "oklch(12% 0.006 60)"
  dark-ink: "oklch(90% 0.006 85)"
  dark-ink-soft: "oklch(78% 0.008 80)"
  dark-muted: "oklch(64% 0.008 75)"
  dark-faint: "oklch(58% 0.007 70)"
  dark-cinnabar: "oklch(64% 0.19 33)" # brightened for the dark ground
  dark-cinnabar-deep: "oklch(58% 0.18 32)"
  dark-hairline: "oklch(90% 0.006 85 / 0.14)"
  dark-glow-cinnabar: "oklch(64% 0.19 33 / 0.12)"

typography:
  wordmark:
    fontFamily: "Cormorant Garamond, Iowan Old Style, Georgia, serif"
    fontSize: "1.4rem"
    fontWeight: 500
    letterSpacing: "0.02em"
    lineHeight: 1
  display:
    fontFamily: "Cormorant Garamond, Iowan Old Style, Georgia, serif"
    fontSize: "clamp(2.5rem, 5.6vw, 4.5rem)"
    fontWeight: 300
    letterSpacing: "-0.015em"
    lineHeight: 1.15
  headline:
    fontFamily: "Cormorant Garamond, Iowan Old Style, Georgia, serif"
    fontSize: "clamp(1.9rem, 3.2vw, 2.75rem)"
    fontWeight: 500
    letterSpacing: "-0.01em"
    lineHeight: 1.1
  body:
    fontFamily: "Hanken Grotesk, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 400
    lineHeight: 1.8
  control:
    fontFamily: "Hanken Grotesk, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.92rem"
    fontWeight: 500
    description: "Button/input control text (Button md, Field/Input) — its own small ramp step, distinct from body copy."
  control-sm:
    fontFamily: "Hanken Grotesk, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 500
    description: "Button sm control text."
  label:
    fontFamily: "Hanken Grotesk, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 600
    letterSpacing: "0.14em"
  eyebrow:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.7rem"
    fontWeight: 500
    letterSpacing: "0.22em"
  cjk-anchor:
    fontFamily: "Noto Serif SC, Songti SC, STSong, serif"
    description: "Chinese glyph anchors (八字, 命, 五行, 干支, 木火土金水) set beside their English gloss — real semantic anchors, not decoration."
  brush:
    fontFamily: "Ma Shan Zheng, Noto Serif SC, serif"
    description: "ONE dramatic hand-brushed character per key screen (命 on the hero). Used very sparingly — not a body or heading face."

rounded:
  pill: "999px"
  card: "12px"
  input: "8px"
  mark: "7px"

spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "32px"
  xl: "80px"
  "2xl": "128px"

components:
  button-primary:
    backgroundColor: "{colors.cinnabar}"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.cinnabar-deep}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "44px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "44px"
  card:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.ink-soft}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.card}"
    padding: "32px"
  input-text:
    backgroundColor: "{colors.paper-sink}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.input}"
    padding: "0 14px"
    height: "44px"
  seal:
    backgroundColor: "{colors.cinnabar}"
    textColor: "{colors.paper}"
    typography: "{typography.display}"
    rounded: "{rounded.mark} or 999px (circle)"
    description: "The one filled-cinnabar shape in the kit — brand mark, hero stamp, share-card mark. Don't add a second filled accent shape elsewhere; reuse Seal."
  badge:
    backgroundColor: "transparent"
    textColor: "{colors.cinnabar}"
    borderColor: "{colors.cinnabar}/40"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  nav-link:
    textColor: "{colors.faint}"
    typography: "{typography.label}"
  nav-link-active:
    textColor: "{colors.cinnabar}"
    typography: "{typography.label}"
---

# Design System: 朱墨 — Cinnabar & Ink

## 1. Overview

**Creative North Star: "A hand-brushed scroll, not an app."**

朱墨 (zhū mò — "cinnabar and ink") reads as a sheet of washi rice paper set in front of the reader: near-white, faintly warm, never sterile-white or AI-cream. Sumi ink carries every word. One vermilion cinnabar seal — the brand's own color, 朱砂 — is stamped exactly where it matters: the primary action, the brand mark, an active state. Everything else stays quiet. Consulting a chart should feel like watching a scroll unroll, not like operating a dashboard — restraint and whitespace are the entire point; the system actively resists decoration.

This supersedes the "Lacquer, Gold, and Cinnabar" dark-lacquer-default system (see git history / `.build-reports/` for that era). **Light "washi" is now the default** — the previous system's "anti-cream" rule is retired along with it, because the failure mode it was guarding against (a flat cream/sand/parchment ground with no other design conviction) isn't this system: washi is low-chroma, warm-but-restrained, and paired with a real ink ramp, a single disciplined accent, and generous whitespace, not "cozy zine" filler. A calm, warm "night ink" dark mode remains fully committed as the alternate, not a token gesture — see the Calm-Not-Gloomy Rule below.

It still rejects the wider AI-tool visual grammar this product has always avoided: purple-galaxy gradients, glowing crystal-ball clichés, glassmorphism-as-default, neon-on-black, gradient text, side-stripe card borders, identical same-sized card grids — and the Chinese-incumbent-app clutter this product's market research flagged (dense grids, fear-forward copy, no onboarding for a first-time reader).

**Key characteristics:**
- Warm, near-white washi ground (default) with a fully committed, equally polished "night ink" dark mode — not an afterthought either direction.
- **One accent, used like a hanko.** Cinnabar is the only color in the system besides ink and paper. It marks the seal, the one primary CTA, active state, at most one hairline — never a wash, never decoration.
- A classical serif display face (Cormorant Garamond) paired against a humanist grotesque body face (Hanken Grotesk) — a real contrast axis — plus two Chinese type layers used as real content, not ornament: Noto Serif SC for glyph anchors (八字, 命, 五行) set beside their English gloss, and Ma Shan Zheng, a hand-brushed script reserved for exactly one dramatic character per key screen.
- Hairline-first, flat surfaces, generous padding; small radii on cards, full pills on buttons and tags, a small-radius-or-circle stamp on the Seal.
- Extreme whitespace, a narrow contemplative measure for body copy (~34rem), and slow, ease-out-only motion — "leave the white alone."

## 2. Colors

The palette is warm and low-chroma throughout — paper and ink both carry a trace of the same warm hue rather than defaulting to true gray or true white.

### The one accent
- **Cinnabar** (`oklch(52% 0.19 33)`, night ink `oklch(64% 0.19 33)`): The brand's own signature color (朱砂, the product's namesake) and the only accent in the system. Carries identity and the one primary action: the seal mark, the primary CTA fill, active nav state, the focus ring, at most one hairline per view. Where the old system split identity (cinnabar) from action (gold), 朱墨 collapses both into cinnabar — see the One-Accent Rule below.

### Washi surfaces (light, default)
- **Paper** (`oklch(96.5% 0.006 90)`): Page ground. Warm rice paper, low chroma — considered, not AI-cream.
- **Paper Deep** (`oklch(94% 0.007 88)`): Raised/panel surfaces — cards.
- **Paper Sink** (`oklch(92% 0.008 88)`): Insets — input fields, wells.

### Sumi ink ramp (light)
- **Ink** (`oklch(22% 0.012 60)`) / **Ink Soft** (`oklch(38% 0.011 60)`) / **Muted** (`oklch(50% 0.009 60)`) / **Faint** (`oklch(54% 0.007 60)`): Headline to subdued/disabled. Warm sumi near-black at the dark end, never pure `#000`.
- **Hairline** (`oklch(22% 0.012 60 / 0.12)`): The one border/divider treatment — see the Hairline-First Rule.

### "Night ink" — dark, non-default
Inverted, not merely lightness-flipped: ground `oklch(16% 0.006 60)` (warm sumi-black, never pure black), paper-deep `oklch(20% 0.007 60)` (raised — lighter than ground, standard dark-mode elevation), paper-sink `oklch(12% 0.006 60)` (insets — darker than ground), ink `oklch(90% 0.006 85)` (brightened so text reads calm rather than dim), cinnabar brightened to `oklch(64% 0.19 33)` for the dark ground. Same token names as light; see globals.css for the full retuned block.

### Named Rules

**The One-Accent Rule.** Cinnabar is the only accent in the system. It is used like a hanko seal — sparingly: the `Seal` component's fill, one primary CTA per view, active nav state, the focus ring, at most one hairline. Everything else is ink on paper. If an element needs emphasis and isn't one of those roles, reach for a heavier ink weight or `ink`/`ink-soft`, not a second accent color.

**The Calm-Not-Gloomy Rule.** Night ink is a fully committed, equally polished alternate theme, not a same-page-toggle afterthought. Its text ramp is brightened (not just inverted) and its ground is warmed (never a cool near-black) so reading in the dark theme feels calm, not dim or gloomy.

**The Faint-Clears-AA Rule.** Every ink/muted/faint-on-paper pairing is checked with real WCAG contrast math (OKLCH → linear sRGB → relative luminance), not eyeballed. `--faint` is tuned a few points darker (light: 54%, not the initial 62% sketch) / lighter (dark: 58%) than a naive first guess specifically so it still clears 4.5:1 where components render it as real small text — nav labels, footer links, field labels — rather than treating "faint" as a decorative-only tier exempt from AA. Body clears 4.5:1, large text/fills clear 3:1, in both themes.

**The Legacy-Alias Rule.** The out-of-scope feature routes (`/reading`, `/master`, `/today`, `/match`, `/me`, `/why`) still reference the previous system's token names (`--gold`, `--lacquer`, `--jade`, `--graphite`, `--raised`, `--hairline-gold`). Rather than break those references, `globals.css` aliases each to a sensible 朱墨 value instead of deleting it: `gold`/`gold-rich`/`gold-pale` → `cinnabar`/`cinnabar-deep`, `jade` → `ink-soft`, `lacquer`/`lacquer-deep` → `paper`, `raised` → `paper-deep`, `graphite` → `paper-sink`, `hairline-gold` → `hairline`. Those routes reskin for free under the new palette; a later task gives them a dedicated 朱墨 pass (copy, spacing, motion) rather than just inherited color.

## 3. Typography

**Display Font:** Cormorant Garamond (with Iowan Old Style, Georgia, serif fallback)
**Body Font:** Hanken Grotesk (with the system UI sans stack as fallback)
**CJK Anchor Font:** Noto Serif SC — Chinese glyph anchors set large and quiet beside their English gloss
**Brush Font:** Ma Shan Zheng — one hand-brushed character per key screen, used very sparingly
**Label/Mono Font:** JetBrains Mono — dropped to near-zero on-screen at once; the one small tracked eyebrow label per page is its only real job now

**Character:** A classical high-contrast serif carrying the brand's quiet-authority moments against a clean, warm humanist grotesque for everything a reader actually has to parse quickly — plus two Chinese type layers used as real semantic content (bilingual anchors), never as decoration.

### Hierarchy
- **Wordmark** (weight 500, `1.4rem`, letter-spacing `0.02em`): the "Cinnabar" lockup in the header only.
- **Display** (weight 300, `clamp(2.5rem, 5.6vw, 4.5rem)`, line-height 1.15, letter-spacing `-0.015em`): the hero h1. Deliberately light and narrower than the old system's display step — 朱墨's hero copy sits in a ~34rem column, not a full-bleed banner.
- **Headline** (weight 500, `clamp(1.9rem, 3.2vw, 2.75rem)`, line-height 1.1): section h2s. Heavier than the hero on purpose — see the Weight-Inversion Rule.
- **Body** (weight 400, `1.05rem`, line-height 1.8): all copy, capped near a 34rem (prose) to 65ch (wider block) measure. Line-height raised from the old system's 1.7 to 1.8 — a slower, roomier read.
- **Control** (weight 500, `0.92rem`/`0.8rem` sm): Button and Field/Input control text — its own small ramp step, distinct from body copy (buttons and inputs are instruments, not prose).
- **Label** (weight 600, `0.68rem`, letter-spacing `0.14em`, uppercase): form field labels, tag/badge text.
- **Eyebrow** (weight 500, `0.7rem`, letter-spacing `0.22em`, uppercase, mono): the one small tracked marker per page — see the Eyebrow Restraint Rule.

### Named Rules

**The Two-Face Rule.** Cormorant Garamond is reserved for display sizes only: hero h1, section h2s, the wordmark. It never carries body copy, form labels, or UI chrome — Hanken Grotesk owns everything below display scale.

**The Bilingual-Anchor Rule.** A CJK glyph set in Noto Serif SC beside its English gloss (八字 · Four Pillars, 命, 五行, 干支, 木火土金水) is a real semantic anchor, not decoration — never wrap a Chinese character in the mono/eyebrow face (JetBrains Mono has no CJK coverage and will silently fall back) or the Cormorant display face (same problem); use `font-cjk` explicitly.

**The One-Brushstroke Rule.** Ma Shan Zheng appears at most once per screen — the hero's 命, a reading's day-master stem in a later task. It is not a heading face or a repeatable flourish; if a second moment wants brush character, it isn't earning the "one dramatic stroke" restraint this face exists for.

**The Weight-Inversion Rule.** The hero h1 sits at weight 300; section h2s sit at weight 500. The hero is light so the page can breathe on first impression; section anchors carry more weight to ground each block once the reader is past the hero. Don't flatten the two to the same weight.

**The Eyebrow Restraint Rule.** The mono eyebrow label appears at most once per page (the hero's "八字 · Four Pillars" marker). A tracked-caps kicker stamped above every section is 2023-era AI scaffolding; if a second section wants one, reach for a plain `<h2>` instead.

## 4. Elevation

The system is hairline-first and flat. Cards and panels are separated from their ground by a 1px border and a background-lightness step, not a shadow — depth reads as material layering (paper → paper-deep → paper-sink), not drop-shadow. The one exception is a single ambient glow behind the hero (`--glow-cinnabar`, a low-alpha cinnabar radial, off-center) — a page-specific moment, not a reusable elevation token.

### Named Rules

**The Hairline-First Rule.** Reach for a 1px `--hairline` border before reaching for a shadow. No card, panel, or button carries a default drop-shadow.

**The No-Nesting Rule.** A Card never contains another Card. Internal grouping inside a card is spacing and a hairline divider, not a second bordered box.

## 5. Components

### Buttons (`src/components/ui/button.tsx`)
- **Shape:** full pill (`rounded-full`, 999px) — small radii belong to cards, not buttons.
- **Primary:** the cinnabar seal fill — solid `cinnabar`, `paper` text (max-contrast pairing). One per view; this is the ONE filled-cinnabar button treatment (the `Seal` component is the other place cinnabar fills a shape — don't invent a third).
- **Secondary:** transparent fill, hairline or cinnabar/40 border (`tone` prop — `tone="gold"` is a legacy name that now means "quiet ink," `tone="cinnabar"` is the true accent option).
- **Ghost:** text-only, quiet paper-deep tint on hover.
- **Hover / Focus:** color-only transitions on `--ease` (ease-out-expo, 300ms — slower than the old system's 200ms, "slow ink" rather than a snappy UI reflex), no transform bounce; focus-visible ring is always cinnabar.

### Seal (`src/components/ui/seal.tsx`) — new in 朱墨
The cinnabar hanko-style stamp mark (印): a solid cinnabar circle or rounded-square, optionally wrapping one CJK/brush character. Used today for the brand mark in `SiteHeader`/`Footer`; a later task reuses it for the hero's "stamp on load" moment and the share-card seal — `globals.css` already ships an `animate-seal-stamp` keyframe (scale-in settle, no bounce) for that. This is deliberately the ONE place cinnabar is allowed to be a bold filled shape — reuse `Seal` rather than adding a second filled-accent surface anywhere else.

### Tags & Badges (`src/components/ui/badge.tsx`)
- **Shape:** full pill, hairline ring; only the `cinnabar` variant carries real accent color.
- **Badge** adds a small status dot; **Tag** omits it for non-live labels.
- **Legacy variants:** `gold` and `jade` are kept for prop-API compatibility with out-of-scope routes and now render as quiet `ink-soft` — don't read them as a second/third accent; only `cinnabar` is the accent.

### Cards / Tiles (`src/components/ui/card.tsx`)
- **Corner style:** 12px radius (`card` rounded token) — inside the 6-14px system-wide card range, never 24px+.
- **Background:** `paper-deep`.
- **Shadow strategy:** none by default — see Elevation.
- **Border:** 1px `hairline`. Never a side-stripe.
- **Internal padding:** 32px default (raised from the old system's 24px — 朱墨 leans into whitespace even inside a card), callers may override for a hero moment.

### Inputs / Fields (`src/components/ui/field.tsx`)
- **Style:** `paper-sink` fill (an inset, one step quieter than the `paper-deep` card it usually sits in), 1px hairline border, 8px radius.
- **Focus:** border shifts to cinnabar — no glow, no ring, matching the hairline-first material logic. Cinnabar's one legitimate non-CTA, non-seal use.
- **Label:** mono/label-scale, uppercase, tracked, `faint` color — forms read as precise instruments.

### Navigation (`src/components/nav.tsx`, `src/components/site-header.tsx`, `src/components/footer.tsx`)
- **Style:** persistent chrome sits on the same washi `paper` ground as the page — one hairline for separation, not a distinct "sealed panel" surface the way the old dark system's `lacquer-deep` inset was. Quiet chrome, not a second material.
- **Default state:** `faint` text/glyph.
- **Hover:** shifts to `ink-soft` (rail) with a `paper-deep` background tint.
- **Active:** `cinnabar` text, with a soft `cinnabar/12` fill on the desktop rail — the One-Accent Rule's "active state" bearer.
- **Header/Footer:** sticky/static on `paper` with backdrop-blur where scroll legibility calls for it (functional, not decorative glass); brand mark is a `Seal`.

### Eyebrow (`src/components/ui/eyebrow.tsx`) — signature component
Small tracked mono label, used at most once per page. It exists specifically so the temptation to stamp a kicker above every section has a named, restrained home instead of becoming default scaffolding — see the Eyebrow Restraint Rule.

## 6. Do's and Don'ts

### Do:
- **Do** keep washi light as the default body ground; ship "night ink" dark as a fully committed, equally polished alternate, not a token gesture (the Calm-Not-Gloomy Rule).
- **Do** treat cinnabar as the one accent — the seal, one primary CTA, active state, at most one hairline (the One-Accent Rule).
- **Do** set real Chinese glyphs (八字, 命, 五行) beside their English gloss as semantic anchors, in Noto Serif SC — not mono, not Cormorant.
- **Do** reserve Ma Shan Zheng (brush script) for exactly one dramatic character per key screen.
- **Do** keep cards flat, hairline-bordered, 12px radius, generously padded (32px), never nested.
- **Do** verify every text/background pairing against real contrast math in both themes, especially `--faint` (the Faint-Clears-AA Rule).
- **Do** give every animation a `prefers-reduced-motion` alternative; keep motion slow and ease-out-only (no bounce) — "slow ink," 300-800ms depending on the moment.
- **Do** reuse `Seal` for any future filled-cinnabar shape instead of inventing a second one.

### Don't:
- **Don't** add a second accent color — no gold, no jade, no third hue. Legacy `gold`/`jade` variant names stay for prop-API compatibility but render as quiet ink now.
- **Don't** use purple-galaxy gradients, glowing crystal-ball clichés, glassmorphism-as-default, or neon-on-black — named anti-references from PRODUCT.md, carried straight through into the visual system.
- **Don't** use `border-left`/`border-right` stripes greater than 1px as a colored accent on cards or list items.
- **Don't** use gradient text (`background-clip: text` + gradient) for any emphasis — weight or color, never a gradient fill.
- **Don't** ship the hero-metric template (big number, small label, gradient accent) or identical same-sized card grids — the "What Cinnabar reads" section is a hairline-divided list precisely to avoid the latter.
- **Don't** stamp a tracked-caps eyebrow above every section, or a 01/02/03 numbered marker sequence, as default scaffolding — reserve both for the one place they're actually earned.
- **Don't** round cards, sections, or inputs past 14px — full pills are reserved for buttons and tags; the Seal is a circle or a small rounded-square, never a full pill (that would read as a badge, not a stamp).
- **Don't** pair `border: 1px solid` with a soft wide drop-shadow (`box-shadow` blur ≥16px) on the same element — pick the hairline or a tight shadow, never both as decoration.
- **Don't** let any generated content — including share-card imagery from later milestones — cause horizontal body scroll at any breakpoint.
