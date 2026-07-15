---
name: Cinnabar
description: "Lacquer, gold leaf, and cinnabar red on a warm dark ground — a premium East-Asian luxury-material system. Rice-paper light mode ships too, but dark is the deliberate default."

# All values below mirror src/app/globals.css verbatim. That file is the
# source of truth; this frontmatter is the portable export. If a token
# changes there, update both. Colors are OKLCH directly (project doctrine:
# OKLCH-only, tinted neutrals) — accept the Stitch hex-linter warning
# rather than splitting the source of truth into a second hex copy.
colors:
  # Brand anchors
  gold: "oklch(80% 0.128 85)" # primary accent — CTA fill, hero accent word, active/selected state
  cinnabar: "oklch(63% 0.19 33)" # signature accent (the brand's own name) — mark, nav-active, focus ring
  jade: "oklch(74% 0.09 168)" # tertiary — reserved for positive/growth signals in feature content

  # Dark surfaces (default theme)
  lacquer: "oklch(11% 0.014 40)" # page ground
  lacquer-deep: "oklch(7% 0.012 40)" # deepest inset — sticky header, nav rail
  raised: "oklch(15% 0.014 40)" # cards, panels
  graphite: "oklch(20% 0.012 45)" # input fields

  # Gold ramp (dark)
  gold-rich: "oklch(72% 0.12 82)" # active/pressed gold fill
  gold-pale: "oklch(88% 0.07 88)" # hover lift on gold fill
  cinnabar-deep: "oklch(55% 0.18 32)" # hover/active cinnabar
  glow-cinnabar: "oklch(63% 0.19 33 / 0.12)" # one ambient hero glow, not a reusable surface

  # Dark text
  ink: "oklch(93% 0.006 70)" # headlines, brightest text
  text: "oklch(88% 0.005 70)" # body copy
  muted: "oklch(72% 0.004 70)" # captions, meta
  faint: "oklch(60% 0.004 70)" # subdued, disabled

  # Dark hairlines
  hairline: "oklch(88% 0 0 / 0.12)" # default border/divider
  hairline-gold: "oklch(80% 0.09 85 / 0.5)" # brand-bearing border (toggle hover, badge ring)

  # Light "rice paper" mode — committed, non-default. Same roles, tuned
  # lightness/chroma so contrast holds on a bright ground (see the
  # Gold-By-Size-On-Paper rule in §2).
  light-lacquer: "oklch(96% 0.012 85)"
  light-lacquer-deep: "oklch(93% 0.014 85)"
  light-raised: "oklch(99% 0.007 85)"
  light-graphite: "oklch(91% 0.012 85)"
  light-gold: "oklch(60% 0.13 84)"
  light-gold-rich: "oklch(54% 0.135 82)"
  light-gold-pale: "oklch(90% 0.05 86)"
  light-cinnabar: "oklch(52% 0.17 33)" # deepened from the dark 63% so small text/links clear 4.5:1
  light-cinnabar-deep: "oklch(45% 0.16 32)"
  light-jade: "oklch(42% 0.11 165)"
  light-ink: "oklch(24% 0.02 50)"
  light-text: "oklch(30% 0.02 50)"
  light-muted: "oklch(45% 0.015 50)"
  light-faint: "oklch(56% 0.013 50)"
  light-hairline: "oklch(24% 0.02 50 / 0.14)"
  light-hairline-gold: "oklch(50% 0.1 84 / 0.55)"

typography:
  wordmark:
    fontFamily: "Cormorant Garamond, Iowan Old Style, Georgia, serif"
    fontSize: "1.4rem"
    fontWeight: 500
    letterSpacing: "0.02em"
    lineHeight: 1
  display:
    fontFamily: "Cormorant Garamond, Iowan Old Style, Georgia, serif"
    fontSize: "clamp(2.75rem, 6.2vw, 5.25rem)"
    fontWeight: 300
    letterSpacing: "-0.015em"
    lineHeight: 1.05
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
    lineHeight: 1.7
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
    backgroundColor: "{colors.gold}"
    textColor: "{colors.lacquer-deep}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.gold-pale}"
    textColor: "{colors.lacquer-deep}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.gold}"
    borderColor: "{colors.hairline-gold}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "44px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "44px"
  card:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.card}"
    padding: "24px"
  input-text:
    backgroundColor: "{colors.graphite}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.input}"
    padding: "0 14px"
    height: "44px"
  badge:
    backgroundColor: "transparent"
    textColor: "{colors.gold}"
    borderColor: "{colors.hairline-gold}"
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

