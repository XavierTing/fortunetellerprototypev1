"use client";

/**
 * The "Share" surface on the compatibility result (PRD §5.5/§7.5's primary
 * invite loop): copy the result link, or open the rendered PNG share card
 * directly (link-preview size, or the Instagram/TikTok story size) via the
 * generic `/api/share/compatibility/[id]` route. No native `navigator.share`
 * dependency — clipboard + new-tab links work everywhere and degrade
 * gracefully (a `window.prompt` fallback if clipboard write is blocked).
 */
import { useState } from "react";
import { Button } from "@/components/ui";

export function ShareButton({ pairId }: { pairId: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}/match/${pairId}`;
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
        href={`/api/share/compatibility/${pairId}`}
        variant="ghost"
        size="sm"
        target="_blank"
        rel="noopener noreferrer"
      >
        Card <span aria-hidden="true">↗</span>
      </Button>
      <Button
        href={`/api/share/compatibility/${pairId}?size=story`}
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
