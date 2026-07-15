import type { ElementType, ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";

type CardProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

/**
 * Card — the one flat surface primitive. Hairline border, small radius
 * (12px — inside the 6-14px card range, never the 24px+ "insanely
 * rounded" look), raised-lacquer/raised-paper fill, no default shadow
 * (this system is hairline-first: borders before shadow).
 *
 * Never nest a Card inside a Card. If content needs internal grouping,
 * use spacing and hairline dividers, not another bordered box. `as` lets
 * a Card render as `<li>`/`<article>` etc. when it's part of a list.
 */
export function Card<T extends ElementType = "div">({
  as,
  className,
  ...rest
}: CardProps<T>) {
  const Comp = (as ?? "div") as ElementType;
  return (
    <Comp
      className={cn(
        "rounded-xl border border-hairline bg-raised p-6",
        className,
      )}
      {...rest}
    />
  );
}

/**
 * Tile — same primitive as Card, named for grid/list contexts (a bento
 * cell, a feature tile). Kept as a distinct export so call sites read
 * intent ("this is a grid cell") without a second implementation to
 * maintain.
 */
export const Tile = Card;
