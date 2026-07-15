import { describe, expect, it } from "vitest";
import {
  SYSTEM_PROMPT,
  buildCardPrompt,
  buildChatSystemPrompt,
  buildDailyFortunePrompt,
  buildCompatibilityPrompt,
  toModelMessages,
} from "./prompts";
import { CARD_SPECS } from "./card-specs";
import { CHART_STRONG_WOOD, CHART_WEAK_WATER, RELATION_FACTS, sampleReading, CHAT_MESSAGES_IN_SCOPE } from "./test-fixtures";

describe("SYSTEM_PROMPT", () => {
  it("encodes the four PRD §9 voice pillars", () => {
    expect(SYSTEM_PROMPT).toMatch(/JARGON/i);
    expect(SYSTEM_PROMPT).toMatch(/AGENCY OVER FATE/i);
    expect(SYSTEM_PROMPT).toMatch(/HONEST, NOT FLATTERING/i);
    expect(SYSTEM_PROMPT).toMatch(/NATIVE ENGLISH CADENCE/i);
  });

  it("explicitly bans known translated-Chinese tells", () => {
    expect(SYSTEM_PROMPT).toMatch(/As a \[X\] Day Master/);
    expect(SYSTEM_PROMPT).toMatch(/Firstly/);
    expect(SYSTEM_PROMPT).toMatch(/Since ancient times/);
    expect(SYSTEM_PROMPT).toMatch(/You will definitely/);
  });

  it("hard-enforces chart grounding (never invent facts)", () => {
    expect(SYSTEM_PROMPT.toLowerCase()).toMatch(/never invent/);
  });

  it("carries the pinyin + gloss mechanics rule", () => {
    expect(SYSTEM_PROMPT).toMatch(/pinyin/i);
    expect(SYSTEM_PROMPT).toMatch(/gloss/i);
  });

  it("includes native-English few-shot exemplars", () => {
    expect(SYSTEM_PROMPT).toMatch(/Exemplar A/);
    expect(SYSTEM_PROMPT).toMatch(/Exemplar B/);
  });
});

describe("buildCardPrompt", () => {
  it("grounds the prompt in the actual chart JSON, not invented facts", () => {
    const prompt = buildCardPrompt(CHART_STRONG_WOOD, CARD_SPECS[0]);
    expect(prompt).toContain(CHART_STRONG_WOOD.dayMaster.stem);
    expect(prompt).toContain(CHART_STRONG_WOOD.zodiac);
    expect(prompt).toContain(`"wood": ${CHART_STRONG_WOOD.elements.wood}`); // exact element count from the fixture, verbatim in the JSON block
  });

  it("differs per chart (no hardcoded chart facts)", () => {
    const promptA = buildCardPrompt(CHART_STRONG_WOOD, CARD_SPECS[0]);
    const promptB = buildCardPrompt(CHART_WEAK_WATER, CARD_SPECS[0]);
    expect(promptA).not.toBe(promptB);
  });

  it("includes the card's title and focus", () => {
    const spec = CARD_SPECS.find((s) => s.id === "blind-spots")!;
    const prompt = buildCardPrompt(CHART_STRONG_WOOD, spec);
    expect(prompt).toContain(spec.title);
    expect(prompt).toContain(spec.focus);
  });
});

describe("buildChatSystemPrompt", () => {
  it("includes the base voice guide, the chart, and the reading's cards", () => {
    const reading = sampleReading(CHART_STRONG_WOOD);
    const prompt = buildChatSystemPrompt(CHART_STRONG_WOOD, reading);
    expect(prompt).toContain(SYSTEM_PROMPT);
    expect(prompt).toContain(CHART_STRONG_WOOD.dayMaster.stem);
    for (const card of reading.cards) {
      expect(prompt).toContain(card.headline);
    }
  });
});

describe("toModelMessages", () => {
  it("maps ChatMessage[] to {role, content} pairs", () => {
    const mapped = toModelMessages(CHAT_MESSAGES_IN_SCOPE);
    expect(mapped).toEqual(CHAT_MESSAGES_IN_SCOPE.map((m) => ({ role: m.role, content: m.content })));
  });
});

describe("buildDailyFortunePrompt", () => {
  it("parses and grounds today's ganzhi against the day master", () => {
    const prompt = buildDailyFortunePrompt(CHART_STRONG_WOOD, "丙午", "2026-07-15");
    expect(prompt).toContain("2026-07-15");
    expect(prompt).toContain("丙午");
    expect(prompt).toMatch(/generates|controls|same|generated-by|controlled-by/);
  });

  it("degrades gracefully on a malformed ganzhi string", () => {
    expect(() => buildDailyFortunePrompt(CHART_STRONG_WOOD, "??", "2026-07-15")).not.toThrow();
  });
});

describe("buildCompatibilityPrompt", () => {
  it("includes both charts and the engine-computed relation facts", () => {
    const prompt = buildCompatibilityPrompt(CHART_STRONG_WOOD, CHART_WEAK_WATER, RELATION_FACTS);
    expect(prompt).toContain(CHART_STRONG_WOOD.dayMaster.stem);
    expect(prompt).toContain(CHART_WEAK_WATER.dayMaster.stem);
    expect(prompt).toContain(RELATION_FACTS.dayMasterRelation.type);
  });
});
