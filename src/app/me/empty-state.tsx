/**
 * Graceful empty state when the visitor has no saved self profile yet (no
 * session cookie, or a session with no `isSelf` profile / no cached chart)
 * — same pattern as `today/empty-state.tsx` and `match/empty-state.tsx`.
 * `/me` is the one route where this is the *expected* first-visit state
 * (PRD §6: never gate the first "aha" behind auth/a profile page), so the
 * copy leans into "this becomes your home base" rather than reading as an
 * error.
 *
 * A quiet illustration (`/illustrations/empty-me.png`) bleeds off the right
 * edge behind the copy, low-opacity — see `today/empty-state.tsx`'s doc
 * comment for the `relative overflow-hidden` + `-z-10` mechanics.
 */
import Image from "next/image";
import { Button, Eyebrow, Section } from "@/components/ui";
import { emptyStateImageSrc } from "@/lib/illustrations";

export function MeEmptyState() {
  return (
    <div className="relative overflow-hidden">
      <Image
        src={emptyStateImageSrc("me")}
        alt=""
        aria-hidden="true"
        width={480}
        height={480}
        className="pointer-events-none absolute top-1/2 -right-10 -z-10 h-auto w-[46vw] max-w-sm -translate-y-1/2 object-contain opacity-[0.14] sm:opacity-[0.18]"
      />
      <Section className="flex flex-col gap-8 py-16 sm:py-24">
        <div className="animate-rise-in flex flex-col gap-4">
          <Eyebrow>
            <span className="font-cjk">我</span> · Me
          </Eyebrow>
          <h1 className="max-w-xl font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.08] font-light tracking-[-0.015em] text-ink">
            This becomes your home once you have a chart to keep.
          </h1>
          <p className="max-w-[56ch] text-[1.02rem] leading-relaxed text-muted">
            Create your birth chart first, and this becomes your quiet index — your Day Master at a glance, every
            past reading, every conversation with the Master, and every compatibility check, gathered in one place.
          </p>
        </div>
        <Button href="/reading/new">
          Reveal your chart <span aria-hidden="true">→</span>
        </Button>
      </Section>
    </div>
  );
}
