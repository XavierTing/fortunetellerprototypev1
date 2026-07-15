import type { Metadata } from "next";
import { StubPage } from "@/components/stub-page";

export const metadata: Metadata = {
  title: "Match · Cinnabar",
};

export default function MatchPage() {
  return (
    <StubPage
      glyph="合"
      eyebrow="Coming in M5"
      title="Compatibility readings arrive soon."
      body="Enter a second person's birth data — or pick a saved profile — and see the relationship dynamics between two charts: how you energize each other, friction points, and a beautiful shareable verdict card."
    />
  );
}
