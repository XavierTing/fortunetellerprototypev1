/**
 * Graceful empty state when the visitor has no saved self profile yet (no
 * session cookie, or a session with no `isSelf` profile / no cached chart)
 * — same pattern as `today/empty-state.tsx` and `match/empty-state.tsx`.
 * `/me` is the one route where this is the *expected* first-visit state
 * (PRD §6: never gate the first "aha" behind auth/a profile page), so the
 * copy leans into "this becomes your home base" rather than reading as an
 * error.
 */
import { Button, Eyebrow, Section } from "@/components/ui";

export function MeEmptyState() {
  return (
    <Section className="flex flex-col gap-8 py-16 sm:py-24">
      <div className="flex flex-col gap-4">
        <Eyebrow>我 · Me</Eyebrow>
        <h1 className="max-w-xl font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.08] font-light tracking-[-0.015em] text-ink">
          Your profile lives here once you&apos;ve cast a chart.
        </h1>
        <p className="max-w-[56ch] text-[1.02rem] leading-relaxed text-muted">
          Cast your birth chart once, free and in under a minute, and this becomes your home base — your Day Master
          at a glance, every past reading, every conversation with the master, and every compatibility check, all in
          one place.
        </p>
      </div>
      <Button href="/reading/new">
        Reveal your chart <span aria-hidden="true">→</span>
      </Button>
    </Section>
  );
}
