# Illustration Generation — 朱墨 Cinnabar & Ink

This doc explains how to generate the real illustration set for Cinnabar.
The app ships with **procedural placeholder PNGs** at every path listed
below (see `scripts/generate-placeholders.mjs`) so the app is never broken
before real art exists — but they are intentionally plain ink blobs, not
final art. Replace them at the same filenames.

There is no OpenAI API key wired into this environment. Two routes are
supported, pick whichever fits how you (the developer running this) want
to pay for and produce the images:

- **Route 1 — Codex / script (automated):** you provide `OPENAI_API_KEY`
  and a script calls the Images API for all 23 assets.
- **Route 2 — ChatGPT app (no API key):** you paste each prompt into
  ChatGPT manually, download the result, and save it to the exact path.

Both routes use the same manifest (`art/manifest.json`) and the same
style preamble, so results are cohesive regardless of which route (or mix
of routes) you use.

## Style preamble (prepended to every prompt)

> Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject:

Every prompt in `art/manifest.json` is this preamble followed by an
asset-specific subject (e.g. "a single brushed emblem evoking the WOOD
element..."). The full composed prompt is what both routes below use.

---

## Route 1 — Codex / script (automated)

### 1. Get an OpenAI API key with image access + billing

1. Go to https://platform.openai.com/api-keys and sign in (or create an
   account).
2. Under **Settings -> Billing**, add a payment method and ensure you have
   available credit/spend limit — image generation is billed per image.
3. Create a new secret key (**Create new secret key**). Copy it — it's
   only shown once.
4. Confirm your organization has access to `gpt-image-1` (most accounts
   do by default; if you get a model-access error, check
   https://platform.openai.com/docs/models for the current image model
   name and pass it via `OPENAI_IMAGE_MODEL` — see below).

### 2. Set the environment variable(s)

```bash
export OPENAI_API_KEY="sk-..."
# optional — defaults to "gpt-image-1" if unset:
export OPENAI_IMAGE_MODEL="gpt-image-1"
```

### 3. Run the generator

From the project root (in Codex, a terminal, or any Node 18+ environment
with `fetch` available):

```bash
npm run art:gen
# equivalent to: node scripts/generate-illustrations.mjs
```

Or, if you're driving this through Codex/an agent rather than a shell,
just tell it:

> generate every image in art/manifest.json to its outputPath

The script will:
- read `art/manifest.json`,
- **skip any asset whose `outputPath` file already exists** (this
  protects real art you've already generated, and also means it will
  *not* overwrite the shipped placeholders unless you delete them or pass
  `--force`),
- POST each prompt to `https://api.openai.com/v1/images/generations`,
- decode the returned base64 PNG and write it to `outputPath` (creating
  directories as needed).

### 4. Useful flags

```bash
# Preview what would be requested — no network calls, no files written:
node scripts/generate-illustrations.mjs --dry-run

# Regenerate a single asset (see the id column in the table below):
node scripts/generate-illustrations.mjs --only zodiac-tiger

# Force-overwrite an existing file (placeholder OR prior real art):
node scripts/generate-illustrations.mjs --only zodiac-tiger --force

# Regenerate everything from scratch (overwrites all existing files):
node scripts/generate-illustrations.mjs --force
```

To regenerate one asset after you already have placeholders in place,
either delete that one file first, or pass `--force` — otherwise the
script sees the existing file and skips it.

The script prints clear per-asset progress (`✓` success, `–` skipped,
`✗` failed) and a final summary line. On any API error it prints the
HTTP status and response body and continues to the next asset rather than
aborting the whole run. It exits non-zero if `OPENAI_API_KEY` is missing
(unless `--dry-run`), or if any asset failed.

---

## Route 2 — ChatGPT app (no API key)

If you'd rather not use an API key, you can generate every image by hand
in the ChatGPT app (or any GPT-image-capable chat UI):

1. Open a fresh ChatGPT conversation (a clean one avoids style drift from
   unrelated context).
