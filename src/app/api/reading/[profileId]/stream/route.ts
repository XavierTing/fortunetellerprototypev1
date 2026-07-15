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
 */
import { db } from "@/lib/db";
import { getInterpreter } from "@/lib/interpreter/interpreter";
import type { Card, Chart } from "@/lib/interpreter/types";
import { getSessionUserId } from "@/lib/session";

export async function GET(_request: Request, ctx: { params: Promise<{ profileId: string }> }) {
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

        const interpreter = getInterpreter();
        const cards: Card[] = [];
        for await (const card of interpreter.streamNatalReading(chart)) {
          cards.push(card);
          send("card", card);
        }

        await db.reading.create({
          data: { profileId, cards: JSON.stringify(cards), model: interpreter.model },
        });

        send("done", { model: interpreter.model });
        closed = true;
        controller.close();
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
