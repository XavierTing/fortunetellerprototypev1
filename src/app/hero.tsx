import { Seal } from "@/components/ui";

/**
 * Hero — the landing page's decorative ink composition.
 *
 * R0 (this task) ships a tasteful STATIC placeholder: a large, quiet 命
 * ("fate"/"destiny") brush character behind the copy, and the cinnabar
 * seal settling in on load. A later task (R1 — see the design spec's
 * "signature moments") replaces this with an interactive `<canvas>` where
 * a sumi brushstroke blooms along the cursor and forgets slowly, the 命
 * character settling behind it. Keeping the visual in its own component
 * (rather than inline in `page.tsx`) makes that swap a one-file change:
 * the calling contract (an absolutely-positioned, `aria-hidden` decorative
 * layer inside a `relative overflow-hidden` parent) stays the same either
 * way.
 *
 * Purely decorative — every element is `aria-hidden`; the page's real
 * heading/copy carries all of the hero's actual meaning.
 */
export function Hero() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <span
        className="absolute top-1/2 right-[6%] -translate-y-1/2 translate-x-[8%] font-brush leading-none text-ink/[0.05] select-none"
        style={{ fontSize: "clamp(14rem, 34vw, 26rem)" }}
      >
        命
      </span>
      <Seal
        size="xl"
        className="animate-seal-stamp absolute right-[12%] bottom-[18%] font-brush text-3xl"
        style={{ animationDelay: "180ms" }}
      >
        朱
      </Seal>
    </div>
  );
}
