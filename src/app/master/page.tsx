import type { Metadata } from "next";
import Image from "next/image";
import { Button, Card, Eyebrow, PaywallSlot, Section } from "@/components/ui";
import { db } from "@/lib/db";
import { ELEMENT_LABEL } from "@/lib/interpreter/five-elements";
import { emptyStateImageSrc } from "@/lib/illustrations";
import type { Chart } from "@/lib/interpreter/types";
import { getSessionUserId } from "@/lib/session";
import { ChatPanel } from "./chat-panel";
import type { ChatWireMessage } from "./types";

export const metadata: Metadata = {
  title: "The Master · Cinnabar",
  description: "Chat with your 师傅 about your chart in plain English — grounded in your actual pillars.",
};

function isChatRole(role: string): role is "user" | "assistant" {
  return role === "user" || role === "assistant";
}

/**
 * A quiet illustration (`/illustrations/empty-master.png`) bleeds off the
 * right edge behind the copy, low-opacity — same `relative overflow-hidden`
 * + `-z-10` treatment as `today/empty-state.tsx`, `me/empty-state.tsx`, and
 * `match/empty-state.tsx`.
 */
function EmptyState() {
  return (
    <div className="relative overflow-hidden">
      <Image
        src={emptyStateImageSrc("master")}
        alt=""
        aria-hidden="true"
        width={480}
        height={480}
        className="pointer-events-none absolute top-1/2 -right-10 -z-10 h-auto w-[46vw] max-w-sm -translate-y-1/2 object-contain opacity-[0.14] sm:opacity-[0.18]"
      />
      <Section className="flex flex-col gap-10 py-16 sm:py-24">
        <div className="animate-rise-in flex flex-col gap-4">
          <Eyebrow>
            <span className="font-cjk">師傅</span> · The Master
          </Eyebrow>
          <h1 className="max-w-xl font-display text-[clamp(2.25rem,5vw,3.5rem)] font-light leading-[1.05] tracking-[-0.015em] text-ink">
            The master keeps silence until there is a chart to read.
          </h1>
        </div>

        <Card
          className="animate-rise-in flex max-w-2xl flex-col items-start gap-5 p-8 sm:p-10"
          style={{ animationDelay: "120ms" }}
        >
          <span
            aria-hidden="true"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-hairline font-cjk text-xl text-cinnabar"
          >
            師
          </span>
          <p className="max-w-[52ch] text-[1.02rem] leading-relaxed text-muted">
            Every word he offers is drawn from your own pillars — there is nothing yet to draw from. Cast your chart
            once, free and in under a minute, and the conversation can begin.
          </p>
          <Button href="/reading/new">
            Reveal your chart <span aria-hidden="true">→</span>
          </Button>
        </Card>
      </Section>
    </div>
  );
}

export default async function MasterPage() {
  const userId = await getSessionUserId();

  const profile = userId
    ? await db.profile.findFirst({
        where: { userId, isSelf: true },
        orderBy: { createdAt: "desc" },
      })
    : null;

  if (!profile || !profile.chartCache) {
    return <EmptyState />;
  }

  const chart = JSON.parse(profile.chartCache) as Chart;

  const thread = await db.chatThread.findFirst({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  const initialMessages: ChatWireMessage[] = (thread?.messages ?? [])
    .filter((m) => isChatRole(m.role))
    .map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));

  return (
    <Section className="flex flex-col gap-12 py-16 sm:py-24">
      <div className="animate-rise-in flex flex-col gap-3">
        <Eyebrow>
          <span className="font-cjk">師傅</span> · The Master
        </Eyebrow>
        <div className="flex items-start justify-between gap-6">
          <h1 className="max-w-2xl font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.08] font-light tracking-[-0.015em] text-ink">
            Ask your <span className="font-cjk">师傅</span>.
          </h1>
          <span
            aria-hidden="true"
            className="hidden shrink-0 font-cjk text-7xl leading-none text-ink/[0.08] sm:block"
          >
            師
          </span>
        </div>
        <p className="max-w-[62ch] text-[1.02rem] leading-relaxed text-muted">
          {profile.name ? `${profile.name}’s` : "Your"} chart, held in conversation — a{" "}
          {chart.dayMasterStrength} {ELEMENT_LABEL[chart.dayMaster.element]} Day Master, {chart.zodiac} year.
        </p>
      </div>

      <div className="border-t border-hairline pt-10">
        <ChatPanel profileId={profile.id} initialMessages={initialMessages} />
      </div>

      <PaywallSlot
        label="Unlimited chat"
        note="A free tier usually caps replies per day — every message here is unlocked in this prototype."
      />
    </Section>
  );
}
