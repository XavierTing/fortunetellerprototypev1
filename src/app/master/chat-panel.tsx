"use client";

/**
 * Drives the 师傅 chat (PRD §5.3). POST + a manually-read `fetch` stream is
 * used instead of `EventSource` (the pattern `ReadingStream` uses for the
 * natal reading) because the client has to send a message body — EventSource
 * only issues GET requests. The wire format is otherwise the same hand-rolled
 * SSE framing (`event: X\ndata: Y\n\n`) the reading stream route already
 * established, just parsed by hand here instead of by the browser.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Field, Input } from "@/components/ui";
import { AssistantBubble, EmptyChatIntro, UserBubble } from "./chat-parts";
import type { ChatWireMessage } from "./types";

const SUGGESTED_PROMPTS = [
  "When's a good year to change careers?",
  "How do I work with my weakest element?",
  "What should I know about my relationships?",
] as const;

type Status = "idle" | "streaming" | "error";

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

function parseSseFrame(frame: string): { event: string; data: string } | null {
  let event = "message";
  let data = "";
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) event = line.slice("event:".length).trim();
    else if (line.startsWith("data:")) data = line.slice("data:".length).trim();
  }
  return data ? { event, data } : null;
}

export function ChatPanel({
  profileId,
  initialMessages,
}: {
  profileId: string;
  initialMessages: ChatWireMessage[];
}) {
  const [messages, setMessages] = useState<LocalMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function sendMessage(raw: string) {
    const text = raw.trim();
    if (!text || status === "streaming") return;

    setErrorMessage(null);
    setInput("");
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
      { id: assistantId, role: "assistant", content: "", pending: true },
    ]);
    setStatus("streaming");

    const settleAssistant = () =>
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, pending: false } : m)));

    try {
      const res = await fetch(`/api/master/${profileId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok || !res.body) {
        // A 429 (rate-limited) response carries a friendly, specific
        // message as JSON — surface it instead of the generic fallback in
        // the outer catch below (see src/lib/rate-limit.ts).
        if (res.status === 429) {
          const body = (await res.json().catch(() => null)) as { message?: string } | null;
          throw new Error(body?.message ?? "The Master needs a moment — you're asking quite quickly. Try again shortly.");
        }
        throw new Error(`request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let settled = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const rawFrame of frames) {
          const parsed = parseSseFrame(rawFrame);
          if (!parsed) continue;

          if (parsed.event === "token") {
            const { chunk } = JSON.parse(parsed.data) as { chunk: string };
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
            );
          } else if (parsed.event === "done") {
            settled = true;
            settleAssistant();
            setStatus("idle");
          } else if (parsed.event === "error") {
            const { message } = JSON.parse(parsed.data) as { message?: string };
            settled = true;
            settleAssistant();
            setErrorMessage(message ?? "The Master stumbled over that one. Please try again.");
            setStatus("error");
          }
        }
      }

      if (!settled) {
        settleAssistant();
        setStatus("idle");
      }
    } catch (err) {
      settleAssistant();
      setErrorMessage(err instanceof Error ? err.message : "The connection dropped while the Master was replying. Please try again.");
      setStatus("error");
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="flex flex-col gap-8">
      {messages.length === 0 ? (
        <EmptyChatIntro prompts={SUGGESTED_PROMPTS} onPick={(p) => void sendMessage(p)} disabled={status === "streaming"} />
      ) : (
        <div role="log" aria-live="polite" aria-atomic="false" className="flex flex-col gap-5">
          {messages.map((m) =>
            m.role === "user" ? (
              <UserBubble key={m.id} content={m.content} />
            ) : (
              <AssistantBubble key={m.id} content={m.content} pending={m.pending} />
            )
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {errorMessage && (
        <p role="alert" className="text-sm text-cinnabar">
          {errorMessage}
        </p>
      )}

      <form onSubmit={onSubmit} className="flex items-end gap-3 border-t border-hairline pt-6">
        <Field label="Ask the master" htmlFor="master-chat-input" className="flex-1">
          <Input
            id="master-chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your chart…"
            maxLength={4000}
            disabled={status === "streaming"}
            autoComplete="off"
          />
        </Field>
        <Button type="submit" disabled={status === "streaming" || input.trim().length === 0}>
          {status === "streaming" ? "…" : "Ask"}
        </Button>
      </form>
    </div>
  );
}
