import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "./cn";
import { Eyebrow } from "./eyebrow";

/**
 * The one shared page-container class: centred, responsive max-width and
 * gutters. Comfortable on laptops, grows on large/ultra-wide screens so
 * content fills the viewport instead of floating in a narrow centred column
 * (inner text keeps its own readable max-width). Exported so the sticky
 * header lockup aligns to the exact same left edge as every Section — change
 * the width here and the whole site (chrome included) stays aligned.
 */
export const SECTION_CONTAINER =
  "mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-12 xl:max-w-[85rem] xl:px-16 2xl:max-w-[104rem] 2xl:px-24";

/**
 * Section — page-level container. The one scaffolding primitive every `/`
 * page block should sit inside instead of hand-rolling `mx-auto max-w-* px-*`.
 */
export function Section({
  className,
  ...rest
}: ComponentPropsWithoutRef<"section">) {
  return <section className={cn(SECTION_CONTAINER, className)} {...rest} />;
}

interface SectionHeadProps {
  /** Optional — see Eyebrow's doc comment before adding one. */
  eyebrow?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  className?: string;
}

/**
 * SectionHead — h2 + optional sub-copy, set at the section scale (Cormorant
 * Garamond, heavier than the hero per the weight-inversion pattern: hero is
 * thin because it can breathe, section anchors carry more weight to ground
 * the block). Eyebrow is opt-in and should be used on at most one section
 * per page. Generous gap (16px) between title and sub — 朱墨 leaves the
 * white alone rather than stacking lines tightly.
 */
export function SectionHead({ eyebrow, title, sub, className }: SectionHeadProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="text-[clamp(1.9rem,3.2vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.01em] text-ink">
        {title}
      </h2>
      {sub ? (
        <p className="max-w-[60ch] text-[1.03rem] leading-relaxed text-muted">
          {sub}
        </p>
      ) : null}
    </div>
  );
}
