import type { Metadata } from "next";
import { Button, Card, Eyebrow, PaywallSlot, Section } from "@/components/ui";
import { db } from "@/lib/db";
import { ELEMENT_LABEL } from "@/lib/interpreter/five-elements";
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

function EmptyState() {
  return (
    <Section className="flex flex-col gap-10 py-16 sm:py-24">
      <div className="flex flex-col gap-4">
        <Eyebrow>師傅 · The Master</Eyebrow>
        <h1 className="max-w-xl font-display text-[clamp(2.25rem,5vw,3.5rem)] font-light leading-[1.05] tracking-[-0.015em] text-ink">
          The master needs a chart to read.
        </h1>
      </div>

      <Card className="flex max-w-2xl flex-col items-start gap-5 p-8 sm:p-10">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-hairline font-display text-xl text-cinnabar"
        >
          師
        </span>
        <p className="max-w-[52ch] text-[1.02rem] leading-relaxed text-muted">
          Reveal your chart first, then ask the master. Every answer is grounded in your actual pillars — there&apos;s
          nothing to ground a conversation in until your chart exists. It takes under a minute.
        </p>
        <Button href="/reading/new">
          Reveal your chart <span aria-hidden="true">→</span>
        </Button>
      </Card>
    </Section>
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
    <Section className="flex flex-col gap-10 py-16 sm:py-24">
      <div className="flex flex-col gap-3">
        <Eyebrow>師傅 · The Master</Eyebrow>
        <h1 className="max-w-2xl font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.08] font-light tracking-[-0.015em] text-ink">
          Ask your 师傅.
        </h1>
        <p className="max-w-[62ch] text-[1.02rem] leading-relaxed text-muted">
          {profile.name ? `${profile.name}’s` : "Your"} chart, in conversation — a{" "}
          {chart.dayMasterStrength} {ELEMENT_LABEL[chart.dayMaster.element]} Day Master, {chart.zodiac} year.
        </p>
      </div>

      <ChatPanel profileId={profile.id} initialMessages={initialMessages} />

      <PaywallSlot
        label="Unlimited chat"
        note="A free tier usually caps replies per day — every message here is unlocked in this prototype."
      />
    </Section>
  );
}
