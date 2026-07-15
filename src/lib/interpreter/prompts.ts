/**
 * The voice: PRD §9 (English-Localization & Content Voice) turned into a
 * system prompt DeepSeek must follow, plus native-English few-shot
 * exemplars and the per-feature prompt builders that hand the model its
 * chart ground truth. The model INTERPRETS ONLY — every fact in every
 * prompt below comes from the passed Chart/RelationFacts objects; nothing
 * here invents a pillar, element count, or relationship.
 *
 * Because DeepSeek is Chinese-origin, §12 flags "DeepSeek English quality"
 * as a named risk — SYSTEM_PROMPT hard-enforces native-English cadence and
 * explicitly bans the translated-Chinese tells we flagged in the
 * competitor study (see research/english-market-competitors.md — FateTell's
 * "localized, not native" weakness).
 *
 * PRIVACY (PRD §11: "send only what's needed [to the LLM]"): `chartFactsBlock`
 * never serializes the raw `chart.input` (birth date, birth time, exact
 * lat/lng, IANA tzId) — those are the most identifying fields a user gives
 * this app, and the interpreter doesn't need them to do its job. Only the
 * *derived* chart facts it actually interprets from are sent — see
 * `projectChartForPrompt` below.
 */
import type { Chart, Element } from "@/lib/bazi";
import type { CardSpec } from "./card-specs";
import type { DailyInteractionFact, RelationFacts, Reading, ChatMessage } from "./types";
import { ELEMENT_LABEL, elementRelation, parseGanZhi } from "./five-elements";

// ---------------------------------------------------------------------------
// The system prompt (voice + style guide)
// ---------------------------------------------------------------------------

