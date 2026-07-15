import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { MockInterpreter, deriveDailyFortune, deriveCompatibility } from "./mock";
import { CardSchema, ReadingSchema, DailyFortuneSchema, CompatSchema } from "./types";
import { CARD_SPECS } from "./card-specs";
import { ELEMENT_LABEL, dominantElement } from "./five-elements";
import {
  CHART_STRONG_WOOD,
  CHART_WEAK_WATER,
  RELATION_FACTS,
  CHAT_MESSAGES_IN_SCOPE,
  CHAT_MESSAGES_OUT_OF_SCOPE,
  sampleReading,
} from "./test-fixtures";

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const item of iter) out.push(item);
  return out;
}

describe("MockInterpreter", () => {
  const interpreter = new MockInterpreter();

  it("reports its model name as 'mock'", () => {
    expect(interpreter.model).toBe("mock");
  });

  describe("natalReading", () => {
    it("returns a schema-valid Reading with one card per CARD_SPECS entry", async () => {
      const reading = await interpreter.natalReading(CHART_STRONG_WOOD);
      expect(ReadingSchema.safeParse(reading).success).toBe(true);
      expect(reading.model).toBe("mock");
      expect(reading.cards).toHaveLength(CARD_SPECS.length);
      expect(reading.cards.map((c) => c.id).sort()).toEqual(CARD_SPECS.map((s) => s.id).sort());
    });

    it("every card is individually schema-valid", async () => {
      const reading = await interpreter.natalReading(CHART_WEAK_WATER);
      for (const card of reading.cards) {
        expect(CardSchema.safeParse(card).success).toBe(true);
      }
    });

    it("respects the cardIds option to generate a subset", async () => {
      const reading = await interpreter.natalReading(CHART_STRONG_WOOD, {
        cardIds: ["elemental-nature", "lean-into"],
      });
      expect(reading.cards.map((c) => c.id)).toEqual(["elemental-nature", "lean-into"]);
    });

    it("is deterministic: same chart in, byte-identical reading out", async () => {
      const a = await interpreter.natalReading(CHART_STRONG_WOOD);
      const b = await interpreter.natalReading(CHART_STRONG_WOOD);
      expect(a).toEqual(b);
    });

    it("produces genuinely different content for genuinely different charts", async () => {
      const a = await interpreter.natalReading(CHART_STRONG_WOOD);
      const b = await interpreter.natalReading(CHART_WEAK_WATER);
      const aCard = a.cards.find((c) => c.id === "elemental-nature")!;
      const bCard = b.cards.find((c) => c.id === "elemental-nature")!;
      expect(aCard.headline).not.toBe(bCard.headline);
      expect(aCard.body).not.toBe(bCard.body);
    });

    it("never contradicts the computed chart: every card grounds real chart facts", async () => {
      const reading = await interpreter.natalReading(CHART_STRONG_WOOD);
      const glance = reading.cards.find((c) => c.id === "chart-at-a-glance")!;
      expect(glance.body).toContain(CHART_STRONG_WOOD.zodiac);
      const balance = reading.cards.find((c) => c.id === "element-balance")!;
      const dom = dominantElement(CHART_STRONG_WOOD.elements);
      expect(balance.mechanics).toContain(`${ELEMENT_LABEL[dom]} ${CHART_STRONG_WOOD.elements[dom]}`); // dominant element count from fixture
    });

    it("closes on an agency / what-to-do note (anti-fatalism, PRD acceptance criterion)", async () => {
      const reading = await interpreter.natalReading(CHART_STRONG_WOOD);
      const closer = reading.cards[reading.cards.length - 1];
      expect(closer.id).toBe("lean-into");
      expect(closer.body.length).toBeGreaterThan(0);
    });

    it("names a real blind spot, not just flattery (anti-sycophancy)", async () => {
      const reading = await interpreter.natalReading(CHART_STRONG_WOOD);
      const blindSpots = reading.cards.find((c) => c.id === "blind-spots")!;
      // Should reference the actual downside language from the fixture's element/strength combo.
      expect(blindSpots.body.toLowerCase()).toMatch(/steamroll|dig in|risk|cost|watch/);
    });
  });

  describe("streamNatalReading", () => {
    it("yields the same cards, in the same order, as natalReading", async () => {
      const whole = await interpreter.natalReading(CHART_STRONG_WOOD);
      const streamed = await collect(interpreter.streamNatalReading(CHART_STRONG_WOOD));
      expect(streamed).toEqual(whole.cards);
    });
  });

  describe("chat", () => {
    it("streams string chunks that join into a chart-grounded reply", async () => {
      const reading = sampleReading(CHART_STRONG_WOOD);
      const chunks = await collect(interpreter.chat(CHART_STRONG_WOOD, reading, CHAT_MESSAGES_IN_SCOPE));
      expect(chunks.length).toBeGreaterThan(1); // actually streamed, not one giant chunk
      const full = chunks.join("");
      expect(full.toLowerCase()).toContain("wood");
    });

    it("redirects out-of-scope (legal/medical/financial) questions with a disclaimer", async () => {
      const reading = sampleReading(CHART_STRONG_WOOD);
      const chunks = await collect(interpreter.chat(CHART_STRONG_WOOD, reading, CHAT_MESSAGES_OUT_OF_SCOPE));
      const full = chunks.join("").toLowerCase();
      expect(full).toMatch(/legal|medical|financial|qualified/);
    });

    it("is deterministic for the same chart/reading/messages", async () => {
      const reading = sampleReading(CHART_STRONG_WOOD);
      const a = (await collect(interpreter.chat(CHART_STRONG_WOOD, reading, CHAT_MESSAGES_IN_SCOPE))).join("");
      const b = (await collect(interpreter.chat(CHART_STRONG_WOOD, reading, CHAT_MESSAGES_IN_SCOPE))).join("");
      expect(a).toBe(b);
    });
  });

  describe("dailyFortune", () => {
    it("returns a schema-valid DailyFortune", async () => {
      const fortune = await interpreter.dailyFortune(CHART_STRONG_WOOD, "丙午", "2026-07-15");
      expect(DailyFortuneSchema.safeParse(fortune).success).toBe(true);
    });

    it("gives two different charts different daily readings for the same date", async () => {
      const a = await interpreter.dailyFortune(CHART_STRONG_WOOD, "丙午", "2026-07-15");
      const b = await interpreter.dailyFortune(CHART_WEAK_WATER, "丙午", "2026-07-15");
      expect(a).not.toEqual(b);
    });

    it("is deterministic for the same chart/day/date", async () => {
      const a = await interpreter.dailyFortune(CHART_STRONG_WOOD, "丙午", "2026-07-15");
      const b = await interpreter.dailyFortune(CHART_STRONG_WOOD, "丙午", "2026-07-15");
      expect(a).toEqual(b);
    });

    it("gives the same chart different readings on different days (the habit loop)", async () => {
      const a = await interpreter.dailyFortune(CHART_STRONG_WOOD, "丙午", "2026-07-15");
      const b = await interpreter.dailyFortune(CHART_STRONG_WOOD, "壬子", "2026-07-16");
      expect(a).not.toEqual(b);
    });
  });

  describe("compatibility", () => {
    it("returns a schema-valid Compat with a 0-100 score", async () => {
      const compat = await interpreter.compatibility(CHART_STRONG_WOOD, CHART_WEAK_WATER, RELATION_FACTS);
      expect(CompatSchema.safeParse(compat).success).toBe(true);
      expect(compat.score).toBeGreaterThanOrEqual(0);
      expect(compat.score).toBeLessThanOrEqual(100);
    });

    it("is deterministic for the same pair of charts + relation facts", async () => {
      const a = await interpreter.compatibility(CHART_STRONG_WOOD, CHART_WEAK_WATER, RELATION_FACTS);
      const b = await interpreter.compatibility(CHART_STRONG_WOOD, CHART_WEAK_WATER, RELATION_FACTS);
      expect(a).toEqual(b);
    });
  });
});

