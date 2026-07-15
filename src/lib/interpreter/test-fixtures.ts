/**
 * Shared Chart / RelationFacts fixtures for interpreter unit tests. Not a
 * test file itself (vitest only picks up `*.test.ts`) — imported by the
 * ones that are. Charts are built from the REAL `computeChart` engine (not
 * hand-authored JSON) so every field — pillars, hiddenStems, elements,
 * dayMasterStrength, luckPillars, branchRelations — is guaranteed
 * internally consistent and stays in lockstep with the engine's actual
 * behavior. Two deliberately different birth profiles so tests can assert
 * mock output actually varies with the chart instead of being templated.
 */
import { computeChart } from "@/lib/bazi";
import type { Chart, RelationFacts, ChatMessage, Reading } from "./types";

/**
 * Strong Yang Wood day master (甲), known hour, Beijing birth. Carries two
 * different branch-relation types (六合 liuhe + 相刑 xing) so
 * friction-and-flow / compatibility tests exercise both the "harmonious"
 * and "clashing" code paths.
 */
export const CHART_STRONG_WOOD: Chart = computeChart({
  date: "1960-01-27",
  time: "19:30",
  lat: 39.9042,
  lng: 116.4074,
  tzId: "Asia/Shanghai",
});

/** Weak Yin Water day master (癸), unknown birth time (degrades to a 3-pillar chart), no branch relations. */
export const CHART_WEAK_WATER: Chart = computeChart({
  date: "1964-02-24",
  time: null,
  lat: 51.5074,
  lng: -0.1278,
  tzId: "Europe/London",
});

export const RELATION_FACTS: RelationFacts = {
  dayMasterRelation: {
    type: "generated-by",
    aElement: "wood",
    bElement: "water",
    note: "Person B's Water feeds Person A's Wood — a naturally nourishing dynamic.",
  },
  branchRelations: [
    { type: "liuhe", branches: ["子", "丑"], note: "A supportive six-harmony tie between your charts." },
  ],
  complementaryElements: ["fire", "metal"],
  clashingElements: ["earth"],
};

export const CHAT_MESSAGES_IN_SCOPE: ChatMessage[] = [
  { role: "user", content: "When's a good time for me to change careers?" },
];

export const CHAT_MESSAGES_OUT_OF_SCOPE: ChatMessage[] = [
  { role: "user", content: "Should I sue my landlord over the lease, based on my chart?" },
];

export function sampleReading(chart: Chart, model = "mock"): Reading {
  return {
    model,
    cards: [
      {
        id: "elemental-nature",
        headline: `A ${chart.dayMasterStrength} ${chart.dayMaster.element} core.`,
        body: `Your Day Master is ${chart.dayMaster.element}, running ${chart.dayMasterStrength} in this chart.`,
      },
      {
        id: "lean-into",
        headline: "Lean into what already works.",
        body: `Favorable elements: ${chart.favorableElements.join(", ") || "none flagged"}.`,
      },
    ],
  };
}
