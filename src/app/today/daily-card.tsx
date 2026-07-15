/**
 * The single daily-fortune card (PRD §5.4: "One card per day... Co-Star's
 * *one-a-day* discipline"). Deliberately ONE `Card`, not a grid or a list of
 * cards — the whole point of the feature is that there's exactly one thing
 * to read today. Internal grouping uses spacing + hairline dividers (the
 * No-Nesting Rule), never a second bordered box.
 *
 * `id="daily-fortune-card"` marks the single element a later share-image
 * task can target — headline, body, energy, and the lean-into/go-easy-on
 * pair all live inside this one structurally stable container.
 */
import { Card, Tag } from "@/components/ui";
import type { AccentVariant } from "@/components/ui";
import type { ElementRelation } from "@/lib/interpreter/five-elements";
import { ELEMENT_LABEL } from "@/lib/interpreter/five-elements";
import type { DailyFortune } from "@/lib/interpreter/types";
import type { DayInteraction, TodayInfo } from "./lib";

const DAY_MASTER_RELATION_TAG: Record<ElementRelation, { variant: AccentVariant; label: string }> = {
  same: { variant: "neutral", label: "Mirrors your Day Master" },
  generates: { variant: "gold", label: "You're generating today's energy" },
  "generated-by": { variant: "jade", label: "Today is feeding your Day Master" },
  controls: { variant: "gold", label: "You're in control of today's energy" },
  "controlled-by": { variant: "cinnabar", label: "Today is pushing back on your Day Master" },
};

const INTERACTION_TAG: Record<DayInteraction["type"], { variant: AccentVariant; label: string }> = {
  chong: { variant: "cinnabar", label: "相冲 · Clash day" },
  xing: { variant: "cinnabar", label: "相刑 · Friction day" },
  liuhe: { variant: "jade", label: "六合 · Harmony day" },
  sanhe: { variant: "jade", label: "三合 · Harmony day" },
};

function formatCastTime(castAt: Date, tzId: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: tzId }).format(castAt);
  } catch {
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(castAt);
  }
}

export function DailyCard({
  fortune,
  today,
  dayMasterRelation,
  interaction,
  castAt,
  tzId,
}: {
  fortune: DailyFortune;
  today: TodayInfo;
  dayMasterRelation: ElementRelation;
  interaction: DayInteraction | null;
  castAt: Date;
  tzId: string;
}) {
  const relTag = DAY_MASTER_RELATION_TAG[dayMasterRelation];

  return (
    <Card
      as="article"
      id="daily-fortune-card"
      aria-label="Today's fortune"
      className="animate-rise-in flex max-w-2xl flex-col gap-8 p-7 sm:p-10"
    >
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-7">
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="font-brush text-4xl leading-none text-cinnabar sm:text-5xl">
            {today.parsed.stem}
            {today.parsed.branch}
          </span>
          <span className="text-xs leading-tight text-muted">
            {today.parsed.stemPinyin} {today.parsed.branchPinyin} · {ELEMENT_LABEL[today.parsed.stemElement]} over{" "}
            {ELEMENT_LABEL[today.parsed.branchElement]} · {today.parsed.branchAnimal} day
          </span>
        </div>
        <Tag variant={relTag.variant}>{relTag.label}</Tag>
      </header>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-[clamp(1.6rem,3.4vw,2.35rem)] leading-[1.2] font-light text-ink">
          {fortune.headline}
        </h2>
        <p className="max-w-[58ch] text-[1.03rem] leading-relaxed text-muted">{fortune.body}</p>
      </div>

      {interaction && (
        <div className="flex flex-wrap items-center gap-3">
          <Tag variant={INTERACTION_TAG[interaction.type].variant}>{INTERACTION_TAG[interaction.type].label}</Tag>
          <span className="text-xs leading-relaxed text-faint">{interaction.note}</span>
        </div>
      )}

      <dl className="flex flex-col divide-y divide-hairline border-t border-hairline">
        <div className="flex flex-col gap-1.5 py-5 sm:flex-row sm:items-baseline sm:gap-8">
          <dt className="font-mono text-[0.68rem] font-medium tracking-[0.14em] text-faint uppercase sm:w-40 sm:shrink-0">
            Energy
          </dt>
          <dd className="text-[0.95rem] leading-relaxed text-text">{fortune.energy}</dd>
        </div>
        <div className="flex flex-col gap-1.5 py-5 sm:flex-row sm:items-baseline sm:gap-8">
          <dt className="font-mono text-[0.68rem] font-medium tracking-[0.14em] text-jade uppercase sm:w-40 sm:shrink-0">
            Lean into
          </dt>
          <dd className="text-[0.95rem] leading-relaxed text-text">{fortune.leanInto}</dd>
        </div>
        <div className="flex flex-col gap-1.5 py-5 sm:flex-row sm:items-baseline sm:gap-8">
          <dt className="font-mono text-[0.68rem] font-medium tracking-[0.14em] text-cinnabar uppercase sm:w-40 sm:shrink-0">
            Go easy on
          </dt>
          <dd className="text-[0.95rem] leading-relaxed text-text">{fortune.goEasyOn}</dd>
        </div>
      </dl>

      <p className="font-mono text-[0.66rem] tracking-[0.1em] text-faint uppercase">
        Cast today at {formatCastTime(castAt, tzId)} · one card, once a day
      </p>
    </Card>
  );
}
