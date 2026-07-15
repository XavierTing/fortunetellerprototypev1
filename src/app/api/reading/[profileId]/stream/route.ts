/**
 * Streams a natal reading's cards as they're generated (PRD §5.2: "Stream
 * cards as they generate"). A Server Action's response is a single
 * roundtrip, so incremental per-card delivery lives here instead, as a
 * hand-rolled Server-Sent-Events stream over the Web Streams API (see
 * Next.js's Route Handlers streaming guide).
 *
 * Auth: the anon session cookie must match the profile's owner — no
 * separate "login," but a stranger with a guessed profile id still can't
 * read someone else's reading.
 *
 * Idempotency: if a Reading already exists for this profile (e.g. a second
 * tab, or a retry), replay its saved cards instead of paying for a second
 * LLM generation. Otherwise, stream fresh cards from the interpreter and
 * persist the finished Reading once all cards have arrived.
 *
 * Cost control + dedup (PRD §11, FIX-report.md items 1 & 5): this route is
 * the app's ONE natal-reading generation trigger (the share/OG paths are
 * now strictly read-only — see reading-data.ts — and /master's chat route
 * grounds itself on a lightweight chart-only summary instead of triggering
 * a full reading). Two guards apply only on the actual-generation branch
 * (a cache hit above costs nothing and is never rate-limited or deduped):
 *   1. `checkDualRateLimit` — a per-session + per-IP token bucket.
 *   2. `inFlightReadingGenerations` — an in-memory, single-instance map
 *      that lets a second concurrent request for the SAME profile (e.g. two
 *      tabs opened at once) await the first request's in-progress
 *      generation instead of starting its own. This is intentionally
 *      simple, not a fully general lock: it dedupes concurrent requests
 *      within one server process only. A residual race across MULTIPLE
 *      process instances (each with its own empty map) is accepted rather
 *      than solved — `db.reading.findFirst(...orderBy generatedAt desc)`
 *      already always reads the latest row, so the only cost of that rarer
 *      race is one extra LLM generation, never inconsistent data. Not
 *      shared across instances/restarts, same prototype-scoped caveat as
 *      `src/lib/rate-limit.ts`.
 */
import { db } from "@/lib/db";
import { getInterpreter } from "@/lib/interpreter/interpreter";
import type { Card, Chart } from "@/lib/interpreter/types";
import { checkDualRateLimit, getClientIp, rateLimitMessage } from "@/lib/rate-limit";
import { getSessionUserId } from "@/lib/session";

/** See this file's header — keyed by profileId, cleared as soon as the primary generation settles (success or failure). */
const inFlightReadingGenerations = new Map<string, Promise<{ cards: Card[]; model: string }>>();

export async function GET(request: Request, ctx: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await ctx.params;

  const userId = await getSessionUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const profile = await db.profile.findUnique({ where: { id: profileId } });
  if (!profile || profile.userId !== userId || !profile.chartCache) {
    return new Response("Not found", { status: 404 });
  }

  const chart = JSON.parse(profile.chartCache) as Chart;
  const existing = await db.reading.findFirst({
    where: { profileId },
    orderBy: { generatedAt: "desc" },
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        if (existing) {
          const cards = JSON.parse(existing.cards) as Card[];
          for (const card of cards) send("card", card);
          send("done", { model: existing.model });
          closed = true;
          controller.close();
          return;
        }

        // A concurrent request for this same profile is already generating
        // — wait for it instead of paying for a second generation, then
        // replay its result as a fast batch (not truly live for this
        // caller, but correct and free).
        const inFlight = inFlightReadingGenerations.get(profileId);
        if (inFlight) {
          const { cards, model } = await inFlight;
          for (const card of cards) send("card", card);
          send("done", { model });
          closed = true;
          controller.close();
          return;
        }

        const rateLimit = checkDualRateLimit("reading", userId, getClientIp(request.headers));
        if (!rateLimit.allowed) {
          send("error", { message: rateLimitMessage("reading") });
          closed = true;
          controller.close();
          return;
        }

        const cards: Card[] = [];
        let resolveShared: ((v: { cards: Card[]; model: string }) => void) | undefined;
        let rejectShared: ((e: unknown) => void) | undefined;
        const shared = new Promise<{ cards: Card[]; model: string }>((resolve, reject) => {
          resolveShared = resolve;
          rejectShared = reject;
        });
        inFlightReadingGenerations.set(profileId, shared);

        try {
          const interpreter = getInterpreter();
          for await (const card of interpreter.streamNatalReading(chart)) {
            cards.push(card);
            send("card", card);
          }

          await db.reading.create({
            data: { profileId, cards: JSON.stringify(cards), model: interpreter.model },
          });

          send("done", { model: interpreter.model });
          resolveShared?.({ cards, model: interpreter.model });
          closed = true;
          controller.close();
        } catch (err) {
          rejectShared?.(err);
          throw err;
        } finally {
          inFlightReadingGenerations.delete(profileId);
        }
      } catch (err) {
        console.error("reading stream: generation failed", err);
        send("error", {
          message: "The reading hit a snag while generating. Please refresh to try again.",
        });
        closed = true;
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
