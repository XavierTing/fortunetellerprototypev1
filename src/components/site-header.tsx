import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Sticky top chrome: brand lockup (mark + wordmark) and the theme toggle.
 * Sits on --lacquer-deep (the deepest inset surface) rather than the page
 * ground, so persistent product chrome reads as a distinct, sealed panel —
 * the same "picker is brand" idea as the nav rail below it.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-lacquer-deep/92 backdrop-blur supports-[backdrop-filter]:bg-lacquer-deep/80 md:pl-20">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-cinnabar font-display text-[0.85rem] font-medium text-lacquer-deep transition-colors duration-200 ease-out-expo group-hover:bg-cinnabar-deep"
          >
            朱
          </span>
          <span className="font-display text-[1.4rem] font-medium tracking-[0.02em] text-ink">
            Cinnabar
          </span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
