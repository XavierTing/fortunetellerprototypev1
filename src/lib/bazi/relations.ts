/**
 * Branch relationships (支合/支冲/支刑) among the chart's 3-4 pillar
 * branches: 三合 (sanhe, three-harmony trine), 六合 (liuhe, six-harmony
 * pair), 相冲 (chong, six-clash), 相刑 (xing, punishment — pairwise triangle
 * members, the 子卯 mutual pair, and self-punishment on a repeated branch).
 *
 * Scope note: only FULL relations are reported (e.g. a sanhe triad needs all
 * 3 members present; a 寅巳申 punishment fires per present pair, matching
 * how 相刑 is classically defined as pairwise). Partial/half combinations
 * (半合) aren't reported — the Chart contract's `type` union doesn't include
 * a "banhe" variant, and with only 3-4 branches in a natal chart, reporting
 * every partial subset would be noisy rather than informative for the
 * consumer-app framing (PRD §2 anti-persona: not a professional 排盘 tool).
 */
import { Element, branchInfo } from "./constants";
import type { Pillars } from "./pillars";

export interface BranchRelation {
  type: "sanhe" | "liuhe" | "chong" | "xing";
  branches: string[];
  note: string;
}

interface PositionedBranch {
  position: "year" | "month" | "day" | "hour";
  branch: string;
}

const LIUHE_PAIRS: [string, string, Element | null][] = [
  ["子", "丑", "earth"],
  ["寅", "亥", "wood"],
  ["卯", "戌", "fire"],
  ["辰", "酉", "metal"],
  ["巳", "申", "water"],
  ["午", "未", null], // 午未合 — classically has no single agreed transformed element
];

const CHONG_PAIRS: [string, string][] = [
  ["子", "午"],
  ["丑", "未"],
  ["寅", "申"],
  ["卯", "酉"],
  ["辰", "戌"],
  ["巳", "亥"],
];

const SANHE_TRIADS: { branches: [string, string, string]; element: Element }[] = [
  { branches: ["申", "子", "辰"], element: "water" },
  { branches: ["亥", "卯", "未"], element: "wood" },
  { branches: ["寅", "午", "戌"], element: "fire" },
  { branches: ["巳", "酉", "丑"], element: "metal" },
];

/** Pairwise 相刑 relations: the 寅巳申 and 丑戌未 triangles (fire per present pair) + the 子卯 mutual pair. */
const XING_PAIRS: [string, string, string][] = [
  ["寅", "巳", "无恩之刑 (ungrateful punishment)"],
  ["巳", "申", "无恩之刑 (ungrateful punishment)"],
  ["申", "寅", "无恩之刑 (ungrateful punishment)"],
  ["丑", "戌", "恃势之刑 (relying-on-power punishment)"],
  ["戌", "未", "恃势之刑 (relying-on-power punishment)"],
  ["未", "丑", "恃势之刑 (relying-on-power punishment)"],
  ["子", "卯", "无礼之刑 (impolite punishment)"],
];

/** Branches capable of 自刑 (self-punishment) when the same branch repeats across pillars. */
const SELF_XING_BRANCHES = new Set(["辰", "午", "酉", "亥"]);

const POSITION_ORDER: PositionedBranch["position"][] = ["year", "month", "day", "hour"];

function present(pillars: Pillars): PositionedBranch[] {
  return POSITION_ORDER.filter((pos) => pillars[pos] !== null).map((pos) => ({
    position: pos,
    branch: (pillars[pos] as NonNullable<Pillars[typeof pos]>).branch,
  }));
}

function describeBranch(b: string): string {
  return `${b} (${branchInfo(b).pinyin})`;
}

export function computeBranchRelations(pillars: Pillars): BranchRelation[] {
  const branches = present(pillars);
  const relations: BranchRelation[] = [];

  // 六合 + 相冲 + pairwise 相刑: check every unordered pair, in a fixed
  // (year,month)/(year,day)/(year,hour)/(month,day)/(month,hour)/(day,hour)
  // order for deterministic output.
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const a = branches[i].branch;
      const b = branches[j].branch;

      const liuhe = LIUHE_PAIRS.find(([x, y]) => (x === a && y === b) || (x === b && y === a));
      if (liuhe) {
        const elementNote = liuhe[2] ? ` — combines toward ${liuhe[2]}` : "";
        relations.push({
          type: "liuhe",
          branches: [a, b],
          note: `${describeBranch(a)} and ${describeBranch(b)} form a Six Harmony (六合 liùhé), a softening, supportive pairing${elementNote}.`,
        });
      }

      const chong = CHONG_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
      if (chong) {
        relations.push({
          type: "chong",
          branches: [a, b],
          note: `${describeBranch(a)} and ${describeBranch(b)} clash (相冲 xiāngchōng) — an opposing, restless pairing that tends to bring change.`,
        });
      }

      const xing = XING_PAIRS.find(([x, y]) => (x === a && y === b) || (x === b && y === a));
      if (xing) {
        relations.push({
          type: "xing",
          branches: [a, b],
          note: `${describeBranch(a)} and ${describeBranch(b)} form a Punishment (相刑 xiāngxíng) — ${xing[2]}.`,
        });
      }
    }
  }

  // 自刑 (self-punishment): a self-punishing branch appearing 2+ times.
  const branchCounts = new Map<string, number>();
  for (const { branch } of branches) branchCounts.set(branch, (branchCounts.get(branch) ?? 0) + 1);
  for (const [branch, count] of branchCounts) {
    if (count >= 2 && SELF_XING_BRANCHES.has(branch)) {
      relations.push({
        type: "xing",
        branches: [branch, branch],
        note: `${describeBranch(branch)} repeats in the chart and punishes itself (自刑 zìxíng) — a pattern of self-undermining that eases with awareness.`,
      });
    }
  }

  // 三合 (sanhe): all 3 triad members present.
  const branchSet = new Set(branches.map((b) => b.branch));
  for (const triad of SANHE_TRIADS) {
    if (triad.branches.every((b) => branchSet.has(b))) {
      relations.push({
        type: "sanhe",
        branches: [...triad.branches],
        note: `${triad.branches.map(describeBranch).join(", ")} form a Three Harmony (三合 sānhé) trine, combining toward ${triad.element}.`,
      });
    }
  }

  return relations;
}
