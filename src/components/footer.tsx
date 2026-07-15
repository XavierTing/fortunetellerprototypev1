import Link from "next/link";

/**
 * Global footer: brand lockup, a handful of links (the trust page, the four
 * features), and the entertainment/self-reflection disclaimer PRD.md's own
 * closing line carries. Sits on `lacquer-deep` — the same "sealed panel"
 * treatment `SiteHeader`/`Nav` use for persistent chrome — with its own
 * `pb-24 md:pb-0` clearance so the fixed mobile bottom nav never covers its
 * content (mirrors `<main>`'s own clearance in `layout.tsx`).
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
    <footer className="border-t border-hairline bg-lacquer-deep pb-24 md:pb-0 md:pl-20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <Link href="/" className="group flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-cinnabar font-display text-xs font-medium text-lacquer-deep transition-colors duration-200 ease-out-expo group-hover:bg-cinnabar-deep"
            >
              朱
            </span>
            <span className="font-display text-base font-medium text-ink">Cinnabar</span>
          </Link>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-medium text-faint transition-colors duration-200 ease-out-expo hover:text-cinnabar"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-relaxed text-faint">
            Fortune-telling content is for entertainment and self-reflection, not professional, medical, legal, or
            financial advice. Cinnabar computes your chart deterministically and has a language model interpret
            it —{" "}
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
