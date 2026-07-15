/**
 * MockInterpreter — a fully-featured, chart-grounded interpreter that needs
 * no API key. It exists so the app is genuinely usable (and looks like a
 * real product, not a placeholder) before DEEPSEEK_API_KEY is set, and so
 * this module's tests never need a live network call.
 *
 * Determinism contract: every generator below derives its wording only from
 * (a) the chart / inputs passed in and (b) a seeded pseudo-random pick — no
 * Date.now(), no Math.random(). The same inputs always produce the same
 * output; different charts produce genuinely different, chart-grounded
 * prose (not templated filler — every card interpolates real pillars,
 * element counts, and relationships from the Chart object).
 */
import type { BranchRelation } from "@/lib/bazi";
import type {
  Chart,
  Element,
  Card,
  CardContent,
  Reading,
  ChatMessage,
  DailyFortune,
  Compat,
  RelationFacts,
  Interpreter,
  NatalReadingOptions,
} from "./types";
import { CardSchema, CardContentSchema, ReadingSchema, DailyFortuneSchema, CompatSchema } from "./types";
import { CARD_SPECS, type CardId, type CardSpec } from "./card-specs";
import {
  ELEMENT_LABEL,
  elementRelation,
  outputElement,
  wealthElement,
  resourceElement,
  parseGanZhi,
  seededPick,
  hashString,
  dominantElement,
  scarceElement,
} from "./five-elements";

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

function chartSeed(chart: Chart): number {
  const key = [
    chart.dayMaster.stem,
    chart.dayMaster.element,
    chart.dayMaster.yinYang,
    chart.dayMasterStrength,
    chart.zodiac,
    chart.pillars.year.stem,
    chart.pillars.year.branch,
    chart.pillars.month.stem,
    chart.pillars.month.branch,
    chart.pillars.day.stem,
    chart.pillars.day.branch,
    chart.pillars.hour ? `${chart.pillars.hour.stem}${chart.pillars.hour.branch}` : "unknown",
    chart.favorableElements.join(","),
    chart.unfavorableElements.join(","),
    chart.luckPillars.startAge,
    chart.luckPillars.forward,
    chart.input.date,
    chart.input.time ?? "unknown",
  ].join("|");
  return hashString(key);
}

function pick<T>(seed: number, salt: number, options: readonly T[]): T {
  return seededPick(seed, salt, options);
}

