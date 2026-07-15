/**
 * Presentational pieces for the streamed reading list. Deliberately NOT a
 * repeated `Card` grid (DESIGN.md's named anti-pattern) — an editorial,
 * hairline-divided list instead, the same pattern the homepage's "What
 * Cinnabar reads" section uses. `<details>` gives the "mechanics ⓘ"
 * expander real keyboard/AT support for free, no custom ARIA needed.
 */
import { Tag, cn } from "@/components/ui";
import type { Card } from "@/lib/interpreter/types";

export function MechanicsExpander({ mechanics }: { mechanics?: string }) {
  if (!mechanics) return null;
  return (
    <details className="group mt-1">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-mono text-[0.68rem] font-medium tracking-[0.14em] text-faint uppercase transition-colors duration-200 ease-out-expo hover:text-gold [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className="inline-block transition-transform duration-200 ease-out-expo group-open:rotate-90"
        >
          ›
        </span>
        the mechanics <span aria-hidden="true">ⓘ</span>
      </summary>
      <p className="mt-2 max-w-[60ch] border-l border-hairline-gold pl-4 text-[0.92rem] leading-relaxed text-muted">
        {mechanics}
      </p>
    </details>
  );
}

export function ReadingRow({ card, emphasize }: { card: Card; emphasize?: boolean }) {
  return (
    <article className="animate-rise-in flex flex-col gap-2.5 py-8">
      {emphasize && (
        <Tag variant="gold" className="mb-1 self-start">
          Where to go from here
        </Tag>
      )}
      <h3
        className={cn(
          "font-display leading-snug text-ink",
          emphasize ? "text-[1.5rem] font-medium" : "text-[1.25rem] font-medium"
        )}
      >
        {card.headline}
      </h3>
      <p className="max-w-[62ch] text-[1rem] leading-relaxed text-muted">{card.body}</p>
      <MechanicsExpander mechanics={card.mechanics} />
    </article>
  );
}

export function HeroSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-3" aria-hidden="true">
      <div className="h-3 w-40 rounded bg-graphite" />
      <div className="h-9 w-3/4 rounded bg-graphite" />
      <div className="h-9 w-1/2 rounded bg-graphite" />
      <div className="mt-2 h-4 w-full max-w-xl rounded bg-graphite" />
      <div className="h-4 w-5/6 max-w-xl rounded bg-graphite" />
    </div>
  );
}

export function TextSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="flex animate-pulse flex-col gap-2" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={cn("h-4 rounded bg-graphite", i === lines - 1 ? "w-2/3" : "w-full max-w-xl")} />
      ))}
    </div>
  );
}

export function RowSkeleton({ title }: { title: string }) {
  return (
    <div className="flex animate-pulse flex-col gap-2.5 py-8" aria-hidden="true">
      <p className="font-mono text-[0.64rem] tracking-[0.14em] text-faint uppercase">{title}</p>
      <div className="h-3 w-2/5 rounded bg-graphite" />
      <div className="h-3 w-full max-w-xl rounded bg-graphite" />
      <div className="h-3 w-4/6 max-w-xl rounded bg-graphite" />
    </div>
  );
}