2. For each row in the table below: paste the **full prompt** (from the
   "Full prompt" section further down — copy the whole fenced block
   verbatim, it already includes the style preamble), and ask for an
   image at the given **size**. Mention the **background** requirement
   explicitly, e.g. "transparent background, isolated subject, no ground
   plane, no shadow" for transparent assets, or "opaque warm rice-paper
   background" for the two full-bleed paper assets (`hero`,
   `share-motif`).
3. Download the generated PNG.
4. Save/rename it to the exact **Path** in the table (relative to the
   project root), overwriting the placeholder that's already there.
5. Check it off the checklist at the bottom of this doc.

### Asset table

| # | id | Category | Path | Size | Background |
|---|----|----------|------|------|------------|
| 1 | `hero` | Hero | `public/illustrations/hero.png` | 1536x1024 | opaque |
| 2 | `element-wood` | Element | `public/elements/wood.png` | 1024x1024 | transparent |
| 3 | `element-fire` | Element | `public/elements/fire.png` | 1024x1024 | transparent |
| 4 | `element-earth` | Element | `public/elements/earth.png` | 1024x1024 | transparent |
| 5 | `element-metal` | Element | `public/elements/metal.png` | 1024x1024 | transparent |
| 6 | `element-water` | Element | `public/elements/water.png` | 1024x1024 | transparent |
| 7 | `zodiac-rat` | Zodiac | `public/zodiac/rat.png` | 1024x1024 | transparent |
| 8 | `zodiac-ox` | Zodiac | `public/zodiac/ox.png` | 1024x1024 | transparent |
| 9 | `zodiac-tiger` | Zodiac | `public/zodiac/tiger.png` | 1024x1024 | transparent |
| 10 | `zodiac-rabbit` | Zodiac | `public/zodiac/rabbit.png` | 1024x1024 | transparent |
| 11 | `zodiac-dragon` | Zodiac | `public/zodiac/dragon.png` | 1024x1024 | transparent |
| 12 | `zodiac-snake` | Zodiac | `public/zodiac/snake.png` | 1024x1024 | transparent |
| 13 | `zodiac-horse` | Zodiac | `public/zodiac/horse.png` | 1024x1024 | transparent |
| 14 | `zodiac-goat` | Zodiac | `public/zodiac/goat.png` | 1024x1024 | transparent |
| 15 | `zodiac-monkey` | Zodiac | `public/zodiac/monkey.png` | 1024x1024 | transparent |
| 16 | `zodiac-rooster` | Zodiac | `public/zodiac/rooster.png` | 1024x1024 | transparent |
| 17 | `zodiac-dog` | Zodiac | `public/zodiac/dog.png` | 1024x1024 | transparent |
| 18 | `zodiac-pig` | Zodiac | `public/zodiac/pig.png` | 1024x1024 | transparent |
| 19 | `empty-master` | Empty state | `public/illustrations/empty-master.png` | 1024x1024 | transparent |
| 20 | `empty-today` | Empty state | `public/illustrations/empty-today.png` | 1024x1024 | transparent |
| 21 | `empty-me` | Empty state | `public/illustrations/empty-me.png` | 1024x1024 | transparent |
| 22 | `empty-match` | Empty state | `public/illustrations/empty-match.png` | 1024x1024 | transparent |
| 23 | `share-motif` | Share motif | `public/illustrations/share-motif.png` | 1536x1024 | opaque |

### Full prompts (verbatim — paste the whole fenced block)

