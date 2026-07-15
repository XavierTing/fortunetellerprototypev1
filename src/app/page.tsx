import Link from "next/link";

const FEATURES = [
  {
    href: "/master",
    glyph: "師",
    title: "Ask the Master",
    body: "Chat with your 师傅 about your chart in plain English — grounded in your actual pillars, never generic horoscope filler.",
  },
  {
    href: "/today",
    glyph: "曆",
    title: "Today's Fortune",
    body: "A short, honest read of how today's real energy meets your Day Master. One card a day, worth screenshotting.",
  },
  {
    href: "/match",
    glyph: "合",
    title: "Compatibility",
    body: "See the dynamic between two charts — how you energize each other, and where patience pays off.",
  },
  {
    href: "/me",
    glyph: "我",
    title: "Your Profiles",
    body: "Save birth charts for yourself and people you care about, and come back to past readings any time.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <section className="relative overflow-hidden py-20 sm:py-28">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 top-6 hidden h-28 w-28 rotate-6 items-center justify-center rounded-md border-[3px] border-cinnabar/70 font-serif text-4xl text-cinnabar/70 sm:flex"
        >
          命
        </span>

        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">
          八字 · Four Pillars
        </p>
        <h1 className="mt-4 font-serif text-5xl text-ink sm:text-6xl">
          Cinnabar
        </h1>
        <p className="mt-3 max-w-xl font-serif text-2xl text-ink/90">
          Chinese astrology, in plain English.
        </p>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/70">
          Your 八字 is computed correctly from your exact birth moment and
          place, then explained like a smart, honest friend would — not a
          fortune-cookie. No jargon walls, no doom, no crystal balls. Just a
          clear read of who you are, and something to do about it.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href="#reveal"
            className="inline-flex items-center gap-2 rounded-full bg-cinnabar px-6 py-3 text-sm font-medium text-paper shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Reveal your chart
            <span aria-hidden="true">→</span>
          </a>
          <span className="font-mono text-xs text-ink/50">
            No signup · under 30 seconds
          </span>
        </div>
      </section>

      <section
        aria-label="What Cinnabar reads"
        className="grid gap-4 border-t border-line py-14 sm:grid-cols-2 lg:grid-cols-4"
      >
        {FEATURES.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="group flex flex-col gap-3 rounded-xl border border-line bg-panel p-5 transition-colors hover:border-cinnabar/60"
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-md bg-cinnabar/10 font-serif text-lg text-cinnabar"
            >
              {feature.glyph}
            </span>
            <span className="font-serif text-lg text-ink">
              {feature.title}
            </span>
            <span className="text-sm leading-relaxed text-ink/65">
              {feature.body}
            </span>
            <span className="mt-auto text-xs font-medium text-jade opacity-0 transition-opacity group-hover:opacity-100">
              Explore →
            </span>
          </Link>
        ))}
      </section>

      <section id="reveal" className="scroll-mt-24 border-t border-line py-16">
        <div className="rounded-2xl border border-line bg-panel p-6 sm:p-10">
          <span className="inline-block rounded-full bg-brass/15 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-brass">
            Coming in the next milestone
          </span>
          <h2 className="mt-4 font-serif text-3xl text-ink">
            Your birth-chart form lives here next.
          </h2>
          <p className="mt-3 max-w-2xl text-ink/70">
            Name (optional), your exact birth date &amp; time — or “I don’t
            know my time” — and a place. We resolve the timezone, historical
            DST, and true solar time automatically, so two people born at the
            same civil hour on opposite sides of the world get correctly
            different charts.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2" aria-hidden="true">
            {[
              { label: "Name (optional)", value: "" },
              { label: "Birth date", value: "" },
              { label: "Birth time", value: "I don't know my time" },
              { label: "Birthplace", value: "" },
            ].map((field) => (
              <div key={field.label} className="flex flex-col gap-1.5">
                <span className="font-mono text-[11px] uppercase tracking-wide text-ink/40">
                  {field.label}
                </span>
                <div className="rounded-md border border-dashed border-line bg-paper px-3 py-2.5 text-sm text-ink/30">
                  {field.value || "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
