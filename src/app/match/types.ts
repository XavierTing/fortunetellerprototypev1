import type { Chart, Gender } from "@/lib/bazi";

/**
 * Person B's birth data + computed chart, persisted as JSON in
 * `CompatibilityPair.personB` (a TEXT column — see prisma/schema.prisma's
 * file header on why JSON-shaped fields are stored as serialized strings).
 * Person B is ad-hoc (PRD §5.5: "no account required"), so there's no
 * Profile row to join against — this record is the only place their data
 * lives.
 */
export interface PersonBRecord {
  name: string | null;
  date: string;
  /** null when the time is unknown — degrades to a 3-pillar chart, same as person A. */
  time: string | null;
  lat: number;
  lng: number;
  tzId: string;
  /** Fed to `computeChart` to determine 大运 (luck-pillar) direction — see src/lib/bazi/luck.ts. */
  gender: Gender;
  cityLabel: string;
  chart: Chart;
}
