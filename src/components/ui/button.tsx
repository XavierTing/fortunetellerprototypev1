import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
/**
 * "gold" is a legacy tone name kept for prop-API compatibility with the
 * pre-朱墨 system (no out-of-scope call site needs to change). In the new
 * single-accent palette it just means "quiet ink," i.e. everything that
 * ISN'T the one cinnabar accent — see the Cinnabar-Is-The-Only-Accent rule
 * in DESIGN.md.
 */
export type ButtonTone = "gold" | "cinnabar";
export type ButtonSize = "md" | "sm";

interface ButtonOwnProps {
  /** primary = filled seal (CTA). secondary = outlined. ghost = text-only. */
  variant?: ButtonVariant;
  /** Accent used by secondary/ghost. primary is always the cinnabar seal. */
  tone?: ButtonTone;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = ButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "color"> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "color"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-body font-medium leading-none whitespace-nowrap select-none transition-colors duration-300 ease-out-expo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cinnabar disabled:pointer-events-none disabled:opacity-40";

const SIZE: Record<ButtonSize, string> = {
  md: "h-11 px-7 text-[0.92rem]",
  sm: "h-9 px-5 text-[0.8rem]",
};

function variantClasses(variant: ButtonVariant, tone: ButtonTone): string {
  if (variant === "primary") {
    // The one restrained "seal" fill in the system — solid cinnabar, paper
    // text, a quiet hover deepen. No glow, no gradient, no scale-bounce.
    return "bg-cinnabar text-paper hover:bg-cinnabar-deep active:bg-cinnabar-deep";
  }
  if (variant === "secondary") {
    return tone === "cinnabar"
      ? "border border-cinnabar/55 text-cinnabar bg-transparent hover:border-cinnabar hover:bg-cinnabar/10"
      : "border border-hairline text-ink-soft bg-transparent hover:border-ink-soft/50 hover:bg-paper-deep";
  }
  return tone === "cinnabar"
    ? "text-cinnabar bg-transparent hover:bg-cinnabar/10"
    : "text-ink bg-transparent hover:bg-paper-deep";
}

/**
 * Button — the one CTA primitive for the app.
 *
 * - variant="primary": the cinnabar seal fill, paper text. Use once per
 *   view for the single most important action ("Reveal your chart") — the
 *   hanko is stamped sparingly, never as a default button color.
 * - variant="secondary": hairline outline, ink-soft or cinnabar text
 *   (tone="cinnabar" to switch). Supporting actions.
 * - variant="ghost": text-only, quiet hover fill. Tertiary/inline actions.
 *
 * Pass `href` to render a Next.js `<Link>` instead of a `<button>` — the
 * variant/tone/size classes are identical either way, so a CTA can move
 * between "navigate" and "submit" without a visual change.
 */
export function Button({
  variant = "primary",
  tone = "gold",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cn(BASE, SIZE[size], variantClasses(variant, tone), className);

  if (rest.href !== undefined) {
    const { href, ...anchorRest } = rest as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...anchorRest}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...(rest as ButtonAsButton)}>
      {children}
    </button>
  );
}
