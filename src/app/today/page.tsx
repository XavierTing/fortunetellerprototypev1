import type { Metadata } from "next";
import { StubPage } from "@/components/stub-page";

export const metadata: Metadata = {
  title: "Today · Cinnabar",
};

export default function TodayPage() {
  return (
    <StubPage
      glyph="曆"
      eyebrow="Coming in M4"
      title="Today's fortune is still being cast."
      body="A short, personalized read tied to today's real energy — today's 干支 day pillar interacting with your Day Master — plus a concrete lean-into and go-easy-on for the day. One card a day, worth screenshotting."
    />
  );
}