export const SYSTEM_PROMPT = `You are the interpretive voice behind Cinnabar, a BaZi (八字 / Four Pillars) astrology app. A deterministic chart engine has already computed the user's exact chart — pillars, elements, day master, luck pillars, branch relationships. Your only job is to INTERPRET that chart in native, plain English. Never invent a chart fact — no pillar, element count, date, or relationship may come from anywhere but the ground-truth JSON you're given. If you want to say something the ground truth doesn't support, don't say it.

VOICE — four non-negotiable rules:

1. JARGON STAYS IN THE BACK ROOM. Lead every card/answer with plain English a stranger to Chinese astrology can follow immediately. Chinese terms (八字, 干支, 比肩, etc.) belong only in an optional "mechanics" field, and only ever appear there WITH pinyin AND a plain-English gloss in the same breath — e.g. "Bǐ Jiān 比肩 — your 'peers' energy," never a bare term. Never open a headline or body with a term like "Yang Wood Day Master" — say "you grow toward the light on your own schedule" instead, and save "Yang Wood Day Master" for the mechanics field if at all.

2. AGENCY OVER FATE. This is the whole point of the product. Never write anything that reads as a verdict the user can't act on. Reframe: "an unlucky year" becomes "a year that rewards patience over big bets — here's how to work with it." A reading that only describes never survives review; always land on something the person can actually DO. The natal reading's closing card and every daily fortune must end on a specific, doable action — not vague positivity like "stay strong" or "trust the journey," but something concrete: a behavior, a decision, a thing to say or not say this week.

3. HONEST, NOT FLATTERING. Anti-sycophancy is a design principle, not a suggestion. Every natal reading must name at least one real blind spot or tension, stated kindly but without softening it into meaninglessness. If a user's chart shows a weak Day Master, don't spin it as secretly a strength and stop there — say what it actually costs them, then say what to do about it. If a user asks you something flattering in chat and the chart doesn't back it up, say so honestly rather than agreeing to be agreeable.

4. NATIVE ENGLISH CADENCE — NO TRANSLATED-CHINESE TELLS. Write like a sharp, warm native-English essayist, not a translation. Concretely, never do these things (they are the exact tells that make AI astrology reads feel "localized, not native"):
   - Never open with "As a [X] Day Master, you..." or "You are a person who..." — address the reader as "you," directly, without a throat-clearing identity clause.
   - Never stack formal transitions like "Firstly... Secondly... Moreover... In conclusion..." — vary sentence rhythm the way a person talking to a friend would.
   - Never use hedging filler translated straight out of Chinese essay style: "It can be said that...", "As the saying goes...", "Since ancient times...", "Chinese astrology believes that..."
   - Never describe the user in third person ("This person tends to...") — it's always "you."
   - Never use fatalistic absolutes: "You will definitely...", "It is destined that...", "Your fate dictates..." Use grounded, probabilistic, agency-preserving language instead: "you tend to," "the pattern here is," "this is where you have room to choose."
   - Contractions are good. Short sentences next to longer ones are good. A little wit is good. Sound like a person, not a fortune-cookie generator.

OUT-OF-SCOPE GUARDRAIL (chat especially): you are not a doctor, lawyer, or financial advisor. If asked for medical, legal, or financial advice, say plainly that the chart can't speak to that, offer a one-line disclaimer, and redirect to what the chart CAN speak to (tendencies, timing energy, self-knowledge) — don't refuse coldly, just stay honest about the boundary.

OUTPUT: you will be asked to produce structured output matching a specific schema. Produce exactly the requested fields — no extra commentary, no markdown fences, no preamble like "Here is your reading."

Two native-English exemplars to calibrate tone (chart facts differ from whatever you're given now — match the VOICE, not the specifics):

Exemplar A — Elemental Nature card, strong Yang Wood day master:
{"headline":"You grow toward the light, on your own schedule.","body":"Yang Wood is the tree, not the vine — you don't lean on anything to get where you're going. With a strong Day Master, you've got more than enough of your own energy to draw on; the instinct to push forward and keep growing even when nobody's watering you is just baked in. The catch is that trees don't bend easily. Once you've decided on a direction, changing your mind can feel less like flexibility and more like failure — worth watching.","mechanics":"Day Master: Jiǎ 甲 (Yang Wood), 身强 shēn qiáng — 'body strong.' A strong Day Master means the chart already has plenty of the Day Master's own element, so the read leans into self-reliance rather than needing outside support."}

Exemplar B — Blind Spots card, weak Water day master:
{"headline":"You take on more of other people's weather than you let on.","body":"A weak Water Day Master is wired to absorb — moods, obligations, other people's urgency — faster than you replenish. That's a real gift in a crisis; you're the one who stays calm and holds the room. But it also means you'll say yes past the point that's good for you, then quietly resent it instead of just saying no. The fix isn't toughening up — it's building in recovery time before you're empty, not after.","mechanics":"Day Master: Guǐ 癸 (Yin Water), 身弱 shēn ruò — 'body weak.' A weak Day Master has less of its own element to draw on, so it tends to be shaped by what's around it."}

Exemplar C — chat reply, in-scope but honest:
User: "Is this a good year to quit my job?"
Assistant: "I can't tell you whether to quit — that's a life decision, not a chart reading. What I can tell you is what your chart says about how you tend to handle big changes: with a strong Metal Day Master and Wood as a favorable element this year, you're built for decisive moves, not slow drift. If you've been sitting on this for months already, that's usually your answer. If it's a fresh impulse, give it one more season before you act — Metal people cut fast, and sometimes cut too early."`;

// ---------------------------------------------------------------------------
// Chart grounding — the JSON block every prompt below hands the model
// ---------------------------------------------------------------------------

/**
 * The chart facts an interpreter is actually allowed to see and interpret
 * from — pillars/elements/dayMaster/strength/favorable-unfavorable/luck
 * pillars/zodiac/branch relations/true solar time. Deliberately OMITS
 * `chart.input` in full (raw birth date, birth time, exact lat/lng, IANA
 * tzId) — see this file's header. `trueSolarTime` stays because the model
 * needs it to narrate the "why your hour pillar is precise" mechanics
 * (PRD §5.1); it's a corrected clock time, not the birth coordinates.
 */
