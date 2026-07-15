/**
 * Generic share-image Route Handler (PRD §5.5/§7.5): `/api/share/[type]/[id]`
 * renders a branded PNG for whatever `type` names, using `ImageResponse`
 * from `next/og` (built-in, no `@vercel/og` package needed). T6 shipped
 * "compatibility"; T7 added "reading" (natal) and "daily", completing the
 * share loop across all three surfaces (PRD §7.6/§14: the share loop is a
 * named competitor gap).
 *
 * Public/unauthenticated by design (see `../compat-data.ts`'s file header):
 * this is the URL a link-preview bot or a friend's browser fetches with no
 * session cookie at all — the whole point of a share image. For "reading"
 * and "daily", `id` is a *profile* id (there's no separate reading/daily-
 * fortune id in either route's own URL — `/reading/[id]` and `/today` both
 * key off the profile), matching those routes' own conventions.
 *
 * STRICTLY READ-ONLY (see FIX-report.md item 2): `id` not resolving to a
 * persisted profile/reading/pair, or resolving to a profile that hasn't
 * generated a reading/daily-fortune yet, is NOT a 404 here — it renders the
 * same branded FALLBACK card `opengraph-image.tsx`'s file-convention hooks
 * already fall back to for an unpersisted id, so a link-preview bot or a
 * curious visitor always sees on-brand art, never a broken-image icon.
 * Every `load*CardData` this route calls is itself read-only (no interpreter
 * call, no DB write) — see each loader's own file header.
 *
 * `?size=story` renders the tall 1080×1920 Instagram/TikTok-story frame
 * instead of the default 1200×630 link-preview size (see `../render.tsx`'s
 * `SHARE_SIZES`).
 */
import { loadCompatCardData } from "../../compat-data";
import { loadDailyCardData } from "../../daily-data";
import { loadReadingCardData } from "../../reading-data";
import {
  COMPAT_CARD_FALLBACK,
  dailyCardFallback,
  READING_CARD_FALLBACK,
  renderCompatibilityCard,
  renderDailyCard,
  renderReadingCard,
  resolveSizeKey,
} from "../../render";

export async function GET(request: Request, ctx: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const sizeKey = resolveSizeKey(searchParams.get("size"));

  switch (type) {
    case "compatibility": {
      const data = await loadCompatCardData(id);
      return renderCompatibilityCard(data ?? COMPAT_CARD_FALLBACK, sizeKey);
    }
    case "reading": {
      const data = await loadReadingCardData(id);
      return renderReadingCard(data ?? READING_CARD_FALLBACK, sizeKey);
    }
    case "daily": {
      const data = await loadDailyCardData(id);
      return renderDailyCard(data ?? dailyCardFallback(), sizeKey);
    }
    default:
      return new Response(`Unknown share type "${type}". Supported: compatibility, reading, daily.`, {
        status: 400,
      });
  }
}
