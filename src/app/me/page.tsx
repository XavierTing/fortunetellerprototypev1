import type { Metadata } from "next";
import { Button, Eyebrow, Section } from "@/components/ui";
import { db } from "@/lib/db";
import { ELEMENT_LABEL } from "@/lib/interpreter/five-elements";
import type { Chart, Compat } from "@/lib/interpreter/types";
import { getSessionUserId } from "@/lib/session";
import type { PersonBRecord } from "@/app/match/types";
import { ElementBalanceChart } from "@/app/reading/[id]/element-balance";
import { deleteMyData } from "./actions";
import { DeleteDataButton } from "./delete-data-button";
import { MeEmptyState } from "./empty-state";
import { EmptyRow, HistoryRow } from "./history-row";

export const metadata: Metadata = {
  title: "Me · Cinnabar",
  description: "Your saved chart, past readings, chat threads, and compatibility checks — all in one place.",
};

function formatBirthLine(birthTime: string | null, chart: Chart): string {
  const [year, month, day] = chart.input.date.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const dateStr = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  const timePart = birthTime ? `at ${birthTime}` : "time unknown";
  return `${dateStr}, ${timePart} · ${chart.input.tzId}`;
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function capitalize(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

export default async function MePage() {
  const userId = await getSessionUserId();

  const profile = userId
    ? await db.profile.findFirst({
        where: { userId, isSelf: true, chartCache: { not: null } },
        orderBy: { createdAt: "desc" },
      })
    : null;

  if (!userId || !profile || !profile.chartCache) {
    return <MeEmptyState />;
  }

  const chart = JSON.parse(profile.chartCache) as Chart;

  const [readings, threads, pairs] = await Promise.all([
    db.reading.findMany({
      where: { profile: { userId } },
      orderBy: { generatedAt: "desc" },
      include: { profile: true },
      take: 20,
    }),
    db.chatThread.findMany({
      where: { profile: { userId } },
      orderBy: { createdAt: "desc" },
      include: { profile: true, _count: { select: { messages: true } } },
      take: 20,
    }),
    db.compatibilityPair.findMany({
      where: { profileA: { userId } },
      orderBy: { createdAt: "desc" },
      include: { profileA: true },
      take: 20,
    }),
  ]);

  return (
    <Section className="flex flex-col gap-14 py-16 sm:py-24">
      <div className="animate-rise-in flex flex-col gap-3">
        <Eyebrow>
          <span className="font-cjk">我</span> · Me
        </Eyebrow>
        <div className="flex items-start justify-between gap-6">
          <h1 className="max-w-2xl font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.08] font-light tracking-[-0.015em] text-ink">
            {profile.name ? profile.name : "Your profile"}
          </h1>
          <span
            aria-hidden="true"
            className="hidden shrink-0 font-cjk text-7xl leading-none text-ink/[0.08] sm:block"
          >
            我
          </span>
        </div>
        <p className="font-mono text-xs text-faint">Born {formatBirthLine(profile.birthTime, chart)}</p>
      </div>

      {/* Compact chart summary — reuses the reading page's own element-balance
          visualization rather than re-implementing a second five-element
          chart for this view. */}
      <div className="flex flex-col gap-6 border-y border-hairline py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <p className="max-w-[52ch] text-[0.98rem] leading-relaxed text-text">
            {capitalize(chart.dayMasterStrength)} {ELEMENT_LABEL[chart.dayMaster.element]} Day Master · Year of the{" "}
            {chart.zodiac}
          </p>
          <Button href={`/reading/${profile.id}`} variant="ghost" size="sm">
            View full reading <span aria-hidden="true">→</span>
          </Button>
        </div>
        <ElementBalanceChart chart={chart} />
      </div>

      {/* CTAs — one primary (gold, the One Metal Rule), rest secondary. */}
      <div className="flex flex-wrap items-center gap-3">
        <Button href="/reading/new" size="sm">
          New reading <span aria-hidden="true">→</span>
        </Button>
        <Button href="/master" variant="secondary" tone="cinnabar" size="sm">
          Ask the master
        </Button>
        <Button href="/today" variant="secondary" tone="cinnabar" size="sm">
          Today&apos;s fortune
        </Button>
        <Button href="/match" variant="secondary" tone="cinnabar" size="sm">
          Check compatibility
        </Button>
      </div>

      {/* Readings */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-display text-xl font-medium text-ink">Readings</h2>
          <span className="font-mono text-[0.68rem] tracking-[0.1em] text-faint uppercase">{readings.length}</span>
        </div>
        {readings.length > 0 ? (
          <div className="flex flex-col divide-y divide-hairline border-y border-hairline">
            {readings.map((r) => (
              <HistoryRow
                key={r.id}
                href={`/reading/${r.profileId}`}
                title={r.profile.name ? `${r.profile.name}’s reading` : "Your reading"}
                meta={`${formatShortDate(r.generatedAt)} · ${r.model}`}
              />
            ))}
          </div>
        ) : (
          <EmptyRow>Nothing recorded yet — your first reading takes under a minute.</EmptyRow>
        )}
      </div>

      {/* Chat threads — /master has no per-thread route yet; it always
          resumes the most recent thread for its most recent self profile,
          so every row here links back to the one ongoing conversation. */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-display text-xl font-medium text-ink">Conversations with the Master</h2>
          <span className="font-mono text-[0.68rem] tracking-[0.1em] text-faint uppercase">{threads.length}</span>
        </div>
        {threads.length > 0 ? (
          <div className="flex flex-col divide-y divide-hairline border-y border-hairline">
            {threads.map((t) => (
              <HistoryRow
                key={t.id}
                href="/master"
                title={t.profile.name ? `${t.profile.name}’s conversation` : "Your conversation"}
                meta={`Started ${formatShortDate(t.createdAt)}`}
                tag={`${t._count.messages} ${t._count.messages === 1 ? "message" : "messages"}`}
              />
            ))}
          </div>
        ) : (
          <EmptyRow>No conversations yet — the 师傅 is only ever a question away.</EmptyRow>
        )}
      </div>

      {/* Compatibility */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-display text-xl font-medium text-ink">Compatibility</h2>
          <span className="font-mono text-[0.68rem] tracking-[0.1em] text-faint uppercase">{pairs.length}</span>
        </div>
        {pairs.length > 0 ? (
          <div className="flex flex-col divide-y divide-hairline border-y border-hairline">
            {pairs.map((p) => {
              const personB = JSON.parse(p.personB) as PersonBRecord;
              const result = JSON.parse(p.result) as Compat;
              const nameA = p.profileA.name?.trim() || "You";
              const nameB = personB.name?.trim() || "Them";
              return (
                <HistoryRow
                  key={p.id}
                  href={`/match/${p.id}`}
                  title={`${nameA} & ${nameB}`}
                  meta={formatShortDate(p.createdAt)}
                  tag={`${Math.round(result.score)}`}
                />
              );
            })}
          </div>
        ) : (
          <EmptyRow>No compatibility checks yet — see how your chart sits beside someone else&apos;s.</EmptyRow>
        )}
      </div>

      {/* Privacy (PRD §11's commitment: "allow profile deletion"). */}
      <div className="flex flex-col gap-4 border-t border-hairline pt-10">
        <h2 className="font-display text-xl font-medium text-ink">Privacy</h2>
        <p className="max-w-[56ch] text-sm leading-relaxed text-muted">
          Cinnabar has no login — this data is tied only to an anonymous session on this device. Deleting it removes
          your chart, every reading, every 师傅 conversation, and every compatibility check for this session,
          permanently.
        </p>
        <DeleteDataButton action={deleteMyData} />
      </div>
    </Section>
  );
}
