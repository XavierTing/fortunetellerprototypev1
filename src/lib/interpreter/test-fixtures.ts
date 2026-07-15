/**
 * Shared Chart / RelationFacts fixtures for interpreter unit tests. Not a
 * test file itself (vitest only picks up `*.test.ts`) — imported by the
 * ones that are. Two deliberately different charts so tests can assert
 * mock output actually varies with the chart instead of being templated.
 */
import type { Chart, RelationFacts, ChatMessage, Reading } from "./types";

/** Strong Yang Wood day master, known hour, two branch relations (harmony + clash). */
export const CHART_STRONG_WOOD: Chart = {
  input: { date: "1994-04-10", time: "11:30", lat: 39.9042, lng: 116.4074, tzId: "Asia/Shanghai" },
  trueSolarTime: "1994-04-10T11:24:00+08:00",
  pillars: {
    year: { stem: "庚", stemPinyin: "gēng", branch: "辰", branchPinyin: "chén", element: "metal", yinYang: "yang" },
    month: { stem: "戊", stemPinyin: "wù", branch: "寅", branchPinyin: "yín", element: "earth", yinYang: "yang" },
    day: { stem: "甲", stemPinyin: "jiǎ", branch: "子", branchPinyin: "zǐ", element: "wood", yinYang: "yang" },
    hour: { stem: "丙", stemPinyin: "bǐng", branch: "午", branchPinyin: "wǔ", element: "fire", yinYang: "yang" },
  },
  dayMaster: { stem: "甲", stemPinyin: "jiǎ", element: "wood", yinYang: "yang" },
  elements: { wood: 3, fire: 2, earth: 2, metal: 1, water: 0 },
  dayMasterStrength: "strong",
  favorableElements: ["fire", "metal"],
  unfavorableElements: ["water", "wood"],
  luckPillars: {
    startAge: 3,
    forward: true,
    pillars: [
      { startAge: 3, stem: "己", stemPinyin: "jǐ", branch: "卯", branchPinyin: "mǎo", element: "wood" },
      { startAge: 13, stem: "庚", stemPinyin: "gēng", branch: "辰", branchPinyin: "chén", element: "metal" },
      { startAge: 23, stem: "辛", stemPinyin: "xīn", branch: "巳", branchPinyin: "sì", element: "metal" },
    ],
  },
  zodiac: "Dragon",
  branchRelations: [
    {
      type: "三合",
      branches: ["寅", "午"],
      note: "Your month and hour branches are part of a fire triangle (寅午戌), amplifying Fire energy when active.",
    },
    {
      type: "相冲",
      branches: ["子", "午"],
      note: "Your day and hour branches clash (子午冲) — Water vs Fire, a classic push-pull between instinct and impulse.",
    },
  ],
};

/** Weak Yin Water day master, unknown birth time, no branch relations. */
export const CHART_WEAK_WATER: Chart = {
  input: { date: "2000-11-02", time: null, lat: 51.5074, lng: -0.1278, tzId: "Europe/London" },
  trueSolarTime: null,
  pillars: {
    year: { stem: "庚", stemPinyin: "gēng", branch: "辰", branchPinyin: "chén", element: "metal", yinYang: "yang" },
    month: { stem: "丁", stemPinyin: "dīng", branch: "亥", branchPinyin: "hài", element: "fire", yinYang: "yin" },
    day: { stem: "癸", stemPinyin: "guǐ", branch: "卯", branchPinyin: "mǎo", element: "water", yinYang: "yin" },
    hour: null,
  },
  dayMaster: { stem: "癸", stemPinyin: "guǐ", element: "water", yinYang: "yin" },
  elements: { wood: 3, fire: 2, earth: 1, metal: 1, water: 1 },
  dayMasterStrength: "weak",
  favorableElements: ["metal", "water"],
  unfavorableElements: ["earth"],
  luckPillars: {
    startAge: 7,
    forward: false,
    pillars: [
      { startAge: 7, stem: "丙", stemPinyin: "bǐng", branch: "戌", branchPinyin: "xū", element: "fire" },
      { startAge: 17, stem: "乙", stemPinyin: "yǐ", branch: "酉", branchPinyin: "yǒu", element: "wood" },
    ],
  },
  zodiac: "Rabbit",
  branchRelations: [],
};

export const RELATION_FACTS: RelationFacts = {
  dayMasterRelation: {
    type: "generated-by",
    aElement: "wood",
    bElement: "water",
    note: "Person B's Water feeds Person A's Wood — a naturally nourishing dynamic.",
  },
  branchRelations: [
    { type: "六合", branches: ["子", "丑"], note: "A supportive six-harmony tie between your charts." },
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
