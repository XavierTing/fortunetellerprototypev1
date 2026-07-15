/**
 * Generic share-image Route Handler (PRD §5.5/§7.5): `/api/share/[type]/[id]`
 * renders a branded PNG for whatever `type` names, using `ImageResponse`
 * from `next/og` (built-in, no `@vercel/og` package needed). Only
 * "compatibility" is implemented — the switch below is the seam a later
 * milestone extends for reading/daily share cards, per this task's brief
 * ("structure the route generically enough that reading/daily share cards
 * can be added later").
 *
 * Public/unauthenticated by design (see `../compat-data.ts`'s file header):
 * this is the URL a link-preview bot or a friend's browser fetches with no
 * session cookie at all — the whole point of a share image.
 *
 * `?size=story` renders the tall 1080×1920 Instagram/TikTok-story frame
 * instead of the default 1200×630 link-preview size (see `../render.tsx`'s
 * `SHARE_SIZES`).
 */
import { loadCompatCardData } from "../../compat-data";
import { renderCompatibilityCard, resolveSizeKey } from "../../render";

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
    default:
      return new Response(`Unknown share type "${type}". Supported: compatibility.`, { status: 400 });
  }
}