function elementList(elements: Element[]): string {
  if (elements.length === 0) return "none flagged";
  const labels = elements.map((e) => ELEMENT_LABEL[e]);
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

/** The engine's BranchRelation.type is an English slug (not the Chinese term), so clash-detection matches on the slug itself. */
function isClashRelationType(type: BranchRelation["type"]): boolean {
  return type === "chong" || type === "xing";
}

/** Display label for a branch relation's mechanics line — pinyin + Chinese term, matching this app's "gloss it in mechanics" convention. */
const BRANCH_RELATION_LABEL: Record<BranchRelation["type"], string> = {
  sanhe: "三合 sānhé",
  liuhe: "六合 liùhé",
  chong: "相冲 xiāngchōng",
  xing: "相刑 xiāngxíng",
};

// ---------------------------------------------------------------------------
// Element flavor lexicon
// ---------------------------------------------------------------------------

const ELEMENT_CORE: Record<Element, { essence: string; verb: string; gift: string; risk: string }> = {
  wood: {
    essence: "growth, direction, and reach",
    verb: "grow",
    gift: "you set a course and keep moving toward it even when the payoff is a long way off",
    risk: "once you've picked a direction, changing your mind can feel like failure instead of flexibility",
  },
  fire: {
    essence: "warmth, expression, and momentum",
    verb: "burn",
    gift: "you bring a room to life and make things feel urgent and worth doing right now",
    risk: "you can burn hot and fast on something, then have nothing left when it actually matters",
  },
  earth: {
    essence: "steadiness, patience, and follow-through",
    verb: "hold",
    gift: "you're the one people build on — plans survive contact with reality because you carry them",
    risk: "you can hold on to a plan, a job, or a person well past the point it's still doing you any good",
  },
  metal: {
    essence: "clarity, precision, and decisiveness",
    verb: "cut",
    gift: "you see the clean line through a messy situation faster than almost anyone in the room",
    risk: "you cut people off, including yourself, before you've heard the whole story",
  },
  water: {
    essence: "adaptability, depth, and instinct",
    verb: "flow",
    gift: "you read a room, a person, or a market before anyone's said a word about it",
    risk: "you absorb more than you let out, and you can run on empty for a long time before anyone notices",
  },
};

const STRENGTH_FLAVOR: Record<
  Chart["dayMasterStrength"],
  { selfDesc: string; costDesc: string; label: string }
> = {
  strong: {
    label: "strong",
    selfDesc: "self-reliant almost by default — you don't need much outside encouragement to keep going",
    costDesc:
      "you can steamroll a room without meaning to, or dig in on a call long after the facts on the ground have changed",
  },
  weak: {
    label: "weak",
    selfDesc: "tuned to your surroundings — you pick up on what a room needs before you've decided what you need",
    costDesc:
      "you can run on empty for a long time before you notice, saying yes past the point that's actually good for you",
  },
  balanced: {
    label: "balanced",
    selfDesc: "even-keeled by nature — you don't swing hard toward either self-reliance or dependence",
    costDesc:
      "you can default to the middle path even in a moment that actually calls for a bold, lopsided move",
  },
};

function stemPinyinLabel(pinyin: string, stem: string, element: Element, yinYang: string): string {
  const cap = pinyin.charAt(0).toUpperCase() + pinyin.slice(1);
  return `${cap} ${stem} (${yinYang === "yang" ? "Yang" : "Yin"} ${ELEMENT_LABEL[element]})`;
}

// ---------------------------------------------------------------------------
// Card generators — one function per CardId, each pure given (chart, seed)
// ---------------------------------------------------------------------------

function cardChartAtAGlance(chart: Chart, seed: number): CardContent {
  const dom = dominantElement(chart.elements);
  const domCount = chart.elements[dom];
  const headline = pick(seed, 1, [
    `Born in the Year of the ${chart.zodiac}, and it shows.`,
    `A ${chart.zodiac} year, a ${ELEMENT_LABEL[chart.dayMaster.element]} core, and a chart that knows what it wants.`,
    `Here's the shape of you, before we even get to the fine print.`,
  ]);
  const body = pick(seed, 2, [
    `You're a ${chart.zodiac} year, ${STRENGTH_FLAVOR[chart.dayMasterStrength].label} ${ELEMENT_LABEL[chart.dayMaster.element]} at the core, with ${ELEMENT_LABEL[dom]} showing up more than anything else in the chart (${domCount} of the eight chart slots). That combination is rarer than it sounds, and it's why generic horoscopes have never quite fit — this reading is built only from your actual pillars.`,
    `Year of the ${chart.zodiac}, and the headline fact about this chart is a ${STRENGTH_FLAVOR[chart.dayMasterStrength].label} ${ELEMENT_LABEL[chart.dayMaster.element]} Day Master leaning on ${ELEMENT_LABEL[dom]}, the element that shows up most across your eight pillars. Everything below unpacks what that actually means for how you work, love, and handle pressure.`,
  ]);
  const mechanics = `Day Master: ${stemPinyinLabel(chart.dayMaster.stemPinyin, chart.dayMaster.stem, chart.dayMaster.element, chart.dayMaster.yinYang)}. Zodiac: ${chart.zodiac} (year branch animal). Element tally: ${(Object.keys(chart.elements) as Element[]).map((e) => `${ELEMENT_LABEL[e]} ${chart.elements[e]}`).join(", ")}.`;
  return CardContentSchema.parse({ headline, body, mechanics });
}

function cardElementalNature(chart: Chart, seed: number): CardContent {
  const el = chart.dayMaster.element;
  const core = ELEMENT_CORE[el];
  const strength = STRENGTH_FLAVOR[chart.dayMasterStrength];
  const headline = pick(seed, 10, [
    `You ${core.verb} toward what you want, on your own schedule.`,
    `${ELEMENT_LABEL[el]} runs the show here — steady, unmistakable, and hard to fake.`,
    `This is a chart built around ${core.essence}.`,
  ]);
  const body = `Your Day Master is ${ELEMENT_LABEL[el]}, and it's ${strength.label} in this chart — meaning you're ${strength.selfDesc}. At its best that's ${core.gift}. The trade-off, worth knowing rather than hiding from, is that ${core.risk}.`;
  const mechanics = `Day Master: ${stemPinyinLabel(chart.dayMaster.stemPinyin, chart.dayMaster.stem, chart.dayMaster.element, chart.dayMaster.yinYang)}. Strength: ${chart.dayMasterStrength} (${chart.dayMasterStrength === "strong" ? "身强 shēn qiáng, 'body strong'" : chart.dayMasterStrength === "weak" ? "身弱 shēn ruò, 'body weak'" : "身平 shēn píng, 'body level'"}) — describes how much of the Day Master's own element the chart has to draw on relative to what's asked of it.`;
  return CardContentSchema.parse({ headline, body, mechanics });
}

function cardElementBalance(chart: Chart, seed: number): CardContent {
  const dom = dominantElement(chart.elements);
  const scarce = scarceElement(chart.elements);
  const domCount = chart.elements[dom];
  const scarceCount = chart.elements[scarce];
  const spread = domCount - scarceCount;
  const headline = pick(seed, 20, [
    `${ELEMENT_LABEL[dom]} is loud in this chart. ${ELEMENT_LABEL[scarce]} barely whispers.`,
    spread <= 1
      ? `Your five elements sit close together — a genuinely balanced chart.`
      : `This chart leans hard toward ${ELEMENT_LABEL[dom]}, and it's worth knowing what that crowds out.`,
  ]);
  const body =
    spread <= 1
      ? `Your elements are fairly evenly spread (${(Object.keys(chart.elements) as Element[]).map((e) => `${ELEMENT_LABEL[e]} ${chart.elements[e]}`).join(", ")}), which tends to show up as range rather than a single dominant mode — you can shift registers depending on what a situation needs, though it can also mean nothing in you is quite loud enough to lead by default.`
      : `${ELEMENT_LABEL[dom]} shows up ${domCount} times across your eight pillars, while ${ELEMENT_LABEL[scarce]} shows up only ${scarceCount}. That gap is real: you'll default to ${ELEMENT_CORE[dom].essence} in almost any situation, and you'll have to work consciously to access whatever ${ELEMENT_LABEL[scarce]} usually brings — that's not a flaw in the chart, it's just where the growth edge is.`;
  const mechanics = `Element tally (five-element / 五行 count across all pillars): ${(Object.keys(chart.elements) as Element[]).map((e) => `${ELEMENT_LABEL[e]} ${chart.elements[e]}`).join(", ")}. Favorable elements (喜神): ${elementList(chart.favorableElements)}. Unfavorable elements (忌神): ${elementList(chart.unfavorableElements)}.`;
  return CardContentSchema.parse({ headline, body, mechanics });
}

function cardStrengths(chart: Chart, seed: number): CardContent {
  const el = chart.dayMaster.element;
  const core = ELEMENT_CORE[el];
  const fav = chart.favorableElements[0];
  const headline = pick(seed, 30, [
    `Your best moves are already built in — you just have to trust them.`,
    `What you're actually good at, minus the guesswork.`,
  ]);
  const bodyParts = [
    `The clearest strength here is ${core.gift.charAt(0).toLowerCase()}${core.gift.slice(1)} — that's the ${ELEMENT_LABEL[el]} in you, and it's not a fluke, it shows up ${chart.elements[el]} times across your chart.`,
    chart.dayMasterStrength === "strong"
      ? `Being a strong Day Master means you rarely need permission to start something — you carry your own momentum.`
      : chart.dayMasterStrength === "weak"
        ? `Being a weak Day Master sounds like a downside, but it's exactly why you're good at reading people and rooms before you act — you're built to take in signal, not just broadcast.`
        : `Being a balanced Day Master means you're not locked into one mode — you can lead or support depending on what's actually needed.`,
    fav
      ? `${ELEMENT_LABEL[fav]} is favorable for you, so people and situations with a strong ${ELEMENT_LABEL[fav]} flavor tend to bring out your best work — worth noticing who and what those are.`
      : `Your chart doesn't flag a single standout favorable element, which usually means your strengths are more about how you combine things than any one trait.`,
  ];
  const mechanics = `Favorable elements (喜神, the elements that support this Day Master): ${elementList(chart.favorableElements)}. These are the elements worth seeking out in work, environment, and relationships.`;
  return CardContentSchema.parse({ headline, body: bodyParts.join(" "), mechanics });
}

function cardBlindSpots(chart: Chart, seed: number): CardContent {
  const el = chart.dayMaster.element;
  const core = ELEMENT_CORE[el];
  const strength = STRENGTH_FLAVOR[chart.dayMasterStrength];
  const unfav = chart.unfavorableElements[0];
  const headline = pick(seed, 40, [
    `Here's the part flattering horoscopes leave out.`,
    `One honest note before we move on.`,
  ]);
  const body = [
    `The same ${ELEMENT_LABEL[el]} that gives you your best move also has a cost: ${core.risk}.`,
    `Layer in a ${strength.label} Day Master and the pattern sharpens — ${strength.costDesc}.`,
    unfav
      ? `${ELEMENT_LABEL[unfav]} runs against you here, so situations with a heavy ${ELEMENT_LABEL[unfav]} flavor will tend to drain you faster than they should — not a reason to avoid them entirely, just a reason to notice the toll.`
      : `Nothing in your chart is flagged as sharply unfavorable, which just means the friction above is the main one worth watching.`,
    `None of this is a life sentence — it's just the specific thing worth catching yourself doing, on purpose, this month.`,
  ].join(" ");
  const mechanics = `Unfavorable elements (忌神, the elements this Day Master works against): ${elementList(chart.unfavorableElements)}.`;
  return CardContentSchema.parse({ headline, body, mechanics });
}

function cardWorkAndMoney(chart: Chart, seed: number): CardContent {
  const wealth = wealthElement(chart.dayMaster.element);
  const favHasWealth = chart.favorableElements.includes(wealth);
  const headline = pick(seed, 50, [
    `How you actually make money, not how a job title describes it.`,
    `Your relationship to money runs through ${ELEMENT_LABEL[wealth]}.`,
  ]);
  const body = [
    `In BaZi terms, the element you control is your "wealth" element — for you that's ${ELEMENT_LABEL[wealth]}. ${favHasWealth ? `It's also favorable in your chart, which is a genuinely good sign: work and money tend to come to you when you engage with it directly rather than waiting for the right moment.` : `It's not flagged as favorable here, which usually means money flows more easily through steady effort than through chasing the obvious wealth-coded moves — worth building structure around it rather than relying on instinct alone.`}`,
    chart.dayMasterStrength === "strong"
      ? `A strong Day Master usually means you work best owning something outright — a project, a role, a business — rather than being one input among many.`
      : chart.dayMasterStrength === "weak"
        ? `A weak Day Master tends to do its best financial work in partnership or within a strong structure, not solo and unsupported — that's not a limitation, it's a design spec.`
        : `A balanced Day Master gives you real range here — you can carry a project solo or plug into a team without losing your footing either way.`,
  ].join(" ");
  const mechanics = `Wealth element (财 cái — the element the Day Master controls, 克 kè): ${ELEMENT_LABEL[wealth]}.`;
  return CardContentSchema.parse({ headline, body, mechanics });
}

function cardLoveAndRelationships(chart: Chart, seed: number): CardContent {
  const output = outputElement(chart.dayMaster.element);
  const resource = resourceElement(chart.dayMaster.element);
  const headline = pick(seed, 60, [
    `In relationships, you lead with ${ELEMENT_LABEL[output]}.`,
    `Here's what your chart says about how you connect.`,
  ]);
  const body = [
    `The element you generate — your "expression" element — is ${ELEMENT_LABEL[output]}; that's usually the register you show up in when you're comfortable with someone: ${ELEMENT_CORE[output].essence}.`,
    `The element that feeds you, your "resource" element, is ${ELEMENT_LABEL[resource]} — pay attention to people who bring that energy into your life, since they tend to be the ones who leave you steadier, not more depleted.`,
    chart.dayMasterStrength === "weak"
      ? `Given a weaker Day Master, it's worth choosing partners who add rather than only ask — you give generously by default, so the relationship needs to give back on its own, not just when you remember to ask for it.`
      : `Given how self-sufficient you run, the risk in close relationships isn't dependency — it's forgetting to let someone else carry something, even when they want to.`,
  ].join(" ");
  const mechanics = `Output element (食傷 shí shāng — the element the Day Master generates, 生 shēng): ${ELEMENT_LABEL[output]}. Resource element (印 yìn — the element that generates the Day Master): ${ELEMENT_LABEL[resource]}.`;
  return CardContentSchema.parse({ headline, body, mechanics });
}

function cardFrictionAndFlow(chart: Chart, seed: number): CardContent {
  const relations = chart.branchRelations;
  const headline = pick(seed, 70, [
    relations.length === 0
      ? `No major clashes flagged — your friction shows up quietly, not structurally.`
      : `Your chart has built-in tension. Here's where.`,
    relations.length === 0 ? `A relatively unclashed chart.` : `The friction points are already mapped — use them.`,
  ]);
  let body: string;
  if (relations.length === 0) {
    body = `Your chart doesn't flag any major branch clashes or punishments between your pillars — structurally, you're not carrying a built-in internal conflict. That doesn't mean life is friction-free, just that when tension shows up, it's more likely coming from outside circumstances than from something wired into the chart itself.`;
  } else {
    const notes = relations.slice(0, 2).map((r) => r.note).join(" ");
    const hasClash = relations.some((r) => isClashRelationType(r.type));
    body = `Your chart flags ${relations.length === 1 ? "a relationship" : `${relations.length} relationships`} between pillars: ${notes} ${hasClash ? "A clash isn't a curse — it's a built-in source of internal push-pull, usually between two things you both want. The move isn't to eliminate it, it's to notice when it's firing and choose on purpose instead of getting yanked between both sides." : "These are harmonious ties, which tend to show up as ease — people, timing, or decisions that click with less friction than you'd expect."}`;
  }
  const mechanics =
    relations.length === 0
      ? `No 三合/六合/相冲/相刑 (harmony/clash/punishment) relationships flagged between this chart's branches.`
      : relations.map((r) => `${BRANCH_RELATION_LABEL[r.type]} (${r.branches.join("+")}): ${r.note}`).join(" | ");
  return CardContentSchema.parse({ headline, body, mechanics });
}

function cardThisChapter(chart: Chart, seed: number): CardContent {
  const first = chart.luckPillars.pillars[0];
  // The engine's LuckPillarEntry only carries {age, stem, branch} — derive the
  // pinyin/element gloss from the shared ganzhi parser rather than expecting
  // the engine to have precomputed it.
  const firstInfo = first ? parseGanZhi(`${first.stem}${first.branch}`) : null;
  const headline = pick(seed, 80, [
    `The chapter that opened at age ${chart.luckPillars.startAge}.`,
    `Your current backdrop, not your fixed fate.`,
  ]);
  let body: string;
  if (firstInfo) {
    body = `Your luck pillars (大运) started running at age ${chart.luckPillars.startAge}, moving ${chart.luckPillars.forward ? "forward" : "in reverse"} through the cycle. The opening chapter brings ${ELEMENT_LABEL[firstInfo.stemElement]} energy into your chart — think of it as the backdrop of this era of your life, not a script you're locked into. A luck pillar changes what's easy and what's costly; it doesn't change what you're allowed to do.`;
  } else {
    body = `Your luck pillar sequence starts at age ${chart.luckPillars.startAge}, running ${chart.luckPillars.forward ? "forward" : "in reverse"} through the cycle. Think of each pillar as a change in backdrop — what's easy, what's costly — not a script you're locked into.`;
  }
  const mechanics = `Luck pillars (大运 dà yùn): start age ${chart.luckPillars.startAge}, direction ${chart.luckPillars.forward ? "forward (顺行 shùn xíng)" : "reverse (逆行 nì xíng)"}.${first && firstInfo ? ` Opening pillar: ${first.stem}${first.branch} (${firstInfo.stemPinyin} ${firstInfo.branchPinyin}, ${ELEMENT_LABEL[firstInfo.stemElement]}).` : ""}`;
  return CardContentSchema.parse({ headline, body, mechanics });
}

function cardLeanInto(chart: Chart, seed: number): CardContent {
  const fav = chart.favorableElements;
  const el = chart.dayMaster.element;
  const headline = pick(seed, 90, [
    `Three things to actually do with this.`,
    `Here's where the reading turns into action.`,
  ]);
  const actions: string[] = [];
  if (fav.length > 0) {
    actions.push(
      `Point yourself toward ${elementList(fav)} deliberately this month — people, projects, or environments with that flavor tend to work in your favor right now, so don't leave it to chance.`
    );
  } else {
    actions.push(
      `Without a single standout favorable element, the highest-leverage move is consistency over novelty — pick one thing from this reading and actually practice it for a month before judging whether it worked.`
    );
  }
  actions.push(
    chart.dayMasterStrength === "strong"
      ? `Practice handing off one thing this week that you'd normally just take on yourself — not because you can't do it, but because your default is doing everything, and that's worth testing.`
      : chart.dayMasterStrength === "weak"
        ? `Say no to one request this week before you've said yes out of habit — even a small one. The goal isn't to become someone else, just to catch the reflex.`
        : `Pick one area of your life to deliberately lean lopsided this month instead of staying balanced — your natural range means you can afford to, and it'll show you something your usual equilibrium hides.`
  );
  actions.push(`Your core ${ELEMENT_LABEL[el]} energy is the asset, not the obstacle — the work is aiming it, not suppressing it.`);
  const body = actions.join(" ");
  const mechanics = `Favorable elements to lean into (喜神): ${elementList(fav)}.`;
  return CardContentSchema.parse({ headline, body, mechanics });
}

const CARD_GENERATORS: Record<CardId, (chart: Chart, seed: number) => CardContent> = {
  "chart-at-a-glance": cardChartAtAGlance,
  "elemental-nature": cardElementalNature,
  "element-balance": cardElementBalance,
  strengths: cardStrengths,
  "blind-spots": cardBlindSpots,
  "work-and-money": cardWorkAndMoney,
  "love-and-relationships": cardLoveAndRelationships,
  "friction-and-flow": cardFrictionAndFlow,
  "this-chapter": cardThisChapter,
  "lean-into": cardLeanInto,
};

function specsFor(opts?: NatalReadingOptions): CardSpec[] {
  if (!opts?.cardIds || opts.cardIds.length === 0) return CARD_SPECS;
  const wanted = new Set(opts.cardIds);
  return CARD_SPECS.filter((spec) => wanted.has(spec.id));
}

function generateCard(chart: Chart, spec: CardSpec): Card {
  const seed = chartSeed(chart);
  const content = CARD_GENERATORS[spec.id](chart, seed);
  return CardSchema.parse({ id: spec.id, ...content });
}

// ---------------------------------------------------------------------------
// Daily fortune
// ---------------------------------------------------------------------------

const RELATION_FLAVOR: Record<
  ReturnType<typeof elementRelation>,
  { energy: string; leanInto: string; goEasyOn: string; headlines: string[] }
> = {
  same: {
    energy: "Familiar, a little competitive — today mirrors you right back.",
    leanInto: "collaborating with people who think the way you do",
    goEasyOn: "turning collaboration into competition without noticing",
    headlines: [`Today looks a lot like you. That's not always restful.`, `Today's energy is basically your reflection.`],
  },
  generates: {
    energy: "Expressive and outward-facing — today wants you to make something, say something, ship something.",
    leanInto: "putting something you've been sitting on out into the world",
    goEasyOn: "overexplaining yourself once you've already made the point",
    headlines: [`Today wants you loud, not careful.`, `Today rewards finishing, not polishing forever.`],
  },
  "generated-by": {
    energy: "Replenishing — today hands you more than it asks of you.",
    leanInto: "learning, resting, and taking advice you'd normally wave off",
    goEasyOn: "forcing output on a day built for intake",
    headlines: [`Today refills you, if you let it.`, `Today's a input day, not an output day.`],
  },
  controls: {
    energy: "Productive and a little acquisitive — today rewards effort you can point at a result.",
    leanInto: "closing something out, asking for what you're owed",
    goEasyOn: "spreading yourself thin across too many targets at once",
    headlines: [`Today pays out, if you go get it.`, `Today's built for finishing, not starting five new things.`],
  },
  "controlled-by": {
    energy: "Combative but productive — today argues with you a little. Let it.",
    leanInto: "holding your ground calmly and saying the direct thing once",
    goEasyOn: "big commitments made under today's pressure",
    headlines: [`Today pushes back. That's not a bad sign.`, `Today argues with you. Don't take it personally.`],
  },
};

export function deriveDailyFortune(chart: Chart, dayGanZhi: string, date: string): DailyFortune {
  const parsed = parseGanZhi(dayGanZhi);
  const relation = parsed ? elementRelation(chart.dayMaster.element, parsed.stemElement) : "same";
  const flavor = RELATION_FLAVOR[relation];
  const seed = hashString(`${chartSeed(chart)}|${dayGanZhi}|${date}`);
  const headline = pick(seed, 1, flavor.headlines);
  const body = parsed
    ? `Today's day pillar is ${parsed.stem}${parsed.branch} (${parsed.stemPinyin} ${parsed.branchPinyin}, the ${parsed.branchAnimal} day) — ${ELEMENT_LABEL[parsed.stemElement]} energy meeting your ${ELEMENT_LABEL[chart.dayMaster.element]} Day Master. ${flavor.energy}`
    : `Today's day pillar (${dayGanZhi}) sets the tone against your ${ELEMENT_LABEL[chart.dayMaster.element]} Day Master. ${flavor.energy}`;
  return DailyFortuneSchema.parse({
    headline,
    body,
    energy: flavor.energy,
    leanInto: flavor.leanInto.charAt(0).toUpperCase() + flavor.leanInto.slice(1),
    goEasyOn: flavor.goEasyOn.charAt(0).toUpperCase() + flavor.goEasyOn.slice(1),
  });
}

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

const DAY_MASTER_RELATION_FLAVOR: Record<
  RelationFacts["dayMasterRelation"]["type"],
  { dynamic: string; scoreDelta: number }
> = {
  same: {
    dynamic: "you run on the same core element, which reads as instant familiarity — you 'get' each other fast, for better and worse.",
    scoreDelta: 6,
  },
  generates: {
    dynamic: "Person A's element feeds Person B's, a naturally supportive current running from one of you to the other.",
    scoreDelta: 18,
  },
  "generated-by": {
    dynamic: "Person B's element feeds Person A's — the same supportive current, running the other direction.",
    scoreDelta: 18,
  },
  controls: {
    dynamic: "Person A's element structures Person B's — this can read as guidance or as pressure, depending on how it's handled.",
    scoreDelta: 2,
  },
  "controlled-by": {
    dynamic: "Person B's element structures Person A's — again, guidance or pressure depending on how it's carried.",
    scoreDelta: -4,
  },
};

export function deriveCompatibility(chartA: Chart, chartB: Chart, relationFacts: RelationFacts): Compat {
  const seed = hashString(
    `${chartSeed(chartA)}|${chartSeed(chartB)}|${relationFacts.dayMasterRelation.type}|${relationFacts.complementaryElements.join(",")}|${relationFacts.clashingElements.join(",")}`
  );
  const dmFlavor = DAY_MASTER_RELATION_FLAVOR[relationFacts.dayMasterRelation.type];
  const clashBranchRelations = relationFacts.branchRelations.filter((r) => isClashRelationType(r.type));
  const harmonyBranchRelations = relationFacts.branchRelations.filter((r) => !isClashRelationType(r.type));

  let score = 55 + dmFlavor.scoreDelta;
  score += Math.min(relationFacts.complementaryElements.length, 3) * 6;
  score -= Math.min(relationFacts.clashingElements.length, 3) * 8;
  score += Math.min(harmonyBranchRelations.length, 3) * 4;
  score -= Math.min(clashBranchRelations.length, 3) * 6;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const overall = pick(seed, 1, [
    `A pairing with real signal in it — worth the work either way.`,
    `Not a coin flip: this chart pairing has a clear shape to it.`,
    `The kind of match that rewards paying attention rather than assuming.`,
  ]);

  const dynamic = `${chartA.dayMaster.stemPinyin.charAt(0).toUpperCase()}${chartA.dayMaster.stemPinyin.slice(1)}'s ${ELEMENT_LABEL[chartA.dayMaster.element]} energy meets ${chartB.dayMaster.stemPinyin.charAt(0).toUpperCase()}${chartB.dayMaster.stemPinyin.slice(1)}'s ${ELEMENT_LABEL[chartB.dayMaster.element]} — ${dmFlavor.dynamic}${relationFacts.complementaryElements.length > 0 ? ` You also share complementary elements (${elementList(relationFacts.complementaryElements)}), which tends to smooth over day-to-day friction before it builds up.` : ""}`;

  const friction =
    relationFacts.clashingElements.length === 0 && clashBranchRelations.length === 0
      ? `Nothing sharply clashing shows up between your charts — the friction here, if any, will come from ordinary differences in pace or priorities rather than anything structural.`
      : `Be honest about the real friction: ${relationFacts.clashingElements.length > 0 ? `${elementList(relationFacts.clashingElements)} sit in tension between your charts, which tends to surface as recurring, low-grade disagreement rather than one big blowup.` : ""}${clashBranchRelations.length > 0 ? ` ${clashBranchRelations.map((r) => r.note).join(" ")}` : ""}`.trim();

  const advice = pick(seed, 2, [
    `Name the friction point above out loud, early, before it calcifies into a pattern neither of you can see anymore — a chart flag isn't a verdict, it's just something worth talking about on purpose.`,
    `Use the supportive parts of this pairing deliberately — lean on what already flows easily so you both have more slack for the parts that don't.`,
    `Don't try to erase the tension here; manage it consciously instead. Charts with zero friction are rare and, honestly, a little boring.`,
  ]);

  const verdict =
    score >= 85
      ? "Effortless chemistry."
      : score >= 70
        ? "Real potential, occasional friction."
        : score >= 55
          ? "Complementary opposites — needs deliberate work."
          : score >= 40
            ? "High friction, high growth if you both show up."
            : "A hard pairing — go in with eyes open.";

  return CompatSchema.parse({ overall, dynamic, friction, advice, score, verdict });
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

const CHAT_OPENERS = [
  "Fair question. Let's look at what your chart actually says about it.",
  "Here's what I can tell you, grounded in your chart rather than a guess.",
  "Good one to ask — let's stay honest about what the chart does and doesn't say.",
];

function mockChatReply(chart: Chart, reading: Reading, messages: ChatMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const seed = hashString(`${chartSeed(chart)}|${messages.length}|${lastUser?.content ?? ""}`);
  const opener = pick(seed, 1, CHAT_OPENERS);
  const relevantCard = reading.cards[hashString(lastUser?.content ?? "x") % reading.cards.length];
  const isOutOfScope = lastUser
    ? /\b(diagnos|prescri|lawsuit|sue |legal advice|invest(ment)? advice|stock tip|medical|symptom)\b/i.test(lastUser.content)
    : false;

  if (isOutOfScope) {
    return `I'll be straight with you: that's a medical, legal, or financial question, and your chart can't responsibly answer it — please talk to someone qualified for that part. What the chart CAN tell you is the pattern around it: given your ${ELEMENT_LABEL[chart.dayMaster.element]} Day Master, ${relevantCard.body}`;
  }

  return `${opener} Given your chart — a ${chart.dayMasterStrength} ${ELEMENT_LABEL[chart.dayMaster.element]} Day Master — the closest thread to your question is this: ${relevantCard.body} If that doesn't quite land, tell me more about the specific situation and I'll ground the answer further in your chart.`;
}

async function* mockChatStream(chart: Chart, reading: Reading, messages: ChatMessage[]): AsyncIterable<string> {
  const full = mockChatReply(chart, reading, messages);
  // Chunk by word to emulate a token stream, deterministically (no timers, no randomness).
  const words = full.split(" ");
  const chunkSize = 4;
  for (let i = 0; i < words.length; i += chunkSize) {
    yield `${words.slice(i, i + chunkSize).join(" ")} `;
  }
}

// ---------------------------------------------------------------------------
// The interpreter
// ---------------------------------------------------------------------------

export class MockInterpreter implements Interpreter {
  readonly model = "mock";

  async natalReading(chart: Chart, opts?: NatalReadingOptions): Promise<Reading> {
    const cards = specsFor(opts).map((spec) => generateCard(chart, spec));
    return ReadingSchema.parse({ cards, model: this.model });
  }

  async *streamNatalReading(chart: Chart, opts?: NatalReadingOptions): AsyncIterable<Card> {
    for (const spec of specsFor(opts)) {
      yield generateCard(chart, spec);
    }
  }

  chat(chart: Chart, reading: Reading, messages: ChatMessage[]): AsyncIterable<string> {
    return mockChatStream(chart, reading, messages);
  }

  async dailyFortune(chart: Chart, dayGanZhi: string, date: string): Promise<DailyFortune> {
    return deriveDailyFortune(chart, dayGanZhi, date);
  }

  async compatibility(chartA: Chart, chartB: Chart, relationFacts: RelationFacts): Promise<Compat> {
    return deriveCompatibility(chartA, chartB, relationFacts);
  }
}
