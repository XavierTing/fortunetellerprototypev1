/**
 * Public teaser (FIX-report.md item 4 — "the core viral loop"): rendered by
 * `page.tsx` for anyone who opens a shared `/match/[id]` link WITHOUT
 * person A's session — previously that hard `notFound()`'d, so the primary
 * invite-loop link this feature exists to generate (PRD §5.5/§7.5) led
 * straight to a dead end for the exact person it was shared with. Shows
 * only the same non-PII summary fields the public share image already
 * exposes (`CompatCardData` — score, verdict, both display names, Day
 * Master element labels; see `src/app/api/share/compat-data.ts`'s own
 * privacy posture, PRD §11) and nothing else: no birth data, no pillars,
 * no full reading text. A "Create your own reading" CTA closes the loop.
 */
import { Button, Card, Eyebrow, Section, Tag, cn } from "@/components/ui";
import type { AccentVariant } from "@/components/ui";
import type { CompatCardData } from "@/app/api/share/render";

/** Same jade/gold/cinnabar score-tone convention as `compat-result.tsx`'s `scoreTone`. */
function scoreTone(score: number): AccentVariant {
  if (score >= 70) return "jade";
  if (score >= 45) return "gold";
  return "cinnabar";
}

const TONE_FILL: Record<AccentVariant, string> = {
  jade: "bg-jade",
  gold: "bg-gold",
  cinnabar: "bg-cinnabar",
  neutral: "bg-faint",
};

export function MatchTeaser({ data }: { data: CompatCardData | null }) {
  return (
    <Section className="flex flex-col gap-10 py-16 sm:py-24">
      <div className="flex flex-col gap-3">
        <Eyebrow>合 · Compatibility</Eyebrow>
        <h1 className="max-w-2xl font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.08] font-light tracking-[-0.015em] text-ink">
          {data ? `${data.nameA} & ${data.nameB}` : "This reading isn't ready yet"}
        </h1>
        <p className="max-w-[56ch] text-[1.02rem] leading-relaxed text-muted">
          {data
            ? "Someone shared a compatibility reading with you — here's the verdict. The full dynamic/friction/advice breakdown stays private to them."
            : "Whoever shared this link hasn't finished this compatibility check yet. Check back later, or reveal your own chart below."}
        </p>
      </div>

      {data && (
        <Card className="flex flex-col gap-6 p-8 sm:p-10">
          <div className="flex flex-wrap items-center gap-5">
            <div
              className={cn(
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-xl font-display text-2xl font-medium text-lacquer-deep",
                TONE_FILL[scoreTone(data.score)]
              )}
            >
              {Math.round(data.score)}
            </div>
            <p className="max-w-[46ch] text-[1.15rem] leading-snug font-light text-ink">{data.verdict}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Tag variant="cinnabar">
              {data.nameA} · {data.dayMasterLabelA || "—"} Day Master
            </Tag>
            <Tag>
              {data.nameB} · {data.dayMasterLabelB || "—"} Day Master
            </Tag>
          </div>
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
          Curious what your own chart says — about you, or about someone else? Cinnabar builds a genuine BaZi (八字)
          chart, then has an AI read it in plain English. Free, no signup, under a minute.
        </p>
        <Button href="/reading/new">
          Create your own reading <span aria-hidden="true">→</span>
        </Button>
      </Card>
    </Section>
  );
}