#### `hero` — `public/illustrations/hero.png` (1536x1024, opaque)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: an atmospheric mountain-and-mist ink landscape at dawn, layered peaks dissolving into fog, a faint constellation of stars threaded through the upper sky, spacious and reverent, a single distant red seal stamped low in a corner
```

#### `element-wood` — `public/elements/wood.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: a single brushed emblem evoking the WOOD element -- bamboo stalks and new growth curling upward, rising ch'i, a whisper of jade-green wash along the leaf edges
```

#### `element-fire` — `public/elements/fire.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: a single brushed emblem evoking the FIRE element -- a rising flame curling like calligraphy, sudden yang energy, the cinnabar-red accent concentrated at its core
```

#### `element-earth` — `public/elements/earth.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: a single brushed emblem evoking the EARTH element -- a weathered mountain terrace or clay vessel, settled and nourishing, broad flat ink strokes with a warm ochre undertone
```

#### `element-metal` — `public/elements/metal.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: a single brushed emblem evoking the METAL element -- a folded ceremonial blade or temple bell, clear resonant edges, cool grey-silver ink with a hairline of cinnabar at the rim
```

#### `element-water` — `public/elements/water.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: a single brushed emblem evoking the WATER element -- a curling wave or still deep pool, yielding and profound, indigo wash pooling at the center in concentric ripples
```

#### `zodiac-rat` — `public/zodiac/rat.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: a lone rat rendered in expressive ink brushstrokes, auspicious and mystical, fine whiskers like calligraphy lines, perched atop a stack of ancient scrolls
```

#### `zodiac-ox` — `public/zodiac/ox.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: a lone ox rendered in expressive ink brushstrokes, auspicious and mystical, patient strength in a lowered horned head, mist curling around sturdy hooves
```

#### `zodiac-tiger` — `public/zodiac/tiger.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: a lone tiger rendered in expressive ink brushstrokes, auspicious and mystical, prowling low with bold striped fur, a coiled cinnabar ribbon at its collar
```

#### `zodiac-rabbit` — `public/zodiac/rabbit.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: a lone rabbit rendered in expressive ink brushstrokes, auspicious and mystical, alert ears silhouetted beneath a pale crescent moon
```

#### `zodiac-dragon` — `public/zodiac/dragon.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: a lone dragon rendered in expressive ink brushstrokes, auspicious and mystical, coiling sinuously through cloud and mist, a single pearl held beneath its chin
```

#### `zodiac-snake` — `public/zodiac/snake.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: a lone snake rendered in expressive ink brushstrokes, auspicious and mystical, a sinuous coil resting beneath falling plum blossoms
```

#### `zodiac-horse` — `public/zodiac/horse.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: a lone horse rendered in expressive ink brushstrokes, auspicious and mystical, a galloping mane caught mid-wind, hooves barely brushing the ground
```

#### `zodiac-goat` — `public/zodiac/goat.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: a lone goat rendered in expressive ink brushstrokes, auspicious and mystical, curved horns and a gentle upturned gaze, standing on a mist-wreathed outcrop
```

#### `zodiac-monkey` — `public/zodiac/monkey.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: a lone monkey rendered in expressive ink brushstrokes, auspicious and mystical, perched nimbly on a gnarled pine branch, reaching toward a distant moon
```

#### `zodiac-rooster` — `public/zodiac/rooster.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: a lone rooster rendered in expressive ink brushstrokes, auspicious and mystical, a proud crest and tail feathers greeting the dawn
```

#### `zodiac-dog` — `public/zodiac/dog.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: a lone dog rendered in expressive ink brushstrokes, auspicious and mystical, a loyal watchful seated stance, ears attentive beneath a paper lantern glow
```

#### `zodiac-pig` — `public/zodiac/pig.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: a lone pig rendered in expressive ink brushstrokes, auspicious and mystical, round and content beneath drifting cherry blossoms
```

#### `empty-master` — `public/illustrations/empty-master.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: an empty scholar's writing table with a resting ink brush laid across an inkstone, a blank unrolled scroll awaiting a reading, quiet and unhurried
```

#### `empty-today` — `public/illustrations/empty-today.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: a single incense-stick clock with a thin curl of rising smoke, marking a day not yet divined, soft shadow of an empty calendar behind it
```

#### `empty-me` — `public/illustrations/empty-me.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: an empty bronze mirror stand draped in silk, its reflective face blank and unrevealed, a moment of quiet self-reflection awaiting a portrait
```

#### `empty-match` — `public/illustrations/empty-match.png` (1024x1024, transparent)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: two empty facing cushions across a low tea table, a single unlit paper lantern resting between them, awaiting a pairing not yet drawn
```

#### `share-motif` — `public/illustrations/share-motif.png` (1536x1024, opaque)

```
Traditional Chinese ink-wash (sumi-e) painting meeting modern mystical illustration. Predominantly sumi black ink with a single cinnabar-red (#B0392A) accent and soft restrained washes of jade-green and indigo, on warm rice-paper. Atmospheric, elegant, hand-brushed, generous negative space, a hint of gold-leaf fleck. No text, no lettering, no border, no framing. Centered subject. Subject: a wide ceremonial banner of drifting plum blossoms and a single soaring crane over calm water, a small red seal stamped in the lower corner, composed for sharing
```

