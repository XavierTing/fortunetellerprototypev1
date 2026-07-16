/**
 * Public teaser (FIX-report.md item 4 — "the core viral loop"): rendered by
 * `page.tsx` for anyone who opens a shared `/reading/[id]` link WITHOUT the
 * profile owner's session — previously that hard `notFound()`'d, so the
 * one link this app hands out to invite someone else in led straight to a
 * dead end. This shows exactly the same non-PII summary fields the public
 * share image already exposes (`ReadingCardData` — Day Master element +
 * strength, zodiac, element tally, one headline; see
 * `src/app/api/share/reading-data.ts`'s own privacy posture, PRD §11) and
 * nothing else: no birth date, no birthplace, no coordinates, no full
 * card-by-card reading text. A "Reveal your own chart" CTA closes the
 * invite loop.
 */
import { Button, Card, Eyebrow, Section, Tag } from "@/components/ui";
import { ELEMENTS, ELEMENT_LABEL } from "@/lib/interpreter/five-elements";
import type { ReadingCardData } from "@/app/api/share/render";

const STRENGTH_LABEL: Record<"strong" | "weak" | "balanced", string> = {
  strong: "Strong",
  weak: "Weak",
  balanced: "Balanced",
};

function TeaserElementBars({ data }: { data: ReadingCardData }) {
  const max = Math.max(...ELEMENTS.map((el) => data.elements[el] ?? 0), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {ELEMENTS.map((el) => {
        const count = data.elements[el] ?? 0;
        const pct = Math.max(Math.round((count / max) * 100), count > 0 ? 6 : 0);
        const isDayMaster = el === data.dayMasterElement;
        const isFavorable = data.favorableElements.includes(el);
        return (
          <div key={el} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs text-muted">{ELEMENT_LABEL[el]}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-graphite">
              <div
                className={isDayMaster ? "h-full rounded-full bg-cinnabar" : "h-full rounded-full bg-gold"}
                style={{ width: `${pct}%`, opacity: isFavorable && !isDayMaster ? 0.85 : 1 }}
              />
            </div>
            <span className="w-4 shrink-0 text-right font-mono text-xs tabular-nums text-faint">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ReadingTeaser({ data }: { data: ReadingCardData | null }) {
  return (
    <Section className="flex flex-col gap-10 py-16 sm:py-24">
      <div className="flex flex-col gap-3">
        <Eyebrow>八字 · Natal Reading</Eyebrow>
        <h1 className="max-w-2xl font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.08] font-light tracking-[-0.015em] text-ink">
          {data ? (data.name ? `${data.name}’s reading` : "A shared reading") : "This reading isn't ready yet"}
        </h1>
        <p className="max-w-[56ch] text-[1.02rem] leading-relaxed text-muted">
          {data
            ? "Someone shared their chart with you — here's the shape of it. The full card-by-card reading stays private to them."
            : "Whoever shared this link hasn't finished casting their reading yet. Check back once they have, or reveal your own chart below."}
        </p>
      </div>

      {data && (
        <Card className="flex flex-col gap-6 p-8 sm:p-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <Tag variant="cinnabar">
              {data.dayMasterElementLabel} · {STRENGTH_LABEL[data.dayMasterStrength]} Day Master
            </Tag>
            {data.zodiac && <Tag>Year of the {data.zodiac}</Tag>}
          </div>
          {data.tagline && <p className="max-w-[56ch] text-[1.02rem] leading-relaxed text-text">{data.tagline}</p>}
          <TeaserElementBars data={data} />
        </Card>
      )}

      <Card className="flex flex-col items-start gap-5 p-8 sm:p-10">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-hairline font-display text-xl text-cinnabar"
        >
          C
        </span>
        <p className="max-w-[52ch] text-[1.02rem] leading-relaxed text-muted">
          Curious what your own chart says? Cinnabar builds a genuine BaZi (八字) chart — calculated, not guessed —
          then has an AI read it in plain English. Free, no signup, under a minute.
        </p>
        <Button href="/reading/new">
          Create your own reading <span aria-hidden="true">→</span>
        </Button>
      </Card>
    </Section>
  );
}
