import Link from "next/link";
import { Seal } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Sticky top chrome: brand lockup (mark + wordmark) and the theme toggle.
 * Sits on the same washi ground as the page itself — 朱墨 chrome is quiet,
 * not a separate "sealed panel" the way the old dark system's lacquer-deep
 * inset was; a single hairline plus a light backdrop-blur is enough
 * separation while scrolling.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-paper/92 backdrop-blur supports-[backdrop-filter]:bg-paper/80 md:pl-20">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <Seal
            aria-hidden="true"
            shape="square"
            size="sm"
            className="group-hover:bg-cinnabar-deep"
          >
            朱
          </Seal>
          <span className="font-display text-[1.4rem] font-medium tracking-[0.02em] text-ink">
            Cinnabar
          </span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
