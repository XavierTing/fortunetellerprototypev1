import type { Metadata } from "next";
import { DateTime } from "luxon";
import { Eyebrow, PaywallSlot, Section } from "@/components/ui";
import { db } from "@/lib/db";
import type { Chart } from "@/lib/interpreter/types";
import { getSessionUserId } from "@/lib/session";
import { DailyCard } from "./daily-card";
import { TodayEmptyState } from "./empty-state";
import { loadDailyFortune } from "./lib";
import { ShareButton } from "./share-button";

export const metadata: Metadata = {
  title: "Today · Cinnabar",
};

function formatLongDate(dateStr: string): string {
  const dt = DateTime.fromISO(dateStr, { zone: "utc" });
  return dt.isValid ? dt.toFormat("cccc, LLLL d, yyyy") : dateStr;
}

export default async function TodayPage() {
  const userId = await getSessionUserId();

  // No session yet, or a session with no saved self profile / cached chart:
  // there's no Day Master to weigh today's day pillar against yet (PRD
  // §5.4's flow — never gate the first "aha" behind auth, but this feature
  // genuinely has nothing to show without a chart).
  const profile = userId
    ? await db.profile.findFirst({
        where: { userId, isSelf: true, chartCache: { not: null } },
        orderBy: { createdAt: "desc" },
      })
    : null;

  if (!profile || !profile.chartCache) {
    return <TodayEmptyState />;
  }

  const chart = JSON.parse(profile.chartCache) as Chart;
  const result = await loadDailyFortune(profile.id, chart, profile.tzId);

  return (
    <Section className="flex flex-col gap-10 py-16 sm:py-24">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex flex-col gap-3">
          <Eyebrow>曆 · Daily Fortune</Eyebrow>
          <h1 className="max-w-2xl font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.08] font-light tracking-[-0.015em] text-ink">
            Today
          </h1>
          <p className="font-mono text-xs text-faint">
            {formatLongDate(result.today.date)} · {profile.name ? `Cast for ${profile.name}` : "Cast for you"} ·{" "}
            {chart.dayMaster.stemPinyin} {chart.dayMaster.stem} Day Master
          </p>
        </div>
        <ShareButton profileId={profile.id} />
      </div>

      <DailyCard
        fortune={result.fortune}
        today={result.today}
        dayMasterRelation={result.dayMasterRelation}
        interaction={result.interaction}
        castAt={result.castAt}
        tzId={profile.tzId}
      />

      <PaywallSlot
        label="Deep annual outlook"
        note="Today's one-a-day card stays free forever. A longer-range 流年 forecast would live behind this marker."
      />
    </Section>
  );
}
