/**
 * The 五行 (Five Element) balance visualization — R1 "signature moment" #2:
 * five brush-ink circles laid out enso-style (禅 painting's near-closed ink
 * ring — a small deliberate opening left where the brush lifted), sized by
 * each element's tally in `chart.elements`. Four render as quiet sumi-ink
 * rings; the numerically dominant element (`dominantElement`, already used
 * by the mock interpreter's own prose for this exact idea) is the one
 * filled cinnabar disc — the viz's own "seal" moment. Still only ONE accent
 * in play (the One-Accent Rule): cinnabar marks "this is the biggest one,"
 * ink is everything else — not a second/third hue per element.
 *
 * Pure/deterministic, no LLM call — renders instantly alongside the chart
 * summary, same as the bar chart it replaces. Props/interface unchanged
 * (`{ chart: Chart }`) so `reading-stream.tsx` didn't need to change how it
 * calls this component.
 *
 * Motion reuses the existing `animate-seal-stamp` keyframe (scale + fade
 * settle) for each ring's "bleed/settle in" rather than adding new CSS —
 * see globals.css's file header. `prefers-reduced-motion` already forces
 * near-zero animation duration globally, so reduced motion gets an instant
 * appearance for free, no extra branching needed here.
 *
 * Each ring also carries the element's AI-generated brush emblem
 * (`/elements/{element}.png`, transparent) centered and faint behind the
 * existing CJK glyph — a quiet texture, not a second focal point, so the
 * glyph + ring stay the legible signature and the emblem only adds ink-wash
 * character. `alt=""` (purely decorative, already covered by the chart's own
 * `aria-label`) means a momentarily-missing file just paints nothing.
 */
import Image from "next/image";
import { cn } from "@/components/ui";
import { elementImageSrc } from "@/lib/illustrations";
import { dominantElement, ELEMENTS, ELEMENT_LABEL } from "@/lib/interpreter/five-elements";
import type { Chart, Element } from "@/lib/interpreter/types";

const ELEMENT_GLYPH: Record<Element, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水",
};

const MIN_DIAMETER = 62;
const MAX_DIAMETER = 148;

export function ElementBalanceChart({ chart }: { chart: Chart }) {
  const counts = chart.elements;
  const max = Math.max(...ELEMENTS.map((el) => counts[el]), 1);
  const dominant = dominantElement(counts);
  const summary = ELEMENTS.map((el) => `${ELEMENT_LABEL[el]} ${counts[el]}`).join(", ");

  return (
    <div
      role="img"
      aria-label={`Five-element balance across the eight chart slots: ${summary}. ${ELEMENT_LABEL[dominant]} is the most abundant.`}
      className="flex flex-wrap items-start justify-between gap-x-6 gap-y-8 sm:justify-start sm:gap-x-12"
    >
      {ELEMENTS.map((el, i) => {
        const count = counts[el];
        const isDominant = el === dominant;
        const weight = count / max;
        const diameter = Math.round(MIN_DIAMETER + (MAX_DIAMETER - MIN_DIAMETER) * weight);
        const strokeWidth = 2.5 + 2.5 * weight;

        return (
          <div
            key={el}
            aria-hidden="true"
            className="animate-seal-stamp flex flex-col items-center gap-3"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div
              className="relative flex shrink-0 items-center justify-center"
              style={{ width: diameter, height: diameter }}
            >
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                {isDominant ? (
                  <circle cx="50" cy="50" r="46" className="fill-cinnabar" />
                ) : (
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    strokeLinecap="round"
                    strokeWidth={strokeWidth}
                    pathLength={100}
                    strokeDasharray="91 9"
                    strokeDashoffset={22}
                    className="stroke-ink/50"
                  />
                )}
              </svg>
              <Image
                src={elementImageSrc(el)}
                alt=""
                aria-hidden="true"
                width={96}
                height={96}
                className={cn(
                  "pointer-events-none absolute top-1/2 left-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 object-contain",
                  isDominant ? "opacity-40" : "opacity-25"
                )}
              />
              <span
                className={cn(
                  "relative font-cjk leading-none",
                  isDominant ? "text-paper" : "text-ink-soft"
                )}
                style={{ fontSize: Math.max(20, diameter * 0.32) }}
              >
                {ELEMENT_GLYPH[el]}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 text-center">
              <span className="text-sm text-ink-soft">{ELEMENT_LABEL[el]}</span>
              <span className="font-mono text-xs tabular-nums text-faint">{count}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
