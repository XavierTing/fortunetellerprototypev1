import { z } from "zod";
import type { BranchRelation, Chart, Element } from "@/lib/bazi";
import type { CardId } from "./card-specs";

export type { Chart, Element } from "@/lib/bazi";
export type { CardId } from "./card-specs";

// ---------------------------------------------------------------------------
// Zod schemas — the structured-output contract every interpreter (mock or
// DeepSeek) must satisfy. The DeepSeek interpreter validates live model
// output against these; the mock interpreter's output is validated by the
// same schemas in tests, so both back ends are held to one bar.
// ---------------------------------------------------------------------------

export const CardSchema = z.object({
  id: z.string().min(1),
  headline: z.string().min(1),
  body: z.string().min(1),
  /** Optional "mechanics ⓘ" expander: the underlying 干支/element logic, pinyin + gloss. */
  mechanics: z.string().min(1).optional(),
});
export type Card = z.infer<typeof CardSchema>;

/**
 * Card content without `id` — what a generator (mock derivation or an LLM
 * structured-output call) actually produces. The caller attaches `id` from
 * the CardSpec afterward and validates the combined object against
 * CardSchema. Keeping `id` out of the generation contract means neither the
 * model nor the mock can desync a card's content from its slot.
 */
export const CardContentSchema = CardSchema.omit({ id: true });
export type CardContent = z.infer<typeof CardContentSchema>;

export const ReadingSchema = z.object({
  cards: z.array(CardSchema).min(1),
  /** 'deepseek-chat' (live) or 'mock' (no API key). */
  model: z.string().min(1),
});
export type Reading = z.infer<typeof ReadingSchema>;

export const DailyFortuneSchema = z.object({
  headline: z.string().min(1),
  body: z.string().min(1),
  energy: z.string().min(1),
  leanInto: z.string().min(1),
  goEasyOn: z.string().min(1),
});
export type DailyFortune = z.infer<typeof DailyFortuneSchema>;

export const CompatSchema = z.object({
  overall: z.string().min(1),
  dynamic: z.string().min(1),
  friction: z.string().min(1),
  advice: z.string().min(1),
  /** 0-100 compatibility score. */
  score: z.number().min(0).max(100),
  /** Short, shareable one-line verdict for the compatibility card. */
  verdict: z.string().min(1),
});
export type Compat = z.infer<typeof CompatSchema>;

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export const ChatRoleSchema = z.enum(["user", "assistant"]);
export type ChatRole = z.infer<typeof ChatRoleSchema>;

export const ChatMessageSchema = z.object({
  role: ChatRoleSchema,
  content: z.string().min(1),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// ---------------------------------------------------------------------------
// Compatibility relationship facts — engine-computed ground truth passed
// alongside the two charts (PRD §5.5: "relationship facts are
// engine-computed and correct" — the model only interprets them).
// ---------------------------------------------------------------------------

export type DayMasterRelationType =
  | "same"
  | "generates"
  | "generated-by"
  | "controls"
  | "controlled-by";

export interface DayMasterRelation {
  type: DayMasterRelationType;
  aElement: Element;
  bElement: Element;
  note: string;
}

/** Reuses the engine's real BranchRelation shape (type union: sanhe/liuhe/chong/xing) rather than a divergent local copy. */
export type CompatBranchRelation = BranchRelation;

export interface RelationFacts {
  dayMasterRelation: DayMasterRelation;
  branchRelations: CompatBranchRelation[];
  complementaryElements: Element[];
  clashingElements: Element[];
}

// ---------------------------------------------------------------------------
// Call options
// ---------------------------------------------------------------------------

export interface NatalReadingOptions {
  /** Restrict generation to a subset of cards (defaults to all CARD_SPECS). */
  cardIds?: CardId[];
}

/**
 * Today's day-branch vs. the user's own natal branches, when a classical
 * relation (相冲 clash / 六合 harmony / 三合 / 相刑) fires against the
 * chart's own branches — engine-computed by `src/app/today/lib.ts`'s
 * `dayPillarInteraction`, passed through so the daily narrative can
 * mention a clash/harmony day it otherwise has no way to see.
 */
export interface DailyInteractionFact {
  type: string;
  note: string;
}

// ---------------------------------------------------------------------------
// The Interpreter contract — implemented by MockInterpreter and
// DeepSeekInterpreter. All chart facts (element counts, pillars, dates,
// relationships) are supplied as ground truth by the caller; an interpreter
// only interprets, never invents them.
// ---------------------------------------------------------------------------

export interface Interpreter {
  /** 'deepseek-chat' or 'mock' — surfaced on Reading.model and usable for logging elsewhere. */
  readonly model: string;

  /** Full natal reading (~8-10 cards), generated and returned as a whole. */
  natalReading(chart: Chart, opts?: NatalReadingOptions): Promise<Reading>;

  /** Same content as natalReading, yielded one card at a time as each finishes generating. */
  streamNatalReading(chart: Chart, opts?: NatalReadingOptions): AsyncIterable<Card>;

  /** 师傅 chat: streamed response tokens, grounded in the chart + the already-generated reading. */
  chat(chart: Chart, reading: Reading, messages: ChatMessage[]): AsyncIterable<string>;

  /**
   * One-day reading tied to today's real day pillar (dayGanZhi) and the
   * user's chart. `interaction` is optional (engine-computed today-vs-natal
   * clash/harmony fact, when one fires) so the narrative can name a clash
   * day plainly instead of describing today in a vacuum.
   */
  dailyFortune(
    chart: Chart,
    dayGanZhi: string,
    date: string,
    interaction?: DailyInteractionFact | null
  ): Promise<DailyFortune>;

  /** Two-chart relationship reading + shareable verdict. */
  compatibility(chartA: Chart, chartB: Chart, relationFacts: RelationFacts): Promise<Compat>;
}
