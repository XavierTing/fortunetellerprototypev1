/**
 * Tiny classnames joiner — the one dependency-free utility every kit
 * primitive uses to merge caller-supplied `className` with its own base
 * classes. Deliberately not `clsx`/`tailwind-merge` (no npm installs for
 * this task): falsy values are dropped, everything else is joined in
 * order, so later classes win ties the same way plain string
 * concatenation would.
 */
export type ClassValue = string | number | null | undefined | false;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
