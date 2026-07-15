import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type AccentVariant = "neutral" | "gold" | "cinnabar" | "jade";

const RING: Record<AccentVariant, string> = {
  neutral: "border-hairline",
  gold: "border-hairline-gold",
  cinnabar: "border-cinnabar/40",
  jade: "border-jade/40",
};

const TEXT: Record<AccentVariant, string> = {
  neutral: "text-muted",
  gold: "text-gold",
  cinnabar: "text-cinnabar",
  jade: "text-jade",
};

const DOT: Record<AccentVariant, string> = {
  neutral: "bg-faint",
  gold: "bg-gold",
  cinnabar: "bg-cinnabar",
  jade: "bg-jade",
};

interface AccentProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: AccentVariant;
  children: ReactNode;
}

/**
 * Badge — pill with a status dot. Use for state: "favorable", "coming
 * soon", "live". `variant` maps to the three-accent palette (gold =
 * premium/featured, cinnabar = attention/identity, jade = positive) plus
 * a neutral default — don't invent a fourth ad-hoc color.
 */
export function Badge({
  variant = "neutral",
  className,
  children,
  ...rest
}: AccentProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[0.68rem] font-medium uppercase tracking-[0.1em]",
        RING[variant],
        TEXT[variant],
        className,
      )}
      {...rest}
    >
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", DOT[variant])} />
      {children}
    </span>
  );
}

/**
 * Tag — same accent system as Badge, without the dot. Use for labels that
 * don't represent a live state (category markers, filters, glyph
 * captions).
 */
export function Tag({
  variant = "neutral",
  className,
  children,
  ...rest
}: AccentProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[0.66rem] font-medium uppercase tracking-[0.08em]",
        RING[variant],
        TEXT[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
