import type { Metadata } from "next";
import { Card, Eyebrow, Section } from "@/components/ui";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { MatchEmptyState } from "./empty-state";
import { PersonBForm } from "./person-b-form";

export const metadata: Metadata = {
  title: "Match · Cinnabar",
  description:
    "Check compatibility between you and someone else — engine-computed Day-Master relation, branch harmonies and clashes, and a shareable verdict card.",
};

export default async function MatchPage() {
  const userId = await getSessionUserId();

  // No session yet, or a session with no saved self profile / cached chart:
  // there's no Day Master of Person A's own to weigh Person B against yet
  // (same reasoning as today/page.tsx and master/page.tsx).
  const profile = userId
    ? await db.profile.findFirst({
        where: { userId, isSelf: true, chartCache: { not: null } },
        orderBy: { createdAt: "desc" },
      })
    : null;

  if (!profile || !profile.chartCache) {
    return <MatchEmptyState />;
  }

  return (
    <Section className="flex flex-col gap-10 py-16 sm:py-24">
      <div className="flex flex-col gap-4">
        <Eyebrow>合 · Compatibility</Eyebrow>
        <h1 className="max-w-xl font-display text-[clamp(2.25rem,5vw,3.5rem)] font-light leading-[1.05] tracking-[-0.015em] text-ink">
          Who are you checking against?
        </h1>
        <p className="max-w-[58ch] text-[1.02rem] leading-relaxed text-muted">
          Enter their birth date, time, and place — no account needed for them. We&apos;ll weigh both charts
          together: your Day-Master element relation, branch harmonies and clashes across the two charts, and where
          your elements complement or work against each other.
        </p>
      </div>

      <Card className="max-w-2xl p-6 sm:p-10">
        <PersonBForm />
      </Card>
    </Section>
  );
}
