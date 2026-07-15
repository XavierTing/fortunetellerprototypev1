import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type SealShape = "circle" | "square";
export type SealSize = "sm" | "md" | "lg" | "xl";

const SHAPE: Record<SealShape, string> = {
  circle: "rounded-full",
  /** A hanko's square seals still carry a soft corner, never a sharp one —
   * "small radii" per DESIGN.md, not a full pill (that would read as
   * "circle" instead of "square"). */
  square: "rounded-lg",
};

const SIZE: Record<SealSize, string> = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-14 w-14 text-xl",
  xl: "h-20 w-20 text-3xl",
};

interface SealProps extends HTMLAttributes<HTMLSpanElement> {
  shape?: SealShape;
  size?: SealSize;
  children?: ReactNode;
}

/**
 * Seal (印) — the cinnabar hanko-style stamp mark: a solid cinnabar
 * circle or rounded-square, optionally wrapping one CJK/brush character
 * (the brand mark's "朱", the hero's "命", a future share card's score).
 *
 * This is deliberately the ONE place in the kit where cinnabar is allowed
 * to be a bold, filled shape rather than text/border/dot — everywhere
 * else in 朱墨, cinnabar is used like a hanko: sparingly. Don't reach for
 * a second filled-cinnabar shape elsewhere; reuse this component instead
 * so "the seal" stays a single, recognizable motif.
 *
 * Later tasks reuse this for the hero's "seal stamps on load" moment
 * (R1 — an `animate-seal-stamp` keyframe already ships in globals.css for
 * that) and the share-card seal (R1). Purely decorative by default — pass
 * `aria-hidden="true"` (or a real `aria-label`) explicitly, since a bare
 * CJK glyph inside a `<span>` has no accessible meaning on its own.
 */
export function Seal({
  shape = "circle",
  size = "md",
  className,
  children,
  ...rest
}: SealProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-cinnabar font-display font-medium text-paper transition-colors duration-300 ease-out-expo",
        SHAPE[shape],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
