import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

interface EyebrowProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

/**
 * Eyebrow — small tracked mono label (JetBrains Mono, uppercase, wide
 * tracking). Reserved for a handful of deliberate brand moments (the
 * hero's "八字 · Four Pillars" marker), NOT a kicker to stamp above every
 * section — that reflex is a named anti-pattern (skill-ban-eyebrow-on-
 * every-section). If you're reaching for this on a third section in the
 * same page, use a plain `<h2>` or a Tag instead.
 */
export function Eyebrow({ className, children, ...rest }: EyebrowProps) {
  return (
    <span
      className={cn(
        "font-mono text-[0.7rem] font-medium uppercase tracking-[0.22em] text-faint",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
