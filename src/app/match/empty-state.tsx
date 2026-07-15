/**
 * Graceful empty state when the visitor has no saved self profile yet (no
 * session cookie, or a session with no `isSelf` profile / no cached chart) —
 * Compatibility has nothing to weigh Person B against without a Day Master
 * of Person A's own, so it points back to the birth form rather than
 * blocking or erroring (same pattern as `today/empty-state.tsx` and
 * `master/page.tsx`'s EmptyState).
 */
import { Button, Eyebrow, Section } from "@/components/ui";

export function MatchEmptyState() {
  return (
    <Section className="flex flex-col gap-8 py-16 sm:py-24">
      <div className="flex flex-col gap-4">
        <Eyebrow>合 · Compatibility</Eyebrow>
        <h1 className="max-w-xl font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.08] font-light tracking-[-0.015em] text-ink">
          Compatibility needs your own chart first.
        </h1>
        <p className="max-w-[54ch] text-[1.02rem] leading-relaxed text-muted">
          We weigh your Day Master and branches against theirs — cast your own chart once, free and in under a
          minute, and you&apos;ll be able to check compatibility with anyone after, no account needed for them.
        </p>
      </div>
      <Button href="/reading/new">
        Reveal your chart <span aria-hidden="true">→</span>
      </Button>
    </Section>
  );
}
