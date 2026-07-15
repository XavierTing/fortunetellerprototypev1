"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, NAV_ITEMS } from "@/lib/nav";

/**
 * Primary navigation: a bottom bar on mobile, a left rail on desktop.
 * Two renders of the same NAV_ITEMS keep each layout simple instead of
 * fighting one element's classes across breakpoints. Both sit on the
 * washi ground itself (a hairline is the only separation from page
 * content) — 朱墨 chrome is quiet, not a distinct deep-inset panel.
 */
export function Nav() {
  const pathname = usePathname();

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-hairline bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85 md:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium tracking-wide transition-colors duration-300 ease-out-expo ${
                active ? "text-cinnabar" : "text-faint hover:text-ink-soft"
              }`}
            >
              <span
                aria-hidden="true"
                className="font-display text-base leading-none"
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
        className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col items-center gap-1 border-r border-hairline bg-paper py-6 md:flex"
      >
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex w-16 flex-col items-center gap-1.5 rounded-lg py-3 text-[11px] font-medium tracking-wide transition-colors duration-300 ease-out-expo ${
                active
                  ? "bg-cinnabar/12 text-cinnabar"
                  : "text-faint hover:bg-paper-deep hover:text-ink-soft"
              }`}
            >
              <span
                aria-hidden="true"
                className="font-display text-lg leading-none"
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
