import type { Metadata } from "next";
import { Card, Eyebrow, Section } from "@/components/ui";
import { BirthForm } from "./birth-form";

export const metadata: Metadata = {
  title: "Reveal your chart · Cinnabar",
  description:
    "Enter your birth date, time, and place — resolved to true solar time and the correct historical timezone — for a free, instant Four Pillars reading.",
};

export default function NewReadingPage() {
  return (
    <Section className="flex flex-col gap-10 py-16 sm:py-24">
      <div className="flex flex-col gap-4">
        <Eyebrow>八字 · Four Pillars</Eyebrow>
        <h1 className="max-w-xl font-display text-[clamp(2.25rem,5vw,3.5rem)] font-light leading-[1.05] tracking-[-0.015em] text-ink">
          Tell us when and where you began.
        </h1>
        <p className="max-w-[58ch] text-[1.02rem] leading-relaxed text-muted">
          No account needed — your first reading is free, and your chart is computed the moment you submit. Don&apos;t
          know your exact birth time? That&apos;s fine; mark it unknown and we&apos;ll compute what the day itself can
          tell you.
        </p>
      </div>

      <Card className="max-w-2xl p-6 sm:p-10">
        <BirthForm />
      </Card>
    </Section>
  );
}
