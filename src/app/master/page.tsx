import type { Metadata } from "next";
import { StubPage } from "@/components/stub-page";

export const metadata: Metadata = {
  title: "Master · Cinnabar",
};

export default function MasterPage() {
  return (
    <StubPage
      glyph="師"
      eyebrow="Coming in M3"
      title="The Master is still finding his voice."
      body="Soon you'll be able to ask your 师傅 follow-up questions about your chart in natural English — grounded in your actual pillars, never generic. Warm, wise, a little wry; never a sycophant or a doom-monger. Start with a reading first."
    />
  );
}
