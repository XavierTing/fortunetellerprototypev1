"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, NAV_ITEMS } from "@/lib/nav";

/**
 * Primary navigation: a bottom bar on mobile, a left rail on desktop.
 * Two renders of the same NAV_ITEMS keep each layout simple instead of
 * fighting one element's classes across breakpoints.
 */
export function Nav() {
  const pathname = usePathname();

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-line bg-panel/95 backdrop-blur supports-[backdrop-filter]:bg-panel/80 md:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] tracking-wide transition-colors ${
                active ? "text-cinnabar" : "text-ink/60 hover:text-ink"
              }`}
            >
              <span
                aria-hidden="true"
                className="font-serif text-base leading-none"
              >
                {item.glyph}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <nav
        aria-label="Primary"
        className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col items-center gap-1 border-r border-line bg-panel py-6 md:flex"
      >
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex w-16 flex-col items-center gap-1.5 rounded-md py-3 text-[11px] tracking-wide transition-colors ${
                active
                  ? "bg-cinnabar/10 text-cinnabar"
                  : "text-ink/60 hover:bg-ink/5 hover:text-ink"
              }`}
            >
              <span
                aria-hidden="true"
                className="font-serif text-lg leading-none"
              >
                {item.glyph}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
