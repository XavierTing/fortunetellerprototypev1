import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Eyebrow, Section } from "@/components/ui";
import { loadReadingCardData } from "@/app/api/share/reading-data";
import { db } from "@/lib/db";
import type { Card, Chart } from "@/lib/interpreter/types";
import { getSessionUserId } from "@/lib/session";
import { ChartSummary } from "./chart-summary";
import { ReadingStream } from "./reading-stream";
import { ReadingTeaser } from "./reading-teaser";
import { ShareButton } from "./share-button";

export const metadata: Metadata = { title: "Your Reading · Cinnabar" };

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

export default async function ReadingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const profile = await db.profile.findUnique({ where: { id } });
  if (!profile || !profile.chartCache) notFound();

  const userId = await getSessionUserId();
  const isOwner = Boolean(userId) && profile.userId === userId;

  // Not the profile's own session (a shared link opened by anyone else, or
  // no session cookie at all): render the public, non-PII teaser instead of
  // a 404 (FIX-report.md item 4 — the share button hands this exact URL
  // out, so it needs to land somewhere real). Never falls through to the
  // owner-only reading below.
  if (!isOwner) {
    const data = await loadReadingCardData(id);
    return <ReadingTeaser data={data} />;
  }

  const chart = JSON.parse(profile.chartCache) as Chart;

  const existingReading = await db.reading.findFirst({
    where: { profileId: id },
    orderBy: { generatedAt: "desc" },
  });
  const initialCards = existingReading ? (JSON.parse(existingReading.cards) as Card[]) : undefined;

  return (
    <Section className="py-16 sm:py-28">
      {/* A hanging scroll (立軸) unrolls in one narrow column, not the
          app's usual wide grid — see the design spec's "Reading as hanging
          scroll" signature moment. Each block below is its own quiet
          segment, divided by a single ink hairline with generous rhythm. */}
      <div className="mx-auto flex max-w-3xl flex-col gap-16">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex flex-col gap-3">
            <Eyebrow>八字 · Natal Reading</Eyebrow>
            <h1 className="max-w-2xl font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.08] font-light tracking-[-0.015em] text-ink">
              {profile.name ? `${profile.name}’s reading` : "Your reading"}
            </h1>
            <p className="font-mono text-xs text-faint">Born {formatBirthLine(profile.birthTime, chart)}</p>
          </div>
          <ShareButton profileId={id} />
        </div>

        <div className="border-t border-hairline pt-16">
          <ChartSummary chart={chart} />
        </div>

        <div className="border-t border-hairline pt-16">
          <ReadingStream profileId={id} chart={chart} initialCards={initialCards} />
        </div>
      </div>
    </Section>
  );
}
