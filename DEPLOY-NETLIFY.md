# Deploying Cinnabar to Netlify (with Supabase Postgres)

The app is Netlify-ready: SSR pages + API routes run as Netlify Functions via
the official Next.js runtime. You supply two things (never in git): a **Supabase
database** and your **secret env vars**.

Why a hosted database? Serverless hosts have an ephemeral, read-only filesystem,
so the app can't use a local file DB in production — it uses **Supabase**
(Postgres) via Prisma's `pg` driver adapter.

Three steps. Step 1 is already done in the repo. You do 2 and 3 — both in a
browser, no CLI needed.

---

## 1. Repo prep — DONE ✅
Already committed:
- Prisma provider is **`postgresql`**; `src/lib/db.ts` uses the **`pg`** adapter (`DATABASE_URL`).
- `package.json` build runs `prisma generate && next build`.
- `netlify.toml` (Node 22 + the Next.js plugin).
- `prisma/supabase-schema.sql` — the Postgres schema to load into Supabase.

## 2. Create the Supabase database (~3 min, all in the dashboard)

1. Go to **supabase.com → New project**. Pick a name, a region near your users,
   and a strong **database password** (save it — you'll need it in step 3).
2. When the project is ready, open **SQL Editor → New query**, paste the entire
   contents of **`prisma/supabase-schema.sql`**, and click **Run**. This creates
   all 7 tables + indexes. (Table Editor should now show User, Profile, Reading,
   ChatThread, ChatMessage, CompatibilityPair, DailyFortune.)
3. Get the connection string for serverless: **Project Settings → Database →
   Connection string → "Connection pooling" → Transaction mode**, "URI" format.
   It looks like:
   ```
   postgresql://postgres.<ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:6543/postgres
   ```
   Replace `[YOUR-PASSWORD]` with the password from step 1. **This whole string
   is your `DATABASE_URL`** — use the **pooler** (port `6543`), not the direct
   `db.<ref>.supabase.co:5432` one.

## 3. Deploy on Netlify (clicks + paste)

1. **app.netlify.com → Add new site → Import an existing project → GitHub →** pick **`fortunetellerprototypev1`**.
2. Netlify auto-detects Next.js; leave the build command as detected (`npm run build`) — `netlify.toml` handles the rest.
3. **Site configuration → Environment variables**, add:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | the Supabase **pooler** string from step 2 |
   | `DEEPSEEK_API_KEY` | your `sk-…` key (or leave unset to run the built-in mock readings) |
   | `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` |

4. **Trigger deploy** (Deploys → Trigger deploy → Deploy site) so it picks up the env vars.

Your secrets live in Netlify + Supabase, and the repo stays clean.

---

## Local development
Local dev now needs a Postgres too (the app no longer uses a file DB). Easiest:
put the same Supabase connection string in your local **`.env`** as
`DATABASE_URL` (the direct `…:5432` connection is fine locally), then
`npm run dev`. (Or run a local Postgres if you prefer to keep dev data separate.)
The DB round-trip test (`src/lib/db.test.ts`) runs only when `DATABASE_URL` is a
`postgres://` URL, and is skipped otherwise — so `npm test` stays green with no DB.

## Notes & gotchas
- **Next.js 16 compatibility:** built on a very new Next 16. If the Netlify build
  fails inside `@netlify/plugin-nextjs`, it's a runtime/version mismatch — pin
  the plugin or Next to a Netlify-supported release (ping me with the log).
- **Pooler mode:** the Transaction pooler works because node-postgres issues
  unnamed queries. If you ever see `prepared statement "…" already exists`, switch
  the connection string to the **Session** pooler, or append `?pgbouncer=true`.
- **Rate limiting** is in-memory (resets per function instance) — fine for a prototype.
- **No `DEEPSEEK_API_KEY`?** The app still deploys and works on the built-in mock readings.
- **Illustrations** are already committed (`public/…`), so they ship with the deploy.
- **Schema changes later:** edit `prisma/schema.prisma`, then regenerate the SQL:
  `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > prisma/supabase-schema.sql`, and run the new statements in the Supabase SQL Editor.
