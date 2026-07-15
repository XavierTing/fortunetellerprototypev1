"use client";

/**
 * Drives the card-by-card natal reading (PRD §5.2). If a Reading is
 * already saved for this profile, it's rendered immediately (revisit —
 * no regeneration). Otherwise this opens an EventSource against
 * `/api/reading/[profileId]/stream` and appends cards as they arrive,
 * so the reading fills in progressively instead of blocking on the full
 * ~8-10 card generation.
 *
 * Layout deliberately isn't a uniform card grid (DESIGN.md's named
 * anti-pattern): the first card ("chart-at-a-glance") is the instant free
 * insight, rendered as a hero pull-quote; "element-balance" merges into
 * the chart visualization above it instead of repeating as prose; the
 * rest render as an editorial, hairline-divided list; "lean-into" (the
 * agency close every reading must end on, per PRD §5.2) gets a small
 * emphasis marker.
 */
import { useEffect, useRef, useState } from "react";
import { CARD_SPECS } from "@/lib/interpreter/card-specs";
import type { Card, Chart } from "@/lib/interpreter/types";
import { ElementBalanceChart } from "./element-balance";
import { HeroSkeleton, MechanicsExpander, ReadingRow, RowSkeleton, TextSkeleton } from "./reading-parts";

type Status = "connecting" | "streaming" | "done" | "error";

const HERO_ID = "chart-at-a-glance";
const ELEMENT_BALANCE_ID = "element-balance";
const CLOSING_ID = "lean-into";

export function ReadingStream({
  profileId,
  chart,
  initialCards,
}: {
  profileId: string;
  chart: Chart;
  initialCards?: Card[];
}) {
  const alreadySaved = Boolean(initialCards && initialCards.length > 0);
  const [cards, setCards] = useState<Card[]>(initialCards ?? []);
  const [status, setStatus] = useState<Status>(alreadySaved ? "done" : "connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const settledRef = useRef(alreadySaved);

  useEffect(() => {
    if (alreadySaved) return;

    settledRef.current = false;
    const source = new EventSource(`/api/reading/${profileId}/stream`);

    source.addEventListener("card", (event) => {
      const card = JSON.parse((event as MessageEvent).data) as Card;
      setStatus("streaming");
      setCards((prev) => [...prev, card]);
    });

    source.addEventListener("done", () => {
      settledRef.current = true;
      setStatus("done");
      source.close();
    });

    source.addEventListener("error", (event) => {
      const raw = (event as MessageEvent).data as string | undefined;
      let message = "The reading hit a snag generating. Please refresh to try again.";
      if (raw) {
        try {
          message = (JSON.parse(raw) as { message?: string }).message ?? message;
        } catch {
          // Not JSON — keep the default message.
        }
      }
      settledRef.current = true;
      setErrorMessage(message);
      setStatus("error");
      source.close();
    });

    source.onerror = () => {
      if (!settledRef.current) {
        settledRef.current = true;
        setStatus("error");
        setErrorMessage("Lost connection while generating your reading. Please refresh to try again.");
      }
      source.close();
    };

    return () => source.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- alreadySaved/profileId are stable for a mounted page
  }, [profileId]);

  const heroCard = cards.find((c) => c.id === HERO_ID);
  const elementCard = cards.find((c) => c.id === ELEMENT_BALANCE_ID);
  const listCards = cards.filter((c) => c.id !== HERO_ID && c.id !== ELEMENT_BALANCE_ID);
  const arrivedIds = new Set(cards.map((c) => c.id));
  const remainingSpecs = CARD_SPECS.filter(
    (spec) => spec.id !== HERO_ID && spec.id !== ELEMENT_BALANCE_ID && !arrivedIds.has(spec.id)
  );
  const stillWaiting = status === "connecting" || status === "streaming";

  return (
    <div className="flex flex-col gap-14">
      <section aria-label="Your reading, at a glance">
        {heroCard ? (
          <div className="animate-rise-in flex flex-col gap-3">
            <p className="font-mono text-[0.68rem] tracking-[0.16em] text-faint uppercase">
              Free · no signup needed
            </p>
            <h2 className="max-w-3xl font-display text-[clamp(1.75rem,3.6vw,2.75rem)] leading-[1.15] font-light text-ink">
              {heroCard.headline}
            </h2>
            <p className="max-w-[62ch] text-[1.05rem] leading-relaxed text-muted">{heroCard.body}</p>
            <MechanicsExpander mechanics={heroCard.mechanics} />
          </div>
        ) : status === "error" ? (
          <p className="text-sm text-cinnabar">{errorMessage}</p>
        ) : (
          <HeroSkeleton />
        )}
      </section>

      <section className="flex flex-col gap-6 border-t border-hairline pt-10">
        <h3 className="font-display text-xl font-medium text-ink">Element Balance</h3>
        <ElementBalanceChart chart={chart} />
        {elementCard ? (
          <div className="animate-rise-in flex flex-col gap-2">
            <p className="max-w-[62ch] text-[0.98rem] leading-relaxed text-muted">{elementCard.body}</p>
            <MechanicsExpander mechanics={elementCard.mechanics} />
          </div>
        ) : stillWaiting ? (
          <TextSkeleton lines={2} />
        ) : null}
      </section>

      <section aria-label="Full reading" className="divide-y divide-hairline border-y border-hairline">
        {listCards.map((card) => (
          <ReadingRow key={card.id} card={card} emphasize={card.id === CLOSING_ID} />
        ))}
        {stillWaiting && remainingSpecs.map((spec) => <RowSkeleton key={spec.id} title={spec.title} />)}
      </section>

      {status === "error" && cards.length > 0 && (
        <p role="alert" className="text-sm text-cinnabar">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