# Design System: Cinnabar

## 1. Overview

**Creative North Star: "Lacquer, Gold, and Cinnabar"**

Cinnabar reads as a physical object, not a screen: a dim, candlelit room lacquered in warm near-black, its seams picked out in gold leaf, a single seal stamped in cinnabar red. Consulting the chart should feel closer to opening a lacquer box than opening an app — deliberate, warm, a little ceremonial, but never precious enough to slow the reader down. Dark is the room's actual light level, not a "developer tool" reflex; a fully committed "rice paper" light mode exists for daylight reading, but it is the alternate, not the default.

This system explicitly replaces an earlier warm ink-and-paper (cream) direction. That palette is retired: cream/sand/parchment as a *default* body ground is the single most common AI-generated-interface tell, and it undersold a brand whose entire premise is "authentic, computed, expensive-feeling," not "cozy zine." It also rejects the wider AI-tool-visual grammar — purple-galaxy gradients, glowing crystal-ball clichés, glassmorphism-as-default, neon-on-black — and the Chinese-incumbent-app clutter this product's own market research flagged (dense grids, fear-forward copy, no onboarding for a first-time reader).

**Key characteristics:**
- Warm dark lacquer ground (never pure black, never cool-neutral gray) with a fully committed, non-default rice-paper light mode.
- Two-accent brand system: gold leaf carries premium/action moments, cinnabar carries identity/navigation/emphasis. Jade is held in reserve for positive-state content.
- A classical serif display face (Cormorant Garamond) paired against a humanist grotesque body face (Hanken Grotesk) — a real contrast axis, not two similar sans-serifs.
- Hairline-first, mostly flat surfaces; small radii on cards, full pills on buttons and tags.
- One texture moment per view at most (a near-invisible watermark glyph, an off-center warm glow) — restraint, not decoration for its own sake.

## 2. Colors

The palette is warm and tinted throughout — every neutral carries a trace of the brand's own hue rather than defaulting to true gray.

### Primary
- **Gold** (`oklch(80% 0.128 85)`): The premium accent. Primary CTA fills, the hero's accent word, active/selected nav-adjacent states, focus rings on gold surfaces. Used deliberately, not as a wash — see the One Metal Rule below.

### Secondary
- **Cinnabar** (`oklch(63% 0.19 33)`): The brand's own signature color (朱砂, the product's namesake). Carries identity: the brand mark, navigation active state, link/focus color, the hero headline's one accent word. Where gold says "act here," cinnabar says "this is Cinnabar."

### Tertiary
- **Jade** (`oklch(74% 0.09 168)`): Held in reserve for positive/growth signals in feature content (a favorable daily reading, a harmonious compatibility result) — not used as a third decorative accent on the shell itself. It earns its place once a feature actually has a "good news" state to mark.

### Neutral
- **Lacquer** (`oklch(11% 0.014 40)`): Page ground (dark theme, default). Warm near-black, never pure black.
- **Lacquer Deep** (`oklch(7% 0.012 40)`): The deepest surface — sticky header, nav rail. Persistent chrome reads as a sealed panel set into the page, not part of scrollable content.
- **Raised** (`oklch(15% 0.014 40)`): Cards and panels — one step up from the page ground.
- **Graphite** (`oklch(20% 0.012 45)`): Input fields — a step brighter than Raised, so a form control reads as "lit" against the card it sits in.
- **Ink** (`oklch(93% 0.006 70)`) / **Text** (`oklch(88% 0.005 70)`) / **Muted** (`oklch(72% 0.004 70)`) / **Faint** (`oklch(60% 0.004 70)`): The dark-mode text ramp, headline to disabled.
- **Hairline** (`oklch(88% 0 0 / 0.12)`) / **Hairline Gold** (`oklch(80% 0.09 85 / 0.5)`): Default borders/dividers, and the brand-bearing border variant (toggle hover ring, gold-outline buttons, badges).

Light "rice paper" mode swaps every role to a tuned counterpart (`light-*` in the frontmatter) rather than simply inverting lightness — see the Gold-By-Size rule below for why gold itself changes value, not just the neutrals.

### Named Rules

**The One Metal Rule.** Gold fills at most one prominent element per view — the primary CTA is the usual bearer. A page with three gold buttons has lost the plot; gold's rarity is what makes it read as leaf, not paint.

**The Cinnabar-Is-Identity Rule.** Cinnabar marks "this is Cinnabar, and this is where you are" — the brand mark, the active nav item, focus rings. It is not a second decorative accent competing with gold; if an element needs a color and isn't a primary action, reach for cinnabar before inventing a new hue.

