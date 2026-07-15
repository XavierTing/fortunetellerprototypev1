# 朱墨 — Cinnabar & Ink · Design Spec (v2 look & feel)

**Date:** 2026-07-15 · **Supersedes:** the "Lacquer·Gold·Cinnabar" dark system.
**One line:** A reading should feel like receiving a hand-brushed scroll, not opening an app.

## Intent
Retheme + feel pass toward **minimalist, classy, zen** — synthesized from two references:
- **11-ink / SUMI:** near-white washi paper · deep sumi charcoal · vermillion seal · bilingual EN + 墨蘭竹菊梅 characters as visual anchors · extreme whitespace · narrow contemplative column · one interactive ink "pool" (ink that forgets slowly) · "leave the white alone."
- **23-teahouse / KŌCHA-AN:** off-white · near-black · elegant narrow serif + clean sans · philosophical copy as design · negative space as content · tiny seal/compass marks · utter stillness.

**Decisions locked:** (a) hero = full cursor-reactive ink-wash canvas; (b) **light "washi" is the default**, refined **"night ink"** dark retained as an optional toggle. Engine / interpreter / features / data model = UNTOUCHED (visual + copy only).

## Palette (OKLCH) — washi, sumi, one seal
**Light "washi" (DEFAULT):**
- `--paper` (ground) `oklch(96.5% 0.006 90)` — warm rice paper, low chroma so it reads *considered*, not AI-cream
- `--paper-deep` (raised/panel) `oklch(94% 0.007 88)` · `--paper-sink` (insets) `oklch(92% 0.008 88)`
- `--ink` (text) `oklch(22% 0.012 60)` — warm sumi near-black, never pure #000
- `--ink-soft` `oklch(38% 0.011 60)` · `--muted` `oklch(50% 0.009 60)` · `--faint` `oklch(62% 0.007 60)`
- `--cinnabar` (the ONLY accent) `oklch(52% 0.19 33)` · `--cinnabar-deep` `oklch(46% 0.17 32)`
- `--hairline` `oklch(22% 0.012 60 / 0.12)` · `--seal` = cinnabar (used for the stamp mark)

**Dark "night ink" (optional toggle):** inverted — ground `oklch(16% 0.006 60)` warm sumi-black, paper→`oklch(20% 0.007 60)`, ink text→`oklch(90% 0.006 85)`, cinnabar brightened `oklch(64% 0.19 33)`. Same token names; retune the existing dark block. Keep it calm, not "gloomy" (raise text brightness, warm the ground).

**Rules:** cinnabar is used like a hanko — sparingly: the seal mark, one primary CTA, active state, at most one hairline. Everything else is ink on paper. Verify contrast ≥4.5:1 body, ≥3:1 large. OKLCH only. Keep impeccable rules (no gradient text, no side-stripe borders, no glassmorphism, no identical-card grids, small radii, ease-out motion + reduced-motion).

## Typography — bilingual as design
- **Cormorant Garamond** (already loaded) — display/headings, weights 300–500, generous air, `text-wrap: balance`.
- **Noto Serif SC** *(add via next/font)* — Chinese glyphs (八字, 命, 五行, 干支 pillars, 木火土金水) set **large and quiet** as visual anchors beside English (the 11-ink 墨蘭竹菊梅 move). Not decoration — real semantic anchors.
- **Ma Shan Zheng** *(add via next/font — brush script)* — ONE dramatic hand-brushed character per key screen (命 on hero; the day-master stem on a reading). Use very sparingly.
- **Hanken Grotesk** (keep) — body/UI, lighter weights, line-height ~1.8, measure ~34rem.
- Drop mono to near-zero (tiny data labels only, or JetBrains Mono kept minimal). Zen = less type variety on screen at once.

## Feel — space, stillness, slow ink
- Extreme whitespace; narrow center-weighted column; sections separated by breathing room + a single ink hairline. "Leave the white alone."
- **Motion = slow ink:** reveals bleed in on ease-out ~600–800ms; the cinnabar seal *stamps* (scale+settle); no snappy/bounce. Full `prefers-reduced-motion` fallback (instant, no bleed).
- **Poetic copy voice** in chrome/empty-states/section intros (teahouse register): e.g. hero — "Your fate is already written. We only read it aloud." Empty states quiet and kind. Rewrite shouty microcopy.

## Three signature moments
1. **Ink-wash hero canvas** — a `<canvas>` where a sumi brushstroke blooms along the cursor and *forgets slowly* (fades), over the washi ground; the 命 brush-character (Ma Shan Zheng) settles behind; the **cinnabar seal stamps** on load. Restrained homage to 11-ink's pool. Scripted, calm fallback on load; disabled under reduced-motion (static composition instead). Must be performant (rAF, capped particles), not janky.
2. **五行 enso element viz** — replace the reading's element bar chart with **five brush-ink circles** (enso-like) sized by element weight; sumi ink for most, cinnabar fill for the dominant element; each bleeds/settles in. Labels Wood/Fire/Earth/Metal/Water + 木火土金水. On-theme AND legible (keep numeric weights in tabular-nums nearby).
3. **Reading as hanging scroll (立軸) + seal share card** — reading unrolls vertically: first line a large Cormorant pull-quote, each section a quiet stanza divided by ink hairlines; generous rhythm. Restyle the `next/og` share cards (`api/share/render.tsx`) as **seal-stamped rice paper**: washi ground, brush title, the cinnabar seal carrying the score/verdict. Keep the CJK-free-raster discipline for Satori (or embed a CJK font if feasible; else romanize).

## Scope / tasks
- **R0 Foundation:** repalette `globals.css` (light default washi + retuned night-ink dark), add Noto Serif SC + Ma Shan Zheng via `next/font`, soften the `src/components/ui/` kit (more padding/whitespace, calmer buttons = cinnabar seal CTA, hairline borders), rebuild shell (nav/header/footer) + landing base structure, update `DESIGN.md`/`PRODUCT.md`. Gate: build green, both themes.
- **R1 Signature moments:** ink-wash hero canvas, 五行 enso viz (reading), scroll reading layout, seal share cards.
- **R2 Feel pass + copy:** apply space/motion/poetic-voice to `/master` `/today` `/me` `/why` (+ empty states), bilingual anchors.

## Untouched
`src/lib/bazi/**`, `src/lib/interpreter/**`, `prisma/**`, all API/business logic. This is look, feel, motion, and copy only.

## Verification
Build + `npm test` green (249/249 baseline; update snapshot-ish UI expectations only if needed — no logic tests should change). Contrast checks pass. impeccable detector clean. Restart dev server and eyeball both themes + the three signature moments; the hero canvas must be smooth and reduced-motion-safe.
