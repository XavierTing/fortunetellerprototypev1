/**
 * One row in a history list (Readings / Chat threads / Compatibility) —
 * deliberately the same hairline-divided, hover-lit `Link` row the
 * homepage's "What Cinnabar reads" section and `master/page.tsx`'s empty
 * state use, not a repeated `Card` grid (DESIGN.md's named anti-pattern).
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { Tag } from "@/components/ui";

export function HistoryRow({
  href,
  title,
  meta,
  tag,
}: {
  href: string;
  title: string;
  meta: string;
  tag?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 py-5 transition-colors duration-200 ease-out-expo hover:bg-raised"
    >
      <span className="flex min-w-0 flex-col gap-1">
        <span className="truncate font-display text-base font-medium text-ink">{title}</span>
        <span className="text-xs text-muted">{meta}</span>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        {tag ? <Tag variant="neutral">{tag}</Tag> : null}
        <span
          aria-hidden="true"
          className="font-mono text-xs text-faint transition-colors duration-200 ease-out-expo group-hover:text-cinnabar"
        >
          →
        </span>
      </span>
    </Link>
  );
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="py-2 text-sm text-faint">{children}</p>;
}