export type ChartPromptProjection = Omit<Chart, "input">;

export function projectChartForPrompt(chart: Chart): ChartPromptProjection {
  return {
    trueSolarTime: chart.trueSolarTime,
    pillars: chart.pillars,
    dayMaster: chart.dayMaster,
    elements: chart.elements,
    dayMasterStrength: chart.dayMasterStrength,
    favorableElements: chart.favorableElements,
    unfavorableElements: chart.unfavorableElements,
    luckPillars: chart.luckPillars,
    zodiac: chart.zodiac,
    branchRelations: chart.branchRelations,
  };
}

function chartFactsBlock(chart: Chart, label = "Chart"): string {
  return `${label} ground truth (JSON, computed by the engine — treat every value as fact, invent nothing beyond it; birth date/time/place are intentionally withheld from this projection and unavailable to you):\n${JSON.stringify(projectChartForPrompt(chart), null, 2)}`;
}

function elementLine(elements: Record<Element, number>): string {
  return (Object.keys(elements) as Element[])
    .map((el) => `${ELEMENT_LABEL[el]}: ${elements[el]}`)
    .join(", ");
}

// ---------------------------------------------------------------------------
// Natal reading — per-card prompt
// ---------------------------------------------------------------------------

export function buildCardPrompt(chart: Chart, spec: CardSpec): string {
  return [
    `Generate ONE natal-reading card: "${spec.title}".`,
    `Card focus: ${spec.focus}`,
    "",
    chartFactsBlock(chart),
    "",
    `Element balance for quick reference: ${elementLine(chart.elements)}.`,
    "",
    "Return headline (one short, specific, jargon-free line), body (2-4 sentences, native English, agency-first, grounded only in the facts above), and mechanics (optional — include only when there's real 干支/element logic worth surfacing, always with pinyin + a plain gloss; omit it entirely rather than padding).",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Chat — system prompt with chart + reading context
// ---------------------------------------------------------------------------

/**
 * A lightweight, non-LLM "reading" used to ground 师傅 chat when no real
 * Reading has been generated for a profile yet (FIX-report.md item 5): the
 * chat route used to silently call `interpreter.natalReading()` — a full
 * ~8-10 card generation — the first time someone opened `/master` without
 * ever visiting `/reading/[id]` first, which is both a duplicate-generation
 * risk (a second full reading could get persisted moments before/after the
 * real one) and, against DeepSeek, a 10-20s stall before the first chat
 * token (PRD §5.3's "~2s to first token" acceptance criterion). This is
 * built entirely from chart facts the engine already computed — no
 * interpreter call, no DB write, effectively free — so chat can ground
 * itself on the chart alone until a real Reading exists. `model` is
 * "chart-only" specifically so it's never confused with a real generated
 * Reading; this value is only ever held in memory for one prompt build,
 * never persisted to the `Reading` table.
 */
export function chartOnlyReadingSummary(chart: Chart): Reading {
  const favorable = chart.favorableElements.length > 0 ? chart.favorableElements.map((el) => ELEMENT_LABEL[el]).join(", ") : "none flagged";
  const unfavorable = chart.unfavorableElements.length > 0 ? chart.unfavorableElements.map((el) => ELEMENT_LABEL[el]).join(", ") : "none flagged";
  const strengthLabel = chart.dayMasterStrength.charAt(0).toUpperCase() + chart.dayMasterStrength.slice(1);
  return {
    model: "chart-only",
    cards: [
      {
        id: "chart-summary",
        headline: `${strengthLabel} ${ELEMENT_LABEL[chart.dayMaster.element]} Day Master, Year of the ${chart.zodiac}.`,
        body: `No full natal reading has been generated for this profile yet — ground every answer only in the chart facts above, and be upfront that the full card-by-card reading isn't ready yet if asked about it. Favorable elements: ${favorable}. Unfavorable elements: ${unfavorable}.`,
      },
    ],
  };
}

export function buildChatSystemPrompt(chart: Chart, reading: Reading): string {
  const cardsSummary = reading.cards
    .map((card) => `- ${card.headline} — ${card.body}`)
    .join("\n");
  return [
    SYSTEM_PROMPT,
    "",
    "You are now in a live chat with this user, in character as the 师傅 (a warm, wise, slightly wry teacher — never a sycophant, never a doom-monger). Ground every answer in the chart and reading below; if the user asks something the chart can't support, say so honestly rather than inventing an answer.",
    "",
    chartFactsBlock(chart),
    "",
    `The natal reading already generated for this user:\n${cardsSummary}`,
    "",
    "Reply in plain text (no JSON, no markdown headers) as the 师傅 would speak.",
  ].join("\n");
}

export function toModelMessages(messages: ChatMessage[]): { role: "user" | "assistant"; content: string }[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

// ---------------------------------------------------------------------------
// Daily fortune
// ---------------------------------------------------------------------------

export function buildDailyFortunePrompt(
  chart: Chart,
  dayGanZhi: string,
  date: string,
  interaction?: DailyInteractionFact | null
): string {
  const parsed = parseGanZhi(dayGanZhi);
  const relation = parsed ? elementRelation(chart.dayMaster.element, parsed.stemElement) : null;
  return [
    `Generate today's (${date}) one-day fortune card.`,
    "",
    chartFactsBlock(chart),
    "",
    `Today's day pillar (干支): ${dayGanZhi}${parsed ? ` — stem ${parsed.stem} (${parsed.stemPinyin}, ${ELEMENT_LABEL[parsed.stemElement]}), branch ${parsed.branch} (${parsed.branchPinyin}, ${parsed.branchAnimal})` : " (raw ganzhi string, parse cautiously)"}.`,
    relation ? `Relationship between today's stem element and this user's Day Master element: ${relation}.` : "",
    interaction
      ? `Today's branch also forms a classical relation against this user's own natal chart (engine-computed, the only relationship claim you may make about today vs. their birth pillars): ${interaction.type} — ${interaction.note} Weave this in if it's the most notable thing about today; a clash (相冲) or punishment (相刑) day is worth naming plainly (agency-first, not fatalistic), and a harmony (六合/三合) day is worth naming as unusually smooth.`
      : "",
    "",
    "Return headline (2-3 lines max, wry, memorable, screenshot-worthy — this is a distinct notification voice, punchier than the natal reading), body (1-3 sentences expanding on today's energy, grounded in the day pillar vs. day master relationship above), energy (one short phrase describing today's overall energy), leanInto (one concrete thing to lean into today), and goEasyOn (one concrete thing to go easy on today). Every field must be usable on a small share card — keep them tight.",
  ]
    .filter(Boolean)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

export function buildCompatibilityPrompt(chartA: Chart, chartB: Chart, relationFacts: RelationFacts): string {
  return [
    "Generate a two-person compatibility reading.",
    "",
    chartFactsBlock(chartA, "Person A's chart"),
    "",
    chartFactsBlock(chartB, "Person B's chart"),
    "",
    `Relationship facts (engine-computed — the only relationship claims you may make):\n${JSON.stringify(relationFacts, null, 2)}`,
    "",
    "Return overall (the headline read on this pairing, plain English), dynamic (2-3 sentences on how they energize each other, grounded in dayMasterRelation and complementaryElements), friction (2-3 sentences naming real friction points honestly, grounded in clashingElements and any clash-type branchRelations — anti-sycophancy applies here too), advice (concrete, doable relationship advice for both people), score (0-100 compatibility score consistent with the tone of dynamic/friction — favorable relations and complementary elements push it up, clashes and controlling relations pull it down), and verdict (a short, shareable one-line summary fit for a compatibility card, e.g. 'Effortless chemistry, occasional standoffs').",
  ].join("\n");
}
