/**
 * Generic share-image Route Handler (PRD §5.5/§7.5): `/api/share/[type]/[id]`
 * renders a branded PNG for whatever `type` names, using `ImageResponse`
 * from `next/og` (built-in, no `@vercel/og` package needed). T6 shipped
 * "compatibility"; T7 (this task) adds "reading" (natal) and "daily",
 * completing the share loop across all three surfaces (PRD §7.6/§14: the
 * share loop is a named competitor gap).
 *
 * Public/unauthenticated by design (see `../compat-data.ts`'s file header):
 * this is the URL a link-preview bot or a friend's browser fetches with no
 * session cookie at all — the whole point of a share image. For "reading"
 * and "daily", `id` is a *profile* id (there's no separate reading/daily-
 * fortune id in either route's own URL — `/reading/[id]` and `/today` both
 * key off the profile), matching those routes' own conventions.
 *
 * `?size=story` renders the tall 1080×1920 Instagram/TikTok-story frame
 * instead of the default 1200×630 link-preview size (see `../render.tsx`'s
 * `SHARE_SIZES`).
 */
import { loadCompatCardData } from "../../compat-data";
import { loadDailyCardData } from "../../daily-data";
import { loadReadingCardData } from "../../reading-data";
import { renderCompatibilityCard, renderDailyCard, renderReadingCard, resolveSizeKey } from "../../render";

export async function GET(request: Request, ctx: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const sizeKey = resolveSizeKey(searchParams.get("size"));

  switch (type) {
    case "compatibility": {
      const data = await loadCompatCardData(id);
      if (!data) return new Response("Not found", { status: 404 });
      return renderCompatibilityCard(data, sizeKey);
    }
    case "reading": {
      const data = await loadReadingCardData(id);
      if (!data) return new Response("Not found", { status: 404 });
      return renderReadingCard(data, sizeKey);
    }
    case "daily": {
      const data = await loadDailyCardData(id);
      if (!data) return new Response("Not found", { status: 404 });
      return renderDailyCard(data, sizeKey);
    }
    default:
      return new Response(`Unknown share type "${type}". Supported: compatibility, reading, daily.`, {
        status: 400,
      });
  }
}
