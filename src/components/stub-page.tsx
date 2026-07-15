import Link from "next/link";

interface StubPageProps {
  glyph: string;
  eyebrow: string;
  title: string;
  body: string;
}

/**
 * Shared "coming soon" layout for the four nav routes that don't have a
 * real feature yet (T0 is foundation-only — see PRD §13 milestones).
 * Keeps stub pages on-brand instead of a blank white screen.
 */
export function StubPage({ glyph, eyebrow, title, body }: StubPageProps) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-start justify-center px-4 py-20 sm:px-6">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-md bg-cinnabar/10 font-serif text-2xl text-cinnabar"
      >
        {glyph}
      </span>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-brass">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-serif text-4xl text-ink">{title}</h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/70">
        {body}
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-jade transition-colors hover:text-jade/80"
      >
        <span aria-hidden="true">←</span> Back to Reading
      </Link>
    </div>
  );
}
