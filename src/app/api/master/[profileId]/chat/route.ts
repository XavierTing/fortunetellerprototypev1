/**
 * 师傅 chat turn (PRD §5.3): accept one user message, stream the assistant's
 * reply back as Server-Sent Events over the Web Streams API — the same
 * hand-rolled SSE framing `src/app/api/reading/[profileId]/stream/route.ts`
 * uses, POST instead of GET because the client has to send a message body
 * (EventSource on the client only supports GET, so the ChatPanel reads this
 * with `fetch` + a manual stream reader instead).
 *
 * Auth: identical anon-session-owns-profile check as the reading stream
 * route. Grounding: the profile's cached chart + its most recently
 * generated Reading, exactly as interpreter.chat(chart, reading, messages)
 * expects (PRD: "given the chart JSON + the generated reading as context").
 * If no Reading has been generated yet for this profile (the user reached
 * /master without ever loading /reading/[id]), one is generated and saved
 * here so chat never hard-depends on page-visit ordering — mirroring the
 * reading stream route's own idempotent-generation pattern.
 *
 * Persistence: one ChatThread per profile (created lazily on first
 * message — PRD §5.3 describes a single "chat thread scoped to a saved
 * profile"); every user + assistant turn is saved as a ChatMessage row so
 * the thread survives a refresh (src/app/master/page.tsx reloads it on
 * every visit).
 */
import { z } from "zod";
import { db } from "@/lib/db";
import { getInterpreter } from "@/lib/interpreter/interpreter";
import type { Chart, ChatMessage as InterpreterChatMessage, Reading } from "@/lib/interpreter/types";
import { getSessionUserId } from "@/lib/session";

const BodySchema = z.object({
  message: z.string().trim().min(1, "A non-empty message is required.").max(4000, "That message is too long."),
});

function isChatRole(role: string): role is "user" | "assistant" {
  return role === "user" || role === "assistant";
}

export async function POST(request: Request, ctx: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await ctx.params;

  const userId = await getSessionUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const profile = await db.profile.findUnique({ where: { id: profileId } });
  if (!profile || profile.userId !== userId || !profile.chartCache) {
    return new Response("Not found", { status: 404 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  const parsedBody = BodySchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return new Response(parsedBody.error.issues[0]?.message ?? "Invalid request body", { status: 400 });
  }
  const userText = parsedBody.data.message;

  const chart = JSON.parse(profile.chartCache) as Chart;

  const thread =
    (await db.chatThread.findFirst({ where: { profileId }, orderBy: { createdAt: "desc" } })) ??
    (await db.chatThread.create({ data: { profileId } }));

  const priorRows = await db.chatMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
  });
  const history: InterpreterChatMessage[] = priorRows
    .filter((m) => isChatRole(m.role))
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  await db.chatMessage.create({ data: { threadId: thread.id, role: "user", content: userText } });

  const interpreter = getInterpreter();

  const readingRow = await db.reading.findFirst({ where: { profileId }, orderBy: { generatedAt: "desc" } });
  let reading: Reading;
  if (readingRow) {
    reading = { cards: JSON.parse(readingRow.cards), model: readingRow.model };
  } else {
    reading = await interpreter.natalReading(chart);
    await db.reading.create({
      data: { profileId, cards: JSON.stringify(reading.cards), model: reading.model },
    });
  }

  const messages: InterpreterChatMessage[] = [...history, { role: "user", content: userText }];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      let full = "";
      try {
        for await (const chunk of interpreter.chat(chart, reading, messages)) {
          full += chunk;
          send("token", { chunk });
        }

        const saved = await db.chatMessage.create({
          data: { threadId: thread.id, role: "assistant", content: full.trim().length > 0 ? full : "…" },
        });

        send("done", { id: saved.id, createdAt: saved.createdAt.toISOString() });
        closed = true;
        controller.close();
      } catch (err) {
        console.error("master chat: generation failed", err);
        send("error", {
          message: "The 师傅 hit a snag replying. Please try asking again.",
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
