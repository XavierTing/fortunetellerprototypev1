# Cinnabar

**The Chinese astrology app that actually explains itself.**

Cinnabar computes an authentic 八字 (BaZi / Four Pillars) birth chart with a
deterministic engine — lunar-calendar conversion, IANA timezone + historical
DST, and true solar time resolved automatically from a birth place — and
then has a language model interpret that chart in plain, native English.

**The thesis (PRD §1.2):** every AI astrology product, DeepSeek included,
fumbles the actual 排盘 (chart-casting) arithmetic — the market study behind
this build found accuracy running roughly 50–70% when a model is asked to
derive pillars itself. Cinnabar splits the job in two instead: a small,
boring, fully-tested TypeScript engine does the arithmetic; the model only
ever *interprets* chart JSON it's handed as ground truth, never invents it.
That split is the whole product bet — **calculated, not guessed**, paired
with an **agency-first, anti-sycophancy** voice (no "you are doomed"
fatalism, no flattery) and a **share-native** loop across every surface. See
`../PRD.md` for the full spec and `/why` in the running app for the
user-facing version of this pitch.

## Status

All six core milestones (PRD §13, M1–M6) are built: the deterministic
`bazi` engine, the card-based natal reading, the 师傅 chat, the daily
fortune loop, compatibility + shareable cards, and this polish pass
(profile/history page, trust page, paywall markers, the completed share
loop, a footer, and an accessibility pass). See `.build-reports/` for each
milestone's own write-up (`T0` through `T7`).

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript** ·
  **Tailwind CSS v4** (tokens as CSS custom properties, re-exposed via
  `@theme inline` — see [Design system](#design-system)).
- **Prisma 7** (driver adapters) over **SQLite** for local/prototype
  persistence — `@prisma/adapter-better-sqlite3`, no external database
  needed.
- **`lunar-typescript`** (the calendrical oracle: 农历/干支/节气) + **Luxon**
  (timezone-aware date math) + **`tz-lookup`** (lat/lng → IANA timezone) —
  wrapped by `src/lib/bazi`, never called directly by feature code.
- **DeepSeek** (OpenAI-compatible Chat Completions API) behind a single
  `Interpreter` interface, with a fully-featured deterministic mock as the
  zero-config default — see [Going live with AI](#going-live-with-ai).
- **`next/og`**'s built-in `ImageResponse` (Satori + resvg) for server-
  rendered share-card PNGs — no `@vercel/og` package needed.
- **Vitest** (+ `jsdom` for the couple of DOM-touching tests) for the test
  suite; **ESLint** (`eslint-config-next`, flat config) for linting.
- No external services required to run locally, and no API key required to
  see the whole product work end-to-end.

## How to run

```bash
npm install
npx prisma db push   # creates dev.db from prisma/schema.prisma
npm run dev           # http://localhost:3000
```

```bash
npm run build   # production build (also type-checks the whole project)
npm start        # run the production build
npm test          # run the Vitest suite once
```

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (also type-checks the whole project) |
| `npm start` | Run the production build |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run lint` | ESLint |
| `npx prisma db push` | Sync `prisma/schema.prisma` to `dev.db` (no migration history — fine for a prototype) |
| `npx prisma generate` | Regenerate the Prisma client into `src/generated/prisma` (run manually after editing the schema) |
| `npx prisma studio` | Browse the local database |

## Environment variables

Copy `.env.example` to `.env` and fill in what you need:

```bash
cp .env.example .env
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite connection string, defaults to `file:./dev.db` |
| `DEEPSEEK_API_KEY` | DeepSeek (OpenAI-compatible) API key |
| `DEEPSEEK_BASE_URL` | DeepSeek API base URL, defaults to `https://api.deepseek.com` |

### Going live with AI

Every AI-driven feature (natal reading, the 师傅 chat, daily fortune,
compatibility) is built behind a single `Interpreter` interface
(`src/lib/interpreter/types.ts`, PRD §7.3) so the model is swappable and
fully testable offline. With `DEEPSEEK_API_KEY` **unset**, `getInterpreter()`
(`src/lib/interpreter/interpreter.ts`) falls back to `MockInterpreter` — a
genuinely chart-grounded, deterministic-but-varied generator (seeded picks,
no `Math.random()`) that makes the whole app usable and demoable with zero
configuration and zero API spend. Set `DEEPSEEK_API_KEY` (and optionally
override `DEEPSEEK_BASE_URL`) in `.env` to switch the exact same code paths
to live DeepSeek calls — **no other config changes are needed**, and every
route that reads/writes a `Reading`/`ChatMessage`/`DailyFortune`/
`CompatibilityPair` already stores which model produced it (`"mock"` vs.
`"deepseek-chat"`).

## Architecture

```
Birth data → src/lib/bazi (deterministic engine) → Chart JSON
                                                        │
                                                        ▼
                                    src/lib/interpreter (Interpreter contract)
                                    MockInterpreter  |  DeepSeekInterpreter
                                                        │
                                                        ▼
                                    Cards / chat replies / daily fortune /
                                    compatibility reading (Zod-validated)
```

- **`src/lib/bazi`** — the moat (PRD §7.2). Pure, typed, side-effect-free:
  `computeChart(BirthInput) → Chart`. Wraps `lunar-typescript` rather than
  hand-rolling calendar math, then adds the parts that library doesn't do:
  true-solar-time correction from longitude, IANA timezone + historical DST
  normalization, five-element tallying, Day-Master strength, 大运 luck-pillar
  sequencing, and branch relationships (三合/六合/相冲/相刑). Golden-tested
  against known births, including 节气 boundaries, pre-dawn 子时, DST
  transitions, unknown birth time, and southern-hemisphere births. **Never
  imports an interpreter, a DB client, or anything server/request-shaped.**
- **`src/lib/interpreter`** — the `Interpreter` contract
  (`natalReading`/`streamNatalReading`/`chat`/`dailyFortune`/`compatibility`)
  plus `MockInterpreter`, `DeepSeekInterpreter`, prompt/style-guide text, and
  the Zod schemas both implementations are held to. Every call receives
  engine-computed chart facts as ground truth — an interpreter *never*
  sources chart facts itself, matching PRD §5's contract: "deterministic
  chart JSON → structured prompt → validated structured output."
- **`src/app`** — routes (App Router), Server Actions for mutations
  (`"use server"` files), and Route Handlers for streaming (`/api/reading/
  [profileId]/stream`, `/api/master/[profileId]/chat`) and share-image
  generation (`/api/share/[type]/[id]`).
- **`prisma/schema.prisma`** — `User` (anonymous-session-backed), `Profile`
  (a cached `Chart` JSON lives on it), `Reading`, `ChatThread`/`ChatMessage`,
  `CompatibilityPair`, `DailyFortune` (PRD §10). SQLite has no native JSON
  column, so JSON-shaped fields are `TEXT`, serialized/deserialized at the
  call site.
- **Sessions** — no real auth (PRD §7.6: freemium is *designed*, not
  enforced, for this prototype). `src/lib/session.ts` gives every visitor an
  anonymous, httpOnly `cid` cookie whose value doubles as their `User.id`,
  so saved profiles/readings/chats survive a refresh with no signup step.

## Features

| Feature | Route | Notes |
|---|---|---|
| Onboarding & birth-data capture | `/reading/new` | City autocomplete → lat/lng + IANA tz (`/api/geocode/search`, offline dataset); "I don't know my time" degrades gracefully to a 3-pillar chart. |
| Natal reading | `/reading/[id]` | ~10-card streamed reading (`/api/reading/[id]/stream`, SSE) over the free hero insight + element balance + editorial card list; "the mechanics ⓘ" expander shows the underlying 干支/element logic with pinyin + gloss; Share button + `opengraph-image`. |
| 师傅 (Master) chat | `/master` | Chart- and reading-grounded streaming chat, anti-sycophancy + in-domain guardrails, suggested prompt chips. |
| Daily fortune | `/today` | One card a day, cached per `(profile, date)`; today's real day pillar weighed against the user's Day Master and natal branches (相冲/六合/三合/相刑 flagged when they fire); Share button + `opengraph-image`. |
| Compatibility + share | `/match`, `/match/[id]` | Ad-hoc second person (no account needed for them); engine-computed relationship facts (Day-Master 生/克/比, cross-chart 三合/六合/相冲/相刑, complementary/clashing elements) narrated into an overall/dynamic/friction/advice reading + score; Share button + `opengraph-image`. |
| Profile & history | `/me` | Self chart summary (reuses the reading page's element-balance chart) + linked lists of past readings, 师傅 conversations, and compatibility checks; graceful empty state pre-chart. |
| Trust / positioning | `/why` | The "why not just ChatGPT?" page PRD §9 calls for — the deterministic-engine and anti-sycophancy pitch, made concrete with a side-by-side comparison. |
| Share loop | `/api/share/{compatibility,reading,daily}/[id]` | Server-rendered branded PNGs (`next/og`'s `ImageResponse`, no `@vercel/og` install) at link-preview (1200×630) and Instagram/TikTok-story (1080×1920, `?size=story`) sizes, reused by each feature's own `opengraph-image.tsx` file-convention hook so a pasted page link and a "Share → Card" tap render byte-identical art. |

## Design system

The palette, type stack, and light/dark tokens live as CSS custom
properties in `src/app/globals.css` and are re-exposed to Tailwind v4 via an
`@theme inline` block, so `bg-lacquer`, `text-cinnabar`, `bg-gold`,
`text-jade`, `border-hairline`, `font-display`/`font-body`/`font-mono`, etc.
are all available as utility classes and stay in sync with the active theme.
Theme resolution order: **dark (default)** → `prefers-color-scheme: light` →
explicit `data-theme` on `<html>` (set by the header's toggle, persisted to
`localStorage`), with the explicit choice always winning. `DESIGN.md` is the
full source of truth — "Lacquer · Gold · Cinnabar," a warm dark-lacquer
ground with gold-leaf and cinnabar-red accents, a fully-committed (but
non-default) rice-paper light mode, Cormorant Garamond (display-only) paired
against Hanken Grotesk (body/UI), hairline-first flat surfaces, and a named
list of anti-patterns it deliberately avoids (no cream ground, no
purple-galaxy/crystal-ball clichés, no glassmorphism, no gradient text, no
identical card grids). The component kit lives in `src/components/ui/`
(`Button`, `Card`/`Tile`, `Badge`/`Tag`, `Eyebrow`, `Section`/`SectionHead`,
`Field`/`Input`, `PaywallSlot`) — reach for one of these before inventing a
new class or a page-local component.

### `PaywallSlot` — designed-but-unlocked freemium markers

PRD §7.6: monetization is *designed*, not enforced, in this prototype —
"everything is unlocked; wall points are marked with a `PaywallSlot`
component so they're trivial to switch on later." `src/components/ui/
paywall-slot.tsx` renders a small "Premium" tag + a one-line note above
whatever it wraps; the wrapped content always renders. It marks three
boundaries from the PRD's freemium plan: the full natal "book" (bottom of
`/reading/[id]`), unlimited 师傅 chat (bottom of `/master`), and a deeper
annual/流年 outlook (bottom of `/today`, since daily itself stays free
forever). Wiring up real billing later means wrapping a call site's children
in an entitlement check — the component itself intentionally contains no
gating logic.

## Tests

`npm test` runs Vitest once against `src/**/*.test.ts` / `src/**/*.test.tsx`
— **19 test files, 225 tests**, all green. Coverage highlights:

- **`src/lib/bazi/*.test.ts`** — the golden-test suite the engine's
  correctness claim rests on (PRD §11): known-birth pillar/element/luck-
  pillar fixtures, 节气 day-boundary edge cases, pre-dawn 子时, DST
  transitions, unknown birth time, and southern-hemisphere births.
- **`src/lib/interpreter/*.test.ts`** — the Zod output contracts, the mock
  interpreter's determinism (same input ⇒ same output, no `Math.random()`),
  and five-element relationship math.
- **`src/app/today/lib.test.ts`**, **`src/app/match/lib.test.ts`** —
  day-pillar interaction and cross-chart relationship-facts helpers.
- **`src/lib/db.test.ts`** — a real create/read/delete round-trip against
  the local SQLite database, so the Prisma driver-adapter wiring is proven
  to actually work, not just type-check.
- **`src/lib/nav.test.ts`**, **`src/lib/theme.test.ts`**,
  **`src/lib/geocode/index.test.ts`**, **`src/lib/reading/
  birth-schema.test.ts`** — navigation state, theme persistence, the
  offline city-geocoding dataset, and birth-form validation.

`npm run lint` (ESLint, flat config via `eslint-config-next`) is clean.

## Known limitations

- **Prototype persistence, not production.** SQLite + an anonymous-cookie
  "session" (PRD §7.6) stand in for real accounts/Postgres; there's no
  login, no email verification, no cross-device sync, and no profile
  deletion UI yet (PRD §11 names this as a real privacy requirement before
  launch).
- **No real billing.** `PaywallSlot` marks where a freemium wall would go;
  nothing is actually gated (by design, for this prototype stage).
- **English-only UI, one system.** Only 八字 is implemented (PRD's explicit
  v1 scope) — no 紫微斗数, tarot, Western astrology, I-Ching, 起名, or
  face-reading, and no multi-language UI.
- **`/master` has one active thread per profile**, not a full multi-thread
  history browser — `/me` links every past conversation back to `/master`,
  which always resumes the most recent thread for the most recent self
  profile rather than deep-linking a specific past thread.
- **Share-card typography avoids CJK glyphs.** `next/og`'s Satori renderer
  uses a bundled default font with no CJK coverage, so share-image raster
  text (unlike the live UI) stays in English/Latin — a Latin "C" monogram
  stands in for a seal mark. A follow-up could vendor real CJK-capable
  `.ttf` files under `public/fonts/` and pass them via `ImageResponse`'s
  `fonts` option.
- **Gender defaults to "male"** for 大运 luck-pillar direction
  (`src/lib/bazi/luck.ts`) — the birth form doesn't yet collect it (an open
  question PRD §12 calls out explicitly).
- **No push notifications.** The daily-fortune "notification voice" is
  copywritten and lives in the card itself; PRD §5.4 scopes actual push
  delivery out of the web prototype.
