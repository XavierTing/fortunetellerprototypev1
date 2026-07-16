import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card, Eyebrow, Seal, Section, SectionHead } from "@/components/ui";

export const metadata: Metadata = {
  title: "Why not just ask ChatGPT? · Cinnabar",
  description:
    "Why a real calendar engine and an honest, chart-grounded voice beat asking a general chatbot for your BaZi reading.",
};

const COMPARISON_ROWS = [
  {
    title: "Your chart itself",
    generic:
      "Guesses your pillars from whatever you type — no verified calendar library, no timezone/DST math. Independent testing puts general-chatbot chart-casting accuracy at only about 50–70%.",
    cinnabar:
      "Computed in code by a dedicated engine before any AI sees your data — lunar calendar, true solar time, and daylight-saving history worked out exactly, not guessed at.",
  },
  {
    title: "Timezone & true solar time",
    generic:
      "Expects you to know and type your own timezone offset, or silently assumes one — the exact manual step most people get wrong.",
    cinnabar:
      "Works out your timezone and its daylight-saving history from the place you were born, then corrects for true solar time — automatically, every time.",
  },
  {
    title: "Consistency, message to message",
    generic:
      "Every reply re-derives your chart from scratch inside the conversation. Ask twice, phrase it differently, and the \"facts\" can quietly drift.",
    cinnabar:
      "One chart, computed once, saved, and handed to every card and every chat reply as fact. The AI interprets it — it never re-invents it.",
  },
  {
    title: "Honesty about you",
    generic:
      "Optimized to sound agreeable. Push back gently on a flattering answer and a general chatbot will often just agree with the pushback too.",
    cinnabar:
      "Prompted against sycophancy on purpose — blind spots are named kindly but plainly, and every reading still has to end on something you can actually do.",
  },
  {
    title: "The voice",
    generic:
      "Chinese calendar terms translated word-for-word, or a wall of jargon with no explanation — it reads like it's been run through a translator.",
    cinnabar:
      "Plain English first, always. Pinyin and Chinese terms live in an optional \"the mechanics ⓘ\" section, explained every time they appear.",
  },
] as const;