**The Anti-Cream Rule.** Dark is the default body ground, full stop. The committed rice-paper light mode exists and is polished, not an afterthought — but it is never what a first-time, no-preference visitor sees.

**The Gold-By-Size-On-Paper Rule.** On the light theme, gold is deepened (`oklch(60% 0.13 84)` vs. the dark theme's `oklch(80% 0.128 85)`) and reserved for large display text and fills — the hero's gold accent word, a CTA fill with dark text on top. At small sizes (links, labels, badge text) light mode swaps the accent role to cinnabar (`oklch(52% 0.17 33)`, deepened from the dark theme's `oklch(63% 0.19 33)`) because pale gold fails contrast on a bright paper ground at body/label sizes. Every accent-on-light pairing in this system was checked against real WCAG contrast math (OKLCH → linear sRGB → relative luminance), not eyeballed: body/label text clears 4.5:1, large display and fills clear 3:1.

## 3. Typography

**Display Font:** Cormorant Garamond (with Iowan Old Style, Georgia, serif fallback)
**Body Font:** Hanken Grotesk (with the system UI sans stack as fallback)
**Label/Mono Font:** JetBrains Mono

**Character:** A classical high-contrast serif carrying the brand's oracle-authority moments against a clean, warm humanist grotesque for everything a reader actually has to parse quickly — a genuine contrast-axis pairing, not two interchangeable sans-serifs wearing different weights.

### Hierarchy
- **Wordmark** (weight 500, `1.4rem`, letter-spacing `0.02em`): the "Cinnabar" lockup in the header only.
- **Display** (weight 300, `clamp(2.75rem, 6.2vw, 5.25rem)`, line-height 1.05, letter-spacing `-0.015em`): the hero h1. Deliberately light — the one place the serif is allowed to whisper.
- **Headline** (weight 500, `clamp(1.9rem, 3.2vw, 2.75rem)`, line-height 1.1): section h2s. Heavier than the hero on purpose — see the Weight-Inversion Rule.
- **Body** (weight 400, `1.05rem`, line-height 1.7): all copy, capped near 60-65ch measure.
- **Label** (weight 600, `0.68rem`, letter-spacing `0.14em`, uppercase): form field labels, tag/badge text.
- **Eyebrow** (weight 500, `0.7rem`, letter-spacing `0.22em`, uppercase, mono): the one small tracked marker per page — see the Eyebrow Restraint Rule.

### Named Rules

**The Two-Face Rule.** Cormorant Garamond is reserved for display sizes only: hero h1, section h2s, the wordmark. It never carries body copy, form labels, or UI chrome — Hanken Grotesk owns everything below display scale.

**The Weight-Inversion Rule.** The hero h1 sits at weight 300; section h2s sit at weight 500. The hero is light so the page can breathe on first impression; section anchors carry more weight to ground each block once the reader is past the hero. Don't flatten the two to the same weight.

**The Eyebrow Restraint Rule.** The mono eyebrow label appears at most once per page (the hero's "八字 · Four Pillars" marker). A tracked-caps kicker stamped above every section is 2023-era AI scaffolding; if a second section wants one, reach for a plain `<h2>` instead.

## 4. Elevation

The system is hairline-first and mostly flat. Cards and panels are separated from their ground by a 1px border and a background-lightness step, not a shadow — depth reads as material layering (lacquer → raised → graphite), not drop-shadow. The one exception is a single ambient glow behind the hero (`--glow-cinnabar`, a low-alpha cinnabar radial gradient, off-center) standing in for candlelight in the room; it is a page-specific moment, not a reusable elevation token.

### Named Rules

**The Hairline-First Rule.** Reach for a 1px `--hairline` border before reaching for a shadow. No card, panel, or button carries a default drop-shadow.

**The No-Nesting Rule.** A Card never contains another Card. Internal grouping inside a card is spacing and a hairline divider, not a second bordered box.

## 5. Components

### Buttons (`src/components/ui/button.tsx`)
- **Shape:** full pill (`rounded-full`, 999px) — small radii belong to cards, not buttons.
- **Primary:** gold fill, `lacquer-deep` text (max-contrast pairing, not a light-gray-on-gold mistake). One per view.
- **Secondary:** transparent fill, hairline-gold or cinnabar/40 border (`tone` prop), matching text color.
- **Ghost:** text-only, subtle background tint on hover (`graphite` or a cinnabar/10 wash).
- **Hover / Focus:** color-only transitions on `--ease` (ease-out-expo), no transform bounce; focus-visible ring is always cinnabar, regardless of the button's own accent, so it stays legible on a gold fill too.

### Tags & Badges (`src/components/ui/badge.tsx`)
- **Shape:** full pill, hairline ring in the variant's accent color (gold/cinnabar/jade/neutral).
- **Badge** adds a small status dot; **Tag** omits it for non-live labels.
- **State variants** map 1:1 to the three-accent system — don't invent a fourth ad-hoc color for a new state.

### Cards / Tiles (`src/components/ui/card.tsx`)
- **Corner style:** 12px radius (`card` rounded token) — inside the 6-14px system-wide card range, never 24px+.
- **Background:** `raised` (dark) / `light-raised` (light).
- **Shadow strategy:** none by default — see Elevation.
- **Border:** 1px `hairline`.
- **Internal padding:** 24px default, callers may override for a hero moment (the reveal-teaser card uses 32-48px).

### Inputs / Fields (`src/components/ui/field.tsx`)
- **Style:** `graphite` fill, 1px hairline border, 8px radius.
- **Focus:** border shifts to gold — no glow, no ring, matching the hairline-first material logic.
- **Label:** mono/label-scale, uppercase, tracked, `faint` color — forms read as precise instruments.

### Navigation (`src/components/nav.tsx`, `src/components/site-header.tsx`)
- **Style:** persistent chrome sits on `lacquer-deep`, one step deeper than the page — bottom bar on mobile, left rail on desktop, both hairline-bordered.
- **Default state:** `faint` text/glyph.
- **Hover:** shifts to `text` (rail) with a `graphite` background tint.
- **Active:** `cinnabar` text, with a soft `cinnabar/12` fill on the desktop rail — see the Cinnabar-Is-Identity Rule.
- **Header:** sticky, `lacquer-deep` with backdrop-blur for scroll legibility (functional, not decorative glass).

### Eyebrow (`src/components/ui/eyebrow.tsx`) — signature component
Small tracked mono label, used at most once per page. It exists specifically so the temptation to stamp a kicker above every section has a named, restrained home instead of becoming default scaffolding — see the Eyebrow Restraint Rule.

## 6. Do's and Don'ts

### Do:
- **Do** keep dark lacquer as the default body ground; ship the rice-paper light theme as a fully committed, equally polished alternate, not a token gesture.
- **Do** use gold for at most one prominent fill per view — the primary CTA is the usual bearer (the One Metal Rule).
- **Do** use cinnabar for identity and navigation state — brand mark, active nav, focus rings, the hero's one accent word.
- **Do** keep cards flat, hairline-bordered, 12px radius, never nested.
- **Do** pair Cormorant Garamond (display only) against Hanken Grotesk (everything else) — a real contrast axis, not two similar sans-serifs.
- **Do** verify every text/background pairing against real contrast math, especially on the light theme where gold's role changes (the Gold-By-Size-On-Paper Rule).
- **Do** give every animation a `prefers-reduced-motion` alternative (this system's global stylesheet collapses all durations to near-zero under that media query).

### Don't:
- **Don't** use a cream/sand/beige/parchment background as the *default* theme — this was this product's own previous direction and is the AI-tell this redesign exists to fix.
- **Don't** use purple-galaxy gradients, glowing crystal-ball clichés, glassmorphism-as-default, or neon-on-black — named anti-references from PRODUCT.md, carried straight through into the visual system.
- **Don't** use `border-left`/`border-right` stripes greater than 1px as a colored accent on cards or list items.
- **Don't** use gradient text (`background-clip: text` + gradient) for any emphasis — weight or color, never a gradient fill.
- **Don't** ship the hero-metric template (big number, small label, gradient accent) or identical same-sized card grids — the "What Cinnabar reads" section is a hairline-divided list precisely to avoid the latter.
- **Don't** stamp a tracked-caps eyebrow above every section, or a 01/02/03 numbered marker sequence, as default scaffolding — reserve both for the one place they're actually earned.
- **Don't** let gold carry small body or label text on the light theme — it fails contrast there; use cinnabar instead (see §2).
- **Don't** round cards, sections, or inputs past 14px — full pills are reserved for buttons and tags, not cards.
- **Don't** pair `border: 1px solid` with a soft wide drop-shadow (`box-shadow` blur ≥16px) on the same element — pick the hairline or a tight shadow, never both as decoration.
- **Don't** let any generated content — including share-card imagery from later milestones — cause horizontal body scroll at any breakpoint.
