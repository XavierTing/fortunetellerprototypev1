# Cinnabar

**The Chinese astrology app that actually explains itself.**

Cinnabar computes an authentic 八字 (BaZi / Four Pillars) birth chart with a
deterministic engine — timezone, historical DST, and true solar time
resolved automatically from a birth place — and then has an LLM interpret
that chart in plain, native English. Calculated, not guessed. Agency, not
fatalism. See `../PRD.md` for the full product spec; this package is the
prototype web app.

Current status: **T0 — foundation scaffold.** The app shell (design system,
navigation, theme toggle, landing page, database, anonymous sessions) is
in place; the actual chart engine, readings, chat, daily fortune, and
compatibility features land in later milestones (PRD §13).

## Prerequisites

- Node.js 20+ and npm
- No external services required to run locally — SQLite is used for the
  database and a mock interpreter stands in for the LLM until you add a
  DeepSeek API key (see below).

## Getting started

```bash
npm install
npx prisma db push   # creates dev.db from prisma/schema.prisma
npm run dev           # http://localhost:3000
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (also type-checks the whole project) |
| `npm start` | Run the production build |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run lint` | ESLint |
| `npx prisma db push` | Sync `prisma/schema.prisma` to `dev.db` (no migration history — fine for a prototype) |
| `npx prisma generate` | Regenerate the Prisma client into `src/generated/prisma` (runs automatically after `npm install` via most workflows, but run it manually after editing the schema) |
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
compatibility) is built behind a single `interpreter` interface (PRD §7.3)
so the model is swappable and testable offline. With `DEEPSEEK_API_KEY`
**unset**, the interpreter falls back to a deterministic mock that returns
plausible-looking structured output from the chart JSON — useful for UI
work and tests without burning API credits. Set `DEEPSEEK_API_KEY` (and
optionally override `DEEPSEEK_BASE_URL`) in `.env` to switch the same code
path to live DeepSeek calls. No other config changes are needed.

## Project layout

```
src/
  app/                 Routes (App Router): / (Reading), /master, /today, /match, /me
  components/          Shared UI (nav, theme toggle, site header, stub-page layout)
  lib/                 db.ts (Prisma singleton), session.ts (anon cookie), theme.ts, nav.ts
  generated/prisma/    Generated Prisma client (git-ignored, run `prisma generate` to recreate)
prisma/
  schema.prisma        Data model (PRD §10): User, Profile, Reading, ChatThread/Message,
                        CompatibilityPair, DailyFortune
```

## Design system

The palette, type stack, and light/dark tokens (PRD §8) live as CSS custom
properties in `src/app/globals.css` and are re-exposed to Tailwind v4 via an
`@theme inline` block, so `bg-paper`, `text-ink`, `bg-cinnabar`, `text-jade`,
`text-brass`, `border-line`, `bg-panel`, `font-serif`, `font-sans`, and
`font-mono` are all available as utility classes and stay in sync with the
active theme. Theme resolution order: light (default) →
`prefers-color-scheme: dark` → explicit `data-theme` on `<html>` (set by the
toggle button in the header, persisted to `localStorage`), with the explicit
choice always winning.

## Sessions

There's no real auth in the prototype (PRD §7.6 — freemium is *designed*,
not enforced). `src/lib/session.ts` gives every visitor an anonymous,
httpOnly `cid` cookie whose value doubles as their `User.id`, so saved
profiles/readings survive a refresh with no signup step.

## Testing

`npm test` runs Vitest against `src/**/*.test.ts`, including a real
create/read/delete round-trip against the local SQLite database
(`src/lib/db.test.ts`) to verify the Prisma driver-adapter wiring actually
works, not just that it type-checks.
