/**
 * Graceful empty state when the visitor has no saved self profile yet
 * (no session cookie, or a session with no `isSelf` profile / no cached
 * chart) — Daily Fortune has nothing to read against without a Day Master,
 * so it points back to the birth form rather than blocking or erroring.
 */
import { Button, Eyebrow, Section } from "@/components/ui";

export function TodayEmptyState() {
  return (
    <Section className="flex flex-col gap-8 py-16 sm:py-24">
      <div className="flex flex-col gap-4">
        <Eyebrow>曆 · Daily Fortune</Eyebrow>
        <h1 className="max-w-xl font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.08] font-light tracking-[-0.015em] text-ink">
          Today&apos;s reading needs a chart to read against.
        </h1>
        <p className="max-w-[54ch] text-[1.02rem] leading-relaxed text-muted">
          Daily Fortune works by weighing today&apos;s real day pillar against your own Day Master — cast your chart
          once, free and in under a minute, and today&apos;s card (and every day after) will be waiting here.
        </p>
      </div>
      <Button href="/reading/new">
        Reveal your chart <span aria-hidden="true">→</span>
      </Button>
    </Section>
  );
}
