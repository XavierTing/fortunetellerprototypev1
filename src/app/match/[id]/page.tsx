import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Eyebrow, Section } from "@/components/ui";
import { db } from "@/lib/db";
import type { Chart, Compat } from "@/lib/interpreter/types";
import { getSessionUserId } from "@/lib/session";
import type { PersonBRecord } from "../types";
import { CompatResult } from "./compat-result";

export const metadata: Metadata = {
  title: "Compatibility · Cinnabar",
  description: "A relationship reading between two charts — engine-computed facts, plain English, and a verdict.",
};

/**
 * The detailed compatibility reading. Session-scoped to the profileA owner
 * (same auth posture as `reading/[id]/page.tsx`) — birth data and the full
 * reading text stay private to the person who ran the check; the *public*
 * artifact meant for sharing is the OG image (`./opengraph-image.tsx`) and
 * the `/api/share/compatibility/[id]` card, which expose only the score,
 * verdict, and the two display names (see `api/share/compat-data.ts`).
 */
export default async function MatchResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const userId = await getSessionUserId();
  if (!userId) notFound();

  const pair = await db.compatibilityPair.findUnique({ where: { id }, include: { profileA: true } });
  if (!pair || pair.profileA.userId !== userId || !pair.profileA.chartCache) notFound();

  const chartA = JSON.parse(pair.profileA.chartCache) as Chart;
  const personB = JSON.parse(pair.personB) as PersonBRecord;
  const result = JSON.parse(pair.result) as Compat;

  const nameA = pair.profileA.name?.trim() || "You";
  const nameB = personB.name?.trim() || "Them";

  return (
    <Section className="flex flex-col gap-10 py-16 sm:py-24">
      <div className="flex flex-col gap-3">
        <Eyebrow>合 · Compatibility</Eyebrow>
        <h1 className="max-w-2xl font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.08] font-light tracking-[-0.015em] text-ink">
          {nameA} &amp; {nameB}
        </h1>
        <p className="font-mono text-xs text-faint">
          {nameB}&apos;s chart cast from {personB.cityLabel} · {personB.time ? `at ${personB.time}` : "time unknown"}
        </p>
      </div>

      <CompatResult
        pairId={pair.id}
        nameA={nameA}
        nameB={nameB}
        chartA={chartA}
        chartB={personB.chart}
        result={result}
      />
    </Section>
  );
}
