/**
 * Route-level loading UI (Next.js App Router convention) shown while the
 * Server Component in `page.tsx` resolves — the profile lookup, cache
 * check, and (on a cache miss) the interpreter call. `animate-pulse`
 * already collapses under the global `prefers-reduced-motion` rule in
 * `globals.css`, so no extra guard is needed here.
 */
import { Eyebrow, Section } from "@/components/ui";

export default function TodayLoading() {
  return (
    <Section className="flex flex-col gap-10 py-16 sm:py-24">
      <div className="flex flex-col gap-3" aria-hidden="true">
        <Eyebrow>
          <span className="font-cjk">曆</span> · Daily Fortune
        </Eyebrow>
        <div className="h-11 w-40 animate-pulse rounded bg-graphite" />
        <div className="h-3 w-64 animate-pulse rounded bg-graphite" />
      </div>

      <div
        className="flex max-w-2xl animate-pulse flex-col gap-8 rounded-xl border border-hairline bg-raised p-7 sm:p-10"
        aria-hidden="true"
      >
        <div className="flex items-center justify-between gap-4 border-b border-hairline pb-7">
          <div className="h-10 w-24 rounded bg-graphite" />
          <div className="h-6 w-40 rounded-full bg-graphite" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="h-8 w-5/6 rounded bg-graphite" />
          <div className="h-4 w-full rounded bg-graphite" />
          <div className="h-4 w-4/6 rounded bg-graphite" />
        </div>
        <div className="flex flex-col divide-y divide-hairline border-t border-hairline">
          <div className="py-5">
            <div className="h-4 w-2/3 rounded bg-graphite" />
          </div>
          <div className="py-5">
            <div className="h-4 w-1/2 rounded bg-graphite" />
          </div>
          <div className="py-5">
            <div className="h-4 w-3/5 rounded bg-graphite" />
          </div>
        </div>
      </div>

      <span className="sr-only" role="status">
        Casting today&apos;s fortune…
      </span>
    </Section>
  );
}
