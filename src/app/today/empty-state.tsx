/**
 * Graceful empty state when the visitor has no saved self profile yet
 * (no session cookie, or a session with no `isSelf` profile / no cached
 * chart) — Daily Fortune has nothing to read against without a Day Master,
 * so it points back to the birth form rather than blocking or erroring.
 *
 * A quiet illustration (`/illustrations/empty-today.png`) bleeds off the
 * right edge behind the copy, low-opacity — same "offset to one side, don't
 * shout" treatment as the other empty states. It sits in its own
 * `relative overflow-hidden` wrapper (the homepage Hero's own pattern) so a
 * `-z-10` absolutely-positioned image paints behind the in-flow copy without
 * ever causing horizontal scroll.
 */
import Image from "next/image";
import { Button, Eyebrow, Section } from "@/components/ui";
import { emptyStateImageSrc } from "@/lib/illustrations";

export function TodayEmptyState() {
  return (
    <div className="relative overflow-hidden">
      <Image
        src={emptyStateImageSrc("today")}
        alt=""
        aria-hidden="true"
        width={480}
        height={480}
        className="pointer-events-none absolute top-1/2 -right-10 -z-10 h-auto w-[46vw] max-w-sm -translate-y-1/2 object-contain opacity-[0.14] sm:opacity-[0.18]"
      />
      <Section className="flex flex-col gap-8 py-16 sm:py-24">
        <div className="animate-rise-in flex flex-col gap-4">
          <Eyebrow>
            <span className="font-cjk">曆</span> · Daily Fortune
          </Eyebrow>
          <h1 className="max-w-xl font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.08] font-light tracking-[-0.015em] text-ink">
            Today&apos;s card is still blank.
          </h1>
          <p className="max-w-[54ch] text-[1.02rem] leading-relaxed text-muted">
            Daily Fortune reads today&apos;s energy against your own chart — but there&apos;s no chart to weigh it
            against yet. Create yours first, and a fresh card will be waiting here every day after.
          </p>
        </div>
        <Button href="/reading/new">
          Reveal your chart <span aria-hidden="true">→</span>
        </Button>
      </Section>
    </div>
  );
}
