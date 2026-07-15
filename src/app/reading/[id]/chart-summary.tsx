/**
 * Compact, elegant four-pillars summary (PRD §5.2's "chart summary"): year
 * / month / day / hour 干支 with pinyin, the day master called out, and the
 * 生肖 zodiac animal — a data table, not a narrative card, so it's laid out
 * as one (legitimately tabular) unit rather than the reading's editorial
 * card list.
 *
 * Carries the reading page's one Ma Shan Zheng brush touch (DESIGN.md's
 * One-Brushstroke Rule — the hero's 命 is the *other* screen's one; this is
 * the reading's): the day master's own stem character, rendered quiet and
 * large beside "Your Four Pillars," a small calligraphic signature next to
 * the chart it belongs to.
 */
import { Tag } from "@/components/ui";
import type { Chart } from "@/lib/interpreter/types";

const PILLAR_COLUMNS = [
  { key: "year", label: "Year" },
  { key: "month", label: "Month" },
  { key: "day", label: "Day" },
  { key: "hour", label: "Hour" },
] as const;

export function ChartSummary({ chart }: { chart: Chart }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-xl font-medium text-ink">Your Four Pillars</h2>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-faint">
            Year of the {chart.zodiac} · {chart.dayMaster.stemPinyin} {chart.dayMaster.stem} Day Master
          </p>
        </div>
        <span
          aria-hidden="true"
          className="select-none font-brush text-4xl leading-none text-ink/70 sm:text-5xl"
        >
          {chart.dayMaster.stem}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline">
        {PILLAR_COLUMNS.map(({ key, label }) => {
          const pillar = chart.pillars[key];
          return (
            <div key={key} className="flex flex-col items-center gap-2 bg-paper-deep px-2 py-5 sm:py-7">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-faint">{label}</span>
              {pillar ? (
                <>
                  <span className="font-display text-2xl leading-none text-ink sm:text-3xl">
                    {pillar.stem}
                    {pillar.branch}
                  </span>
                  <span className="text-center text-[0.66rem] leading-tight text-muted">
                    {pillar.stemPinyin} {pillar.branchPinyin}
                  </span>
                  <span className="h-5">{key === "day" && <Tag variant="cinnabar">Day Master</Tag>}</span>
                </>
              ) : (
                <span className="mt-1 text-center text-[0.7rem] leading-tight text-faint">Unknown</span>
              )}
            </div>
          );
        })}
      </div>

      {!chart.pillars.hour && (
        <p className="max-w-[58ch] text-xs leading-relaxed text-faint">
          Birth time wasn&apos;t given, so the hour pillar is left out — the rest of the chart, and this reading,
          degrade gracefully rather than guessing.
        </p>
      )}
    </div>
  );
}
