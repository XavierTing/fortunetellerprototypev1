import Link from "next/link";
import { Seal } from "@/components/ui";
import { SECTION_CONTAINER } from "@/components/ui/section";

/**
 * Global footer: brand lockup, a handful of links (the trust page, the four
 * features), and the entertainment/self-reflection disclaimer PRD.md's own
 * closing line carries. Sits on the same washi ground as the page — quiet
 * chrome, one hairline for separation — with its own `pb-24 md:pb-0`
 * clearance so the fixed mobile bottom nav never covers its content
 * (mirrors `<main>`'s own clearance in `layout.tsx`).
 */
const FOOTER_LINKS = [
  { href: "/why", label: "Why not just ChatGPT?" },
  { href: "/reading/new", label: "Reading" },
  { href: "/master", label: "Master" },
  { href: "/today", label: "Today" },
  { href: "/match", label: "Match" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-paper pb-24 md:pb-0 md:pl-20">
      <div className={`${SECTION_CONTAINER} flex flex-col gap-7 py-12`}>
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <Link href="/" className="group flex items-center gap-2.5">
            <Seal
              aria-hidden="true"
              shape="square"
              size="sm"
              className="h-6 w-6 text-[0.7rem] group-hover:bg-cinnabar-deep"
            >
              朱
            </Seal>
            <span className="font-display text-base font-medium text-ink">Cinnabar</span>
          </Link>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-medium text-faint transition-colors duration-300 ease-out-expo hover:text-cinnabar"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-hairline pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-relaxed text-faint">
            Fortune-telling content is for entertainment and self-reflection, not professional, medical, legal, or
            financial advice. Cinnabar calculates your chart in code and has an AI interpret it —{" "}
            <Link href="/why" className="text-faint underline decoration-hairline underline-offset-2 hover:text-cinnabar">
              here&apos;s why that&apos;s different
            </Link>
            .
          </p>
          <p className="font-mono text-[0.66rem] tracking-[0.1em] text-faint uppercase">A prototype build</p>
        </div>
      </div>
    </footer>
  );
}
