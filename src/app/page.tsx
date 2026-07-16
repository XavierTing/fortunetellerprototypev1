import Link from "next/link";
import { Badge, Button, Card, Eyebrow, Field, Input, Section, SectionHead } from "@/components/ui";
import { Hero } from "./hero";

const FEATURES = [
  {
    href: "/master",
    glyph: "師",
    title: "Ask the Master",
    body: "Chat with the Master about your chart in plain English — grounded in your real chart, never generic horoscope filler.",
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
    <>
      <div className="relative overflow-hidden">
        {/* The hero's decorative ink composition lives in its own component
            (src/app/hero.tsx) so a later task can swap it for an
            interactive canvas without touching this page's copy. */}
        <Hero />

        <Section className="flex flex-col gap-6 py-20 sm:py-24">
          <div className="animate-rise-in flex items-center gap-3">
            <Eyebrow>
              <span className="font-cjk">八字</span> · Four Pillars
            </Eyebrow>
          </div>

          <h1
            className="animate-rise-in max-w-2xl font-display text-[clamp(2.5rem,5.6vw,4.5rem)] font-light tracking-[-0.015em] text-ink"
            style={{ animationDelay: "80ms", lineHeight: 1.15 }}
          >
            Millions share your horoscope.
            <br />
            No one shares your chart.
          </h1>

          <p
            className="animate-rise-in max-w-[34rem] font-display text-[1.4rem] text-muted"
            style={{ animationDelay: "160ms" }}
          >
            Real Chinese astrology, calculated from your exact birth
            minute — in plain English.
          </p>

          <p
            className="animate-rise-in max-w-[34rem] text-[1.02rem] leading-[1.8] text-muted"
            style={{ animationDelay: "230ms" }}
          >
            Your birth time is corrected to the true position of the sun
            where you were born, and your chart is read the way a calm,
            honest teacher would read it: no jargon, no doom, no crystal
            balls.
          </p>

          <div
            className="animate-rise-in flex flex-wrap items-center gap-5 pt-3"
            style={{ animationDelay: "300ms" }}
          >
            <Button href="/reading/new">
              Reveal your chart <span aria-hidden="true">→</span>
            </Button>
            <span className="font-mono text-[0.72rem] tracking-[0.08em] text-faint uppercase">
              No signup · under 30 seconds
            </span>
          </div>
        </Section>
      </div>

      <Section className="border-t border-hairline py-20">
        <SectionHead
          title="What Cinnabar reads"
          sub="Four ways to explore one accurate chart."
        />

        <div className="mt-10 flex flex-col divide-y divide-hairline border-y border-hairline">
          {FEATURES.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group flex items-center gap-5 py-7 transition-colors duration-300 ease-out-expo hover:bg-paper-deep sm:gap-8"
            >
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-hairline font-cjk text-xl text-ink-soft transition-colors duration-300 ease-out-expo group-hover:text-cinnabar"
              >
                {feature.glyph}
              </span>
              <span className="flex-1">
                <span className="block font-display text-xl font-medium text-ink">
                  {feature.title}
                </span>
                <span className="mt-1 block max-w-[56ch] text-sm leading-relaxed text-muted">
                  {feature.body}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="shrink-0 font-mono text-xs text-faint transition-colors duration-300 ease-out-expo group-hover:text-cinnabar"
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <Section id="reveal" className="scroll-mt-24 border-t border-hairline py-20">
        <Card className="flex flex-col gap-8 p-8 sm:p-12">
          <div className="flex flex-col gap-4">
            <Badge variant="jade">Free · no signup needed</Badge>
            <h2 className="font-display text-[clamp(1.9rem,3vw,2.5rem)] leading-tight font-medium text-ink">
              Your birth-chart form takes under a minute.
            </h2>
            <p className="max-w-2xl text-[1.02rem] leading-relaxed text-muted">
              Just your name (optional), your birth date and time, and where
              you were born. We handle the timezone, daylight saving, and true
              solar time for you — so two people born at the same clock time in
              different places get the correct, different charts.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2" aria-hidden="true">
            <Field label="Name (optional)">
              <Input placeholder="—" disabled />
            </Field>
            <Field label="Birth date">
              <Input placeholder="—" disabled />
            </Field>
            <Field label="Birth time">
              <Input placeholder="I don't know my time" disabled />
            </Field>
            <Field label="Birthplace">
              <Input placeholder="—" disabled />
            </Field>
          </div>

          <Button href="/reading/new" className="self-start">
            Begin your reading <span aria-hidden="true">→</span>
          </Button>
        </Card>
      </Section>
    </>
  );
}
