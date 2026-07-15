/**
 * The fixed set of natal-reading cards (PRD §5.2: "~8-10 cards"). Shared by
 * the mock interpreter (drives which prose generator to run) and the
 * DeepSeek interpreter / prompts (drives per-card instructions to the
 * model). Order here is the order cards render/stream in.
 */
export type CardId =
  | "chart-at-a-glance"
  | "elemental-nature"
  | "element-balance"
  | "strengths"
  | "blind-spots"
  | "work-and-money"
  | "love-and-relationships"
  | "friction-and-flow"
  | "this-chapter"
  | "lean-into";

export interface CardSpec {
  id: CardId;
  title: string;
  /** One-line brief telling the model (and the mock generators) what this card is for. */
  focus: string;
}

export const CARD_SPECS: CardSpec[] = [
  {
    id: "chart-at-a-glance",
    title: "Your Chart at a Glance",
    focus:
      "A warm, specific opening line naming their zodiac animal, day master, and overall balance — the hook that makes the reading feel unmistakably theirs, not a generic horoscope.",
  },
  {
    id: "elemental-nature",
    title: "Your Elemental Nature",
    focus:
      "Interpret the Day Master (element + yin/yang + strength) as a plain-English core-personality read — who this person fundamentally is, not a definition of the term.",
  },
  {
    id: "element-balance",
    title: "Element Balance",
    focus:
      "Interpret the five-element tally: what's abundant, what's scarce, and what that lopsidedness actually feels like day to day. Use the real counts.",
  },
  {
    id: "strengths",
    title: "Strengths",
    focus:
      "Name 2-3 genuine, specific strengths that follow from the day master element, strength (strong/weak/balanced), and favorable elements.",
  },
  {
    id: "blind-spots",
    title: "Blind Spots",
    focus:
      "Anti-sycophancy card: name a real tension or blind spot kindly but honestly, grounded in the day master strength and unfavorable elements — then point toward a small, doable correction. Never flattery, never doom.",
  },
  {
    id: "work-and-money",
    title: "Work & Money",
    focus:
      "Interpret work style and relationship to money via the wealth element (the element the day master controls) and favorable elements. Concrete, not generic career-horoscope filler.",
  },
  {
    id: "love-and-relationships",
    title: "Love & Relationships",
    focus:
      "Interpret relationship style via the day master's output element (how they express/connect) and peer element (same element — friends/rivals/partners). Grounded, specific, agency-first.",
  },
  {
    id: "friction-and-flow",
    title: "How You Handle Friction",
    focus:
      "Interpret the branchRelations (harmonies and clashes) as the chart's built-in tension points and easy alliances — reframe any clash as workable, not cursed.",
  },
  {
    id: "this-chapter",
    title: "This Chapter of Life",
    focus:
      "Interpret the opening luck pillar (大运) sequence — the chapter that began at startAge, and the element/direction it brings — as the current backdrop, not a fixed fate.",
  },
  {
    id: "lean-into",
    title: "What to Lean Into",
    focus:
      "The agency close: 2-3 concrete, doable actions that follow from the favorable elements and strengths already named. Every reading must end here — no fatalism, no vague positivity.",
  },
];