---

## Notes on transparency

- All **elements** (5), **zodiac** (12), and **empty states** (4) are
  transparent PNGs — the subject should be isolated with no background
  fill, no drop shadow, and no ground plane, so it composites cleanly onto
  the app's washi-paper or night-ink surfaces in either theme.
- **Hero** and **Share motif** are the only two opaque/paper-background
  assets — full-bleed scenes, not isolated emblems.
- If a model insists on adding a faint background wash even when asked
  for transparency, that's usually fine for `hero`/`share-motif`-style
  compositions but should be avoided for elements/zodiac/empty-state
  emblems — re-prompt with "isolated on a fully transparent background,
  no paper texture behind the subject" if needed.

## Both-theme (washi / night-ink) consideration

Cinnabar ships two committed themes: light **washi** (warm rice-paper,
near-black sumi ink) and dark **night-ink** (warm near-black ground,
brightened ink). Because these illustrations are predominantly ink-dark
strokes with restrained color washes:

- Keep line-art strokes dark/mid-value (sumi black, indigo, jade-green) —
  they read fine against a light washi ground.
- Avoid pure black fills that would look like a hole against the dark
  night-ink ground — a warm near-black (as specified in the style
  preamble) works in both themes.
- The single cinnabar-red accent (#B0392A) is calibrated to read as a
  warm seal-red on both grounds — don't substitute a brighter/neon red.
- Because these are static illustrations (not theme-aware SVGs), the same
  PNG is used in both themes — if an asset looks noticeably wrong in one
  theme once real art lands, regenerate with a slightly lighter/darker
  ink balance rather than trying to theme-switch the PNG itself.

## Placeholders

`scripts/generate-placeholders.mjs` (also `npm run art:placeholders`)
writes a soft procedural ink-blob PNG — a radial-alpha-falloff wash, warm
sumi-ink tinted (a couple of assets cinnabar-tinted), with slight per-id
variation — at every path in `art/manifest.json`. These already exist in
`public/` so the app renders something reasonable immediately. They are
clearly interim (no linework, no subject) and are meant to be overwritten
by real art at the same filenames via either route above. Re-running the
placeholder script skips files that already exist (so it won't clobber
real art you've generated) unless you pass `--force`.

## Checklist

- [ ] `hero` -> `public/illustrations/hero.png`
- [ ] `element-wood` -> `public/elements/wood.png`
- [ ] `element-fire` -> `public/elements/fire.png`
- [ ] `element-earth` -> `public/elements/earth.png`
- [ ] `element-metal` -> `public/elements/metal.png`
- [ ] `element-water` -> `public/elements/water.png`
- [ ] `zodiac-rat` -> `public/zodiac/rat.png`
- [ ] `zodiac-ox` -> `public/zodiac/ox.png`
- [ ] `zodiac-tiger` -> `public/zodiac/tiger.png`
- [ ] `zodiac-rabbit` -> `public/zodiac/rabbit.png`
- [ ] `zodiac-dragon` -> `public/zodiac/dragon.png`
- [ ] `zodiac-snake` -> `public/zodiac/snake.png`
- [ ] `zodiac-horse` -> `public/zodiac/horse.png`
- [ ] `zodiac-goat` -> `public/zodiac/goat.png`
- [ ] `zodiac-monkey` -> `public/zodiac/monkey.png`
- [ ] `zodiac-rooster` -> `public/zodiac/rooster.png`
- [ ] `zodiac-dog` -> `public/zodiac/dog.png`
- [ ] `zodiac-pig` -> `public/zodiac/pig.png`
- [ ] `empty-master` -> `public/illustrations/empty-master.png`
- [ ] `empty-today` -> `public/illustrations/empty-today.png`
- [ ] `empty-me` -> `public/illustrations/empty-me.png`
- [ ] `empty-match` -> `public/illustrations/empty-match.png`
- [ ] `share-motif` -> `public/illustrations/share-motif.png`
