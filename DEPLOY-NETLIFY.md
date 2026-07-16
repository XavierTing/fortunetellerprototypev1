# Deploying Cinnabar to Netlify

The app is Netlify-ready: SSR pages + API routes run as Netlify Functions via
the official Next.js runtime. Two things you must supply yourself (never in
git): a **hosted database** and your **secret env vars**.

Why a hosted database? Locally the app uses a SQLite **file** (`dev.db`).
Serverless hosts (Netlify/Vercel) have an ephemeral, read-only filesystem, so a
file DB can't save readings/profiles. We use **Turso** (SQLite-compatible over
libsql) — the same `src/lib/db.ts` code runs on both a local `file:` URL and a
remote `libsql://` URL.

There are three steps. Step 1 is already done in the repo. You do 2 and 3.

---

## 1. Repo prep — DONE ✅
Already committed:
- `src/lib/db.ts` uses the **libsql** Prisma adapter (`DATABASE_URL` + optional `TURSO_AUTH_TOKEN`).
- `package.json` build script runs `prisma generate && next build`.
- `netlify.toml` (Node 22 + the Next.js plugin).
- `prisma/turso-schema.sql` — the schema to load into Turso.

## 2. Create the Turso database (~3 min)

```bash
# Install the Turso CLI (macOS)
curl -sSfL https://get.tur.so/install.sh | bash
# (or: brew install tursodatabase/tap/turso)

turso auth signup          # or: turso auth login   (opens the browser)

# Create the database
turso db create cinnabar

# Load the schema into it
turso db shell cinnabar < prisma/turso-schema.sql

# Grab the two values you'll paste into Netlify:
turso db show cinnabar --url        # -> this is your DATABASE_URL  (libsql://…)
turso db tokens create cinnabar     # -> this is your TURSO_AUTH_TOKEN
```

Keep those two values handy for the next step. (You can sanity-check locally:
put them in `.env` and run `npm run dev` — the app will hit Turso instead of the
local file.)

## 3. Deploy on Netlify (clicks + paste)

1. Go to **app.netlify.com → Add new site → Import an existing project → Deploy with GitHub**, and pick **`fortunetellerprototypev1`**.
2. Netlify auto-detects Next.js. Leave the build command as detected
   (`npm run build`); the `netlify.toml` in the repo sets the rest.
3. Before (or right after) the first deploy, open **Site configuration → Environment variables** and add:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | your Turso `libsql://…` URL |
   | `TURSO_AUTH_TOKEN` | the Turso token |
   | `DEEPSEEK_API_KEY` | your `sk-…` key (or leave unset to run the built-in mock readings) |
   | `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` |

4. **Trigger a deploy** (Deploys → Trigger deploy → Deploy site) so it picks up the env vars.

That's it — your secrets live in Netlify's settings, and the repo stays clean.

---

## Notes & gotchas
- **Next.js 16 compatibility:** this was built on a very new Next 16. If the
  Netlify build fails inside `@netlify/plugin-nextjs`, it's almost certainly a
  runtime/version mismatch — pin the plugin or the Next version to a
  Netlify-supported release (ping me and I'll sort the exact pin).
- **Rate limiting** is in-memory, so it resets per function instance — fine for
  a prototype, just not globally enforced across instances.
- **No `DEEPSEEK_API_KEY`?** The app still deploys and works — it serves the
  built-in mock readings. Add the key whenever you want live DeepSeek.
- **Illustrations** are already committed to the repo (`public/…`), so they ship
  with the deploy; nothing to generate at build time.
- **Schema changes later:** edit `prisma/schema.prisma`, re-dump the SQL, and
  re-apply it to Turso (or use `prisma db push` against a local file, then diff).
