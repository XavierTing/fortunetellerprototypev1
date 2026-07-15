import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonTone = "gold" | "cinnabar";
export type ButtonSize = "md" | "sm";

interface ButtonOwnProps {
  /** primary = filled (CTA). secondary = outlined. ghost = text-only. */
  variant?: ButtonVariant;
  /** Accent used by secondary/ghost. primary is always gold-filled. */
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
  "inline-flex items-center justify-center gap-2 rounded-full font-body font-medium leading-none whitespace-nowrap select-none transition-colors duration-200 ease-out-expo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cinnabar disabled:pointer-events-none disabled:opacity-40";

const SIZE: Record<ButtonSize, string> = {
  md: "h-11 px-6 text-[0.92rem]",
  sm: "h-9 px-4 text-[0.8rem]",
};

function variantClasses(variant: ButtonVariant, tone: ButtonTone): string {
  if (variant === "primary") {
    return "bg-gold text-lacquer-deep hover:bg-gold-pale active:bg-gold-rich";
  }
  if (variant === "secondary") {
    return tone === "cinnabar"
      ? "border border-cinnabar/55 text-cinnabar bg-transparent hover:border-cinnabar hover:bg-cinnabar/10"
      : "border border-hairline-gold text-gold bg-transparent hover:border-gold hover:bg-gold/10";
  }
  return tone === "cinnabar"
    ? "text-cinnabar bg-transparent hover:bg-cinnabar/10"
    : "text-ink bg-transparent hover:bg-graphite";
}

/**
 * Button — the one CTA primitive for the app.
 *
 * - variant="primary": gold fill, lacquer-deep text. Use once per view for
 *   the single most important action ("Reveal your chart").
 * - variant="secondary": hairline outline, gold or cinnabar text
 *   (tone="cinnabar" to switch). Supporting actions.
 * - variant="ghost": text-only, subtle hover fill. Tertiary/inline actions.
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
