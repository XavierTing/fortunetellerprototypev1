import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/70 md:pl-20">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-serif text-lg tracking-wide text-ink"
        >
          <span
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center rounded-[3px] bg-cinnabar text-[11px] font-medium text-paper"
          >
            命
          </span>
          Cinnabar
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
