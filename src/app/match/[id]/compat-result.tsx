/**
 * The compatibility result view (PRD §5.5): overall dynamic, how the two
 * charts energize each other, friction points, advice, a score, and a
 * one-line verdict — all straight from `interpreter.compatibility()`.
 * Deliberately an editorial, hairline-divided list (matching
 * `reading/[id]/reading-parts.tsx`'s pattern), NOT a repeated `Card` grid —
 * DESIGN.md's named anti-pattern. The score is shown as a quiet meter bar
 * (the same motif `element-balance.tsx` uses for the five elements), not
 * DESIGN.md's banned "hero-metric template" (big number, small label,
 * gradient accent) — jade/gold/cinnabar tone the bar by how favorable the
 * score is, reusing the kit's existing three-accent vocabulary rather than
 * inventing a fourth color (DESIGN.md §2 explicitly calls out jade as
 * reserved for "a harmonious compatibility result").
 */
import { Tag, cn } from "@/components/ui";
import type { AccentVariant } from "@/components/ui";
import { ELEMENT_LABEL } from "@/lib/interpreter/five-elements";
import type { Chart, Compat } from "@/lib/interpreter/types";
import { ShareButton } from "./share-button";

function scoreTone(score: number): AccentVariant {
  if (score >= 70) return "jade";
  if (score >= 45) return "gold";
  return "cinnabar";
}

const BAR_FILL: Record<AccentVariant, string> = {
  jade: "bg-jade",
  gold: "bg-gold",
  cinnabar: "bg-cinnabar",
  neutral: "bg-faint",
};

function CompatRow({ label, text, emphasize }: { label: string; text: string; emphasize?: boolean }) {
  return (
    <article className="animate-rise-in flex flex-col gap-2.5 py-8 first:pt-0">
      {emphasize && (
        <Tag variant="gold" className="mb-1 self-start">
          Where to go from here
        </Tag>
      )}
      <h3 className="font-mono text-[0.68rem] font-medium tracking-[0.14em] text-faint uppercase">{label}</h3>
      <p className="max-w-[62ch] text-[1.03rem] leading-relaxed text-text">{text}</p>
    </article>
  );
}

export function CompatResult({
  pairId,
  nameA,
  nameB,
  chartA,
  chartB,
  result,
}: {
  pairId: string;
  nameA: string;
  nameB: string;
  chartA: Chart;
  chartB: Chart;
  result: Compat;
}) {
  const tone = scoreTone(result.score);
  const pct = Math.max(0, Math.min(100, Math.round(result.score)));

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6 border-b border-hairline pb-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[0.68rem] font-medium tracking-[0.14em] text-faint uppercase">Verdict</p>
            <h2 className="max-w-xl font-display text-[clamp(1.6rem,3.4vw,2.35rem)] leading-[1.18] font-light text-ink">
              {result.verdict}
            </h2>
          </div>
          <ShareButton pairId={pairId} />
        </div>

        <div className="flex items-center gap-4">
          <div
            role="img"
            aria-label={`Compatibility score: ${pct} out of 100`}
            className="h-2.5 flex-1 overflow-hidden rounded-full bg-graphite"
          >
            <div className={cn("h-full rounded-full", BAR_FILL[tone])} style={{ width: `${pct}%` }} />
          </div>
          <span className="w-12 shrink-0 text-right font-mono text-lg tabular-nums text-ink">{pct}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="font-display text-lg text-ink">{nameA}</span>
          <Tag variant="neutral">{ELEMENT_LABEL[chartA.dayMaster.element]} Day Master</Tag>
          <span aria-hidden="true" className="text-faint">
            ×
          </span>
          <span className="font-display text-lg text-ink">{nameB}</span>
          <Tag variant="neutral">{ELEMENT_LABEL[chartB.dayMaster.element]} Day Master</Tag>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-hairline">
        <CompatRow label="Overall" text={result.overall} />
        <CompatRow label="How you energize each other" text={result.dynamic} />
        <CompatRow label="Friction points" text={result.friction} />
        <CompatRow label="Advice" text={result.advice} emphasize />
      </div>
    </div>
  );
}