export default function WhyPage() {
  return (
    <>
      <Section className="relative flex flex-col gap-7 overflow-hidden py-20 sm:py-28">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 -z-10 select-none font-cjk leading-none text-ink/[0.05]"
          style={{ fontSize: "clamp(10rem, 22vw, 18rem)" }}
        >
          問
        </span>
        <div className="animate-rise-in flex flex-col gap-7">
          <Eyebrow>
            <span className="font-cjk">問</span> · Why Cinnabar
          </Eyebrow>
          <h1 className="max-w-3xl font-display text-[clamp(2.5rem,5.4vw,4.25rem)] leading-[1.06] font-light tracking-[-0.015em] text-ink">
            Why not just ask <span className="text-ink-soft">ChatGPT</span>?
          </h1>
          <p className="max-w-[62ch] text-[1.08rem] leading-relaxed text-muted">
            You can. People do, constantly — and most of the time the chart it hands back is quietly wrong. A
            general chatbot is a language model with no calendar library, no timezone database, and no memory of
            what it told you five minutes ago. Cinnabar splits the job in two: a small, boring program does the
            arithmetic, and the AI only ever explains what the arithmetic already found.
          </p>
        </div>
      </Section>

      <Section className="border-t border-hairline py-20">
        <SectionHead
          title="Calculated, not guessed"
          sub="BaZi (八字) is a real calendar system with real rules — solar-term boundaries, a 60-year cycle, hour pillars that flip on the exact solar minute. That's arithmetic, not vibes."
        />
        <div className="mt-10 flex flex-col divide-y divide-hairline border-y border-hairline">
          <div
            className="animate-rise-in flex flex-col gap-2 py-7 sm:flex-row sm:items-baseline sm:gap-8"
            style={{ animationDelay: "0ms" }}
          >
            <span className="font-mono text-[0.66rem] tracking-[0.12em] text-faint uppercase sm:w-44 sm:shrink-0">
              Lunar calendar
            </span>
            <p className="max-w-[56ch] text-sm leading-relaxed text-muted">
              Your pillars come from a proven calendar library — not from an AI guessing off birthdays that look
              like yours.
            </p>
          </div>
          <div
            className="animate-rise-in flex flex-col gap-2 py-7 sm:flex-row sm:items-baseline sm:gap-8"
            style={{ animationDelay: "70ms" }}
          >
            <span className="font-mono text-[0.66rem] tracking-[0.12em] text-faint uppercase sm:w-44 sm:shrink-0">
              Timezone &amp; DST
            </span>
            <p className="max-w-[56ch] text-sm leading-relaxed text-muted">
              Your birthplace tells us your timezone and its actual daylight-saving history — automatically, the
              moment you pick a city.
            </p>
          </div>
          <div
            className="animate-rise-in flex flex-col gap-2 py-7 sm:flex-row sm:items-baseline sm:gap-8"
            style={{ animationDelay: "140ms" }}
          >
            <span className="font-mono text-[0.66rem] tracking-[0.12em] text-faint uppercase sm:w-44 sm:shrink-0">
              True solar time
            </span>
            <p className="max-w-[56ch] text-sm leading-relaxed text-muted">
              Your hour pillar is corrected for longitude — two people born at the same civil clock time on opposite
              sides of a timezone get correctly different charts.
            </p>
          </div>
        </div>
      </Section>

      <Section className="border-t border-hairline py-20">
        <SectionHead
          title="Honest, chart-grounded readings"
          sub="The AI never invents a pillar, an element count, or a date — those come straight from the engine. All it does is explain them, and it's told, explicitly, not to flatter you."
        />
        <div className="mt-10 flex flex-col gap-6 border-y border-hairline py-2 divide-y divide-hairline">
          <p className="pt-6 max-w-[64ch] text-[1.02rem] leading-relaxed text-text">
            Ask a general chatbot the same question twice, phrased two different ways, and you can get two different
            &ldquo;charts.&rdquo; Cinnabar computes your chart exactly once, saves it, and every card, every daily
            fortune, and every reply from the Master is grounded in that same saved chart. Nothing gets
            recalculated, and nothing quietly drifts.
          </p>
          <p className="pt-6 max-w-[64ch] text-[1.02rem] leading-relaxed text-text">
            The Master is prompted against flattery on purpose: blind spots get named kindly, not flattered away, and
            an &ldquo;unlucky year&rdquo; gets reframed as something you can work with, not a verdict. Every reading
            has to end on something you can actually do — agency over fate, by design.
          </p>
        </div>
      </Section>

      <Section className="border-t border-hairline py-20">
        <SectionHead title="Side by side" sub="The same question, asked two ways." />
        <div className="mt-10 flex flex-col divide-y divide-hairline border-y border-hairline">
          {COMPARISON_ROWS.map((row, i) => (
            <div
              key={row.title}
              className="animate-rise-in grid gap-4 py-8 sm:grid-cols-[1fr_1.4fr_1.4fr] sm:gap-8"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <h3 className="font-display text-lg font-medium text-ink">{row.title}</h3>
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[0.66rem] tracking-[0.12em] text-faint uppercase">
                  A general chatbot
                </span>
                <p className="text-sm leading-relaxed text-muted">{row.generic}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[0.66rem] tracking-[0.12em] text-cinnabar uppercase">Cinnabar</span>
                <p className="text-sm leading-relaxed text-text">{row.cinnabar}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-t border-hairline py-20">
        <Card className="flex flex-col gap-6 p-8 sm:p-12">
          <h2 className="font-display text-[clamp(1.9rem,3vw,2.5rem)] leading-tight font-medium text-ink">
            See the difference on your own chart.
          </h2>
          <p className="max-w-2xl text-[1.02rem] leading-relaxed text-muted">
            Free, no signup, under a minute. Enter your birth date, time, and place, and watch the timezone and true
            solar time get resolved automatically — the exact step a general chatbot skips.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button href="/reading/new">
              Reveal your chart <span aria-hidden="true">→</span>
            </Button>
            <Link
              href="/"
              className="text-sm font-medium text-ink-soft underline decoration-hairline underline-offset-4 transition-colors duration-300 ease-out-expo hover:text-cinnabar"
            >
              Back to Cinnabar
            </Link>
          </div>
        </Card>
      </Section>

      <Section className="flex justify-center py-16">
        <Seal aria-hidden="true" shape="square" size="sm" className="animate-seal-stamp font-cjk">
          朱
        </Seal>
      </Section>
    </>
  );
}