describe("MockInterpreter never touches wall-clock or RNG (determinism contract)", () => {
  let originalNow: typeof Date.now;
  let originalRandom: typeof Math.random;

  beforeEach(() => {
    originalNow = Date.now;
    originalRandom = Math.random;
    Date.now = () => {
      throw new Error("MockInterpreter must not call Date.now()");
    };
    Math.random = () => {
      throw new Error("MockInterpreter must not call Math.random()");
    };
  });

  afterEach(() => {
    Date.now = originalNow;
    Math.random = originalRandom;
  });

  it("generates a full natal reading without calling Date.now or Math.random", async () => {
    const interpreter = new MockInterpreter();
    await expect(interpreter.natalReading(CHART_STRONG_WOOD)).resolves.toBeTruthy();
  });

  it("generates a daily fortune and a compatibility reading without calling Date.now or Math.random", async () => {
    const interpreter = new MockInterpreter();
    await expect(interpreter.dailyFortune(CHART_STRONG_WOOD, "丙午", "2026-07-15")).resolves.toBeTruthy();
    await expect(
      interpreter.compatibility(CHART_STRONG_WOOD, CHART_WEAK_WATER, RELATION_FACTS)
    ).resolves.toBeTruthy();
  });
});

describe("deriveDailyFortune / deriveCompatibility (pure helper functions)", () => {
  it("deriveDailyFortune matches MockInterpreter#dailyFortune", async () => {
    const interpreter = new MockInterpreter();
    const viaClass = await interpreter.dailyFortune(CHART_STRONG_WOOD, "丙午", "2026-07-15");
    const direct = deriveDailyFortune(CHART_STRONG_WOOD, "丙午", "2026-07-15");
    expect(viaClass).toEqual(direct);
  });

  it("deriveCompatibility matches MockInterpreter#compatibility", async () => {
    const interpreter = new MockInterpreter();
    const viaClass = await interpreter.compatibility(CHART_STRONG_WOOD, CHART_WEAK_WATER, RELATION_FACTS);
    const direct = deriveCompatibility(CHART_STRONG_WOOD, CHART_WEAK_WATER, RELATION_FACTS);
    expect(viaClass).toEqual(direct);
  });
});
