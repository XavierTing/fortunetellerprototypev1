"use client";

/**
 * The "Share" surface on Today's fortune (PRD §5.4 acceptance: "Card is
 * share-native"). Unlike `/reading/[id]` and `/match/[id]`, `/today` has no
 * per-item id in its own URL (it always shows the current session's
 * fortune — see `./opengraph-image.tsx`'s file header), so there's no
 * useful "page" link to copy here the way the other two Share buttons copy
 * a page URL. Instead "Share" copies the direct, session-independent card
 * image link (`/api/share/daily/[profileId]`) — that IS the personalized,
 * publicly-viewable artifact for this profile's today, and it's what
 * actually renders when pasted into a chat app or opened by anyone.
 */
import { useState } from "react";
import { Button } from "@/components/ui";

export function ShareButton({ profileId }: { profileId: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}/api/share/daily/${profileId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Button variant="secondary" tone="cinnabar" size="sm" onClick={copyLink}>
        {copied ? "Link copied" : "Share"}
      </Button>
      <Button
        href={`/api/share/daily/${profileId}`}
        variant="ghost"
        size="sm"
        target="_blank"
        rel="noopener noreferrer"
      >
        Card <span aria-hidden="true">↗</span>
      </Button>
      <Button
        href={`/api/share/daily/${profileId}?size=story`}
        variant="ghost"
        size="sm"
        target="_blank"
        rel="noopener noreferrer"
      >
        Story size <span aria-hidden="true">↗</span>
      </Button>
    </div>
  );
}
