"use client";

/**
 * The "Share" surface on the natal reading (PRD §5.2 acceptance: "Every
 * reading renders a shareable image"). Mirrors `match/[id]/share-button.tsx`
 * exactly — copy the reading link, or open the rendered PNG (link-preview
 * or Instagram/TikTok story size) via `/api/share/reading/[id]`. `id` here
 * is the profile id, matching `/reading/[id]`'s own route param.
 */
import { useState } from "react";
import { Button } from "@/components/ui";

export function ShareButton({ profileId }: { profileId: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}/reading/${profileId}`;
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
        href={`/api/share/reading/${profileId}`}
        variant="ghost"
        size="sm"
        target="_blank"
        rel="noopener noreferrer"
      >
        Card <span aria-hidden="true">↗</span>
      </Button>
      <Button
        href={`/api/share/reading/${profileId}?size=story`}
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
