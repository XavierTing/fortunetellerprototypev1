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
      <div className="animate-rise-in flex flex-col gap-4">
        <Eyebrow>
          <span className="font-cjk">曆</span> · Daily Fortune
        </Eyebrow>
        <h1 className="max-w-xl font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.08] font-light tracking-[-0.015em] text-ink">
          Today&apos;s card is still blank.
        </h1>
        <p className="max-w-[54ch] text-[1.02rem] leading-relaxed text-muted">
          Daily Fortune reads today&apos;s real day pillar against your own Day Master — there&apos;s nothing to weigh
          it against yet. Cast your chart once, free and in under a minute, and a new card will be waiting here every
          day after.
        </p>
      </div>
      <Button href="/reading/new">
        Reveal your chart <span aria-hidden="true">→</span>
      </Button>
    </Section>
  );
}
