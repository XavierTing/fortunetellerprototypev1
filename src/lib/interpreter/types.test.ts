import { describe, expect, it } from "vitest";
import {
  CardSchema,
  CardContentSchema,
  ReadingSchema,
  DailyFortuneSchema,
  CompatSchema,
  ChatMessageSchema,
} from "./types";

describe("CardSchema", () => {
  it("accepts a valid card without mechanics", () => {
    const result = CardSchema.safeParse({ id: "strengths", headline: "Headline.", body: "Body." });
    expect(result.success).toBe(true);
  });

  it("accepts a valid card with mechanics", () => {
    const result = CardSchema.safeParse({
      id: "strengths",
      headline: "Headline.",
      body: "Body.",
      mechanics: "Bǐ Jiān 比肩 — your 'peers' energy.",
    });
    expect(result.success).toBe(true);
  });

  it.each([
    { id: "x", headline: "", body: "Body." }, // empty headline
    { id: "x", headline: "Headline.", body: "" }, // empty body
    { id: "", headline: "Headline.", body: "Body." }, // empty id
    { headline: "Headline.", body: "Body." }, // missing id
  ])("rejects an invalid card %#", (candidate) => {
    expect(CardSchema.safeParse(candidate).success).toBe(false);
  });

  it("rejects an empty mechanics string (should be omitted, not blank)", () => {
    const result = CardSchema.safeParse({ id: "x", headline: "H", body: "B", mechanics: "" });
    expect(result.success).toBe(false);
  });
});

describe("CardContentSchema", () => {
  it("has no id field", () => {
    const result = CardContentSchema.safeParse({ headline: "H", body: "B" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).id).toBeUndefined();
    }
  });

  it("strips an id field if one is passed (not part of the schema's shape)", () => {
    const result = CardContentSchema.safeParse({ id: "should-be-ignored", headline: "H", body: "B" });
    expect(result.success).toBe(true);
  });
});

describe("ReadingSchema", () => {
  it("accepts a reading with at least one card and a model name", () => {
    const result = ReadingSchema.safeParse({
      model: "mock",
      cards: [{ id: "a", headline: "H", body: "B" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty cards array", () => {
    const result = ReadingSchema.safeParse({ model: "mock", cards: [] });
    expect(result.success).toBe(false);
  });

  it("rejects a missing model", () => {
    const result = ReadingSchema.safeParse({ cards: [{ id: "a", headline: "H", body: "B" }] });
    expect(result.success).toBe(false);
  });
});

describe("DailyFortuneSchema", () => {
  it("accepts a fully-populated daily fortune", () => {
    const result = DailyFortuneSchema.safeParse({
      headline: "H",
      body: "B",
      energy: "E",
      leanInto: "L",
      goEasyOn: "G",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a daily fortune missing a required field", () => {
    const result = DailyFortuneSchema.safeParse({ headline: "H", body: "B", energy: "E", leanInto: "L" });
    expect(result.success).toBe(false);
  });
});

describe("CompatSchema", () => {
  const base = {
    overall: "O",
    dynamic: "D",
    friction: "F",
    advice: "A",
    verdict: "V",
  };

  it("accepts a score within 0-100", () => {
    expect(CompatSchema.safeParse({ ...base, score: 0 }).success).toBe(true);
    expect(CompatSchema.safeParse({ ...base, score: 100 }).success).toBe(true);
    expect(CompatSchema.safeParse({ ...base, score: 62 }).success).toBe(true);
  });

  it("rejects a score outside 0-100", () => {
    expect(CompatSchema.safeParse({ ...base, score: -1 }).success).toBe(false);
    expect(CompatSchema.safeParse({ ...base, score: 101 }).success).toBe(false);
  });
});

describe("ChatMessageSchema", () => {
  it("only accepts 'user' or 'assistant' roles", () => {
    expect(ChatMessageSchema.safeParse({ role: "user", content: "hi" }).success).toBe(true);
    expect(ChatMessageSchema.safeParse({ role: "assistant", content: "hi" }).success).toBe(true);
    expect(ChatMessageSchema.safeParse({ role: "system", content: "hi" }).success).toBe(false);
  });

  it("rejects empty content", () => {
    expect(ChatMessageSchema.safeParse({ role: "user", content: "" }).success).toBe(false);
  });
});
