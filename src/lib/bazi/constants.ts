/**
 * Static BaZi reference tables: the 10 heavenly stems (天干) and 12 earthly
 * branches (地支), each with tone-marked pinyin, Five-Element (五行)
 * assignment, and (for stems) yin/yang polarity and (for branches) the
 * English zodiac animal name.
 *
 * These are closed, unambiguous, textbook correspondences — not derived from
 * lunar-typescript, but the Chinese characters themselves always come FROM
 * lunar-typescript's output (see pillars.ts), so lookups here only ever key
 * on characters the library itself produced.
 */

export type Element = "wood" | "fire" | "earth" | "metal" | "water";
export type YinYang = "yin" | "yang";

export interface StemInfo {
  pinyin: string;
  element: Element;
  yinYang: YinYang;
}

export interface BranchInfo {
  pinyin: string;
  /** The branch's own dominant-qi element (used for the Pillar.branchElement field). */
  element: Element;
  /** English Chinese-zodiac animal name, e.g. "Rabbit". */
  zodiac: string;
}

export const STEMS: Record<string, StemInfo> = {
  "甲": { pinyin: "jiǎ", element: "wood", yinYang: "yang" },
  "乙": { pinyin: "yǐ", element: "wood", yinYang: "yin" },
  "丙": { pinyin: "bǐng", element: "fire", yinYang: "yang" },
  "丁": { pinyin: "dīng", element: "fire", yinYang: "yin" },
  "戊": { pinyin: "wù", element: "earth", yinYang: "yang" },
  "己": { pinyin: "jǐ", element: "earth", yinYang: "yin" },
  "庚": { pinyin: "gēng", element: "metal", yinYang: "yang" },
  "辛": { pinyin: "xīn", element: "metal", yinYang: "yin" },
  "壬": { pinyin: "rén", element: "water", yinYang: "yang" },
  "癸": { pinyin: "guǐ", element: "water", yinYang: "yin" },
};

export const BRANCHES: Record<string, BranchInfo> = {
  "子": { pinyin: "zǐ", element: "water", zodiac: "Rat" },
  "丑": { pinyin: "chǒu", element: "earth", zodiac: "Ox" },
  "寅": { pinyin: "yín", element: "wood", zodiac: "Tiger" },
  "卯": { pinyin: "mǎo", element: "wood", zodiac: "Rabbit" },
  "辰": { pinyin: "chén", element: "earth", zodiac: "Dragon" },
  "巳": { pinyin: "sì", element: "fire", zodiac: "Snake" },
  "午": { pinyin: "wǔ", element: "fire", zodiac: "Horse" },
  "未": { pinyin: "wèi", element: "earth", zodiac: "Goat" },
  "申": { pinyin: "shēn", element: "metal", zodiac: "Monkey" },
  "酉": { pinyin: "yǒu", element: "metal", zodiac: "Rooster" },
  "戌": { pinyin: "xū", element: "earth", zodiac: "Dog" },
  "亥": { pinyin: "hài", element: "water", zodiac: "Pig" },
};

export const ELEMENT_ORDER: Element[] = ["wood", "fire", "earth", "metal", "water"];

/** 生 (shēng) — "generates/feeds": key generates value. */
export const GENERATES: Record<Element, Element> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

/** 克 (kè) — "controls/channels": key controls value. */
export const CONTROLS: Record<Element, Element> = {
  wood: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  metal: "wood",
};

export function stemInfo(stem: string): StemInfo {
  const info = STEMS[stem];
  if (!info) throw new Error(`bazi/constants: unrecognized heavenly stem "${stem}"`);
  return info;
}

export function branchInfo(branch: string): BranchInfo {
  const info = BRANCHES[branch];
  if (!info) throw new Error(`bazi/constants: unrecognized earthly branch "${branch}"`);
  return info;
}

/** The element that generates `target` (target's "resource/印" element). Inverse of GENERATES. */
export function elementThatGenerates(target: Element): Element {
  const found = ELEMENT_ORDER.find((el) => GENERATES[el] === target);
  if (!found) throw new Error(`bazi/constants: no generator found for ${target}`);
  return found;
}

/** The element that controls `target` (target's "authority/官杀" element). Inverse of CONTROLS. */
export function elementThatControls(target: Element): Element {
  const found = ELEMENT_ORDER.find((el) => CONTROLS[el] === target);
  if (!found) throw new Error(`bazi/constants: no controller found for ${target}`);
  return found;
}
