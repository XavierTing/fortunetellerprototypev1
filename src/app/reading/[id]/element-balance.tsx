/**
 * The element-balance visualization (PRD §5.2 / §8: "five-element bar
 * chart... a quiet data motif"). A real chart, not a plain card: five
 * horizontal bars (Wood/Fire/Earth/Metal/Water, hanzi + pinyin), tabular
 * numerals on the counts, the Day Master's own element and any favorable
 * elements called out with the kit's existing Tag accents rather than an
 * invented rainbow palette. Pure/deterministic — needs no LLM call, so it
 * renders instantly alongside the chart summary.
 */
import { Tag, cn } from "@/components/ui";
import { ELEMENTS, ELEMENT_LABEL } from "@/lib/interpreter/five-elements";
import type { Chart, Element } from "@/lib/interpreter/types";

const ELEMENT_GLYPH: Record<Element, { hanzi: string; pinyin: string }> = {
  wood: { hanzi: "木", pinyin: "mù" },
  fire: { hanzi: "火", pinyin: "huǒ" },
  earth: { hanzi: "土", pinyin: "tǔ" },
  metal: { hanzi: "金", pinyin: "jīn" },
  water: { hanzi: "水", pinyin: "shuǐ" },
};

export function ElementBalanceChart({ chart }: { chart: Chart }) {
  const counts = chart.elements;
  const max = Math.max(...ELEMENTS.map((el) => counts[el]), 1);
  const summary = ELEMENTS.map((el) => `${ELEMENT_LABEL[el]} ${counts[el]}`).join(", ");

  return (
    <div
      role="img"
      aria-label={`Five-element balance across the eight chart slots: ${summary}.`}
      className="flex flex-col gap-3.5"
    >
      {ELEMENTS.map((el, i) => {
        const count = counts[el];
        const pct = Math.max(Math.round((count / max) * 100), count > 0 ? 6 : 0);
        const isDayMaster = chart.dayMaster.element === el;
        const isFavorable = chart.favorableElements.includes(el);
        const glyph = ELEMENT_GLYPH[el];

        return (
          <div
            key={el}
            aria-hidden="true"
            className="animate-rise-in flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4"
            style={{ animationDelay: `${i * 55}ms` }}
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:w-44 sm:shrink-0">
              <span className="font-display text-lg leading-none text-ink">{glyph.hanzi}</span>
              <span className="text-sm text-text">{ELEMENT_LABEL[el]}</span>
              <span className="font-mono text-[0.64rem] text-faint">{glyph.pinyin}</span>
              {isDayMaster && <Tag variant="cinnabar">Self</Tag>}
              {isFavorable && <Tag variant="jade">Favorable</Tag>}
            </div>
            <div className="flex flex-1 items-center gap-3">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-graphite">
                <div
                  className={cn("h-full rounded-full", isDayMaster ? "bg-cinnabar" : "bg-gold")}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-5 shrink-0 text-right font-mono text-sm tabular-nums text-muted">{count}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
