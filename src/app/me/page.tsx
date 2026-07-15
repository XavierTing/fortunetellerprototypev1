import type { Metadata } from "next";
import { StubPage } from "@/components/stub-page";

export const metadata: Metadata = {
  title: "Me · Cinnabar",
};

export default function MePage() {
  return (
    <StubPage
      glyph="我"
      eyebrow="Coming in M6"
      title="Your profiles and history land here."
      body="Saved birth profiles for yourself and people you care about, past readings, and theme/account settings. No paywalls in the prototype — everything is unlocked."
    />
  );
}
