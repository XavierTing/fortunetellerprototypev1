import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type AccentVariant = "neutral" | "gold" | "cinnabar" | "jade";

/**
 * 朱墨 has exactly one accent — cinnabar, used like a hanko seal. "gold"
 * and "jade" are legacy variant names kept for prop-API compatibility (the
 * out-of-scope reading/today/match routes still pass them for "premium"
 * and "favorable" states); both now render as quiet ink-soft, not a second
 * or third accent hue. Only "cinnabar" is the true accent color.
 */
const RING: Record<AccentVariant, string> = {
  neutral: "border-hairline",
  gold: "border-hairline",
  cinnabar: "border-cinnabar/40",
  jade: "border-hairline",
};

const TEXT: Record<AccentVariant, string> = {
  neutral: "text-muted",
  gold: "text-ink-soft",
  cinnabar: "text-cinnabar",
  jade: "text-ink-soft",
};

const DOT: Record<AccentVariant, string> = {
  neutral: "bg-faint",
  gold: "bg-ink-soft",
  cinnabar: "bg-cinnabar",
  jade: "bg-ink-soft",
};

interface AccentProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: AccentVariant;
  children: ReactNode;
}

/**
 * Badge — pill with a status dot. Use for state: "favorable", "coming
 * soon", "live". `variant` keeps its four legacy names for compatibility,
 * but only "cinnabar" carries real accent color now — reach for it before
 * inventing a new hue; "gold"/"jade"/"neutral" are all quiet ink tones.
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
