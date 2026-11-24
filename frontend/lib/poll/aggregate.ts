import {
  BARRIERS,
  FACULTIES,
  MIN_GROUP_SIZE,
  SUPPORTS,
  YEARS,
  labelOf,
  type Option,
} from "./options";
import type { PollAnswers } from "./validate";

export type Dataset = "live" | "demo";

export type Share = { id: string; label: string; count: number; pct: number };
export type GroupBreakdown = { id: string; label: string; n: number; top: Share[] };

export type PollResults = {
  dataset: Dataset;
  total: number;
  barriers: Share[]; // % of respondents who picked each (multi-select)
  topBarrier: Share[]; // "most want MRU to address" (single choice)
  supports: Share[];
  byYear: GroupBreakdown[]; // only groups with n >= MIN_GROUP_SIZE
  byFaculty: GroupBreakdown[];
  updatedAt: string;
};

/** Ranked shares from raw counts; % of respondents, rounded to 1 decimal. */
export function rank(counts: Map<string, number>, total: number, list: readonly Option[]): Share[] {
  return [...counts.entries()]
    .filter(([, c]) => c > 0)
    .map(([id, count]) => ({
      id,
      label: labelOf(list, id),
      count,
      pct: total ? Math.round((1000 * count) / total) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

const tally = (values: string[]) => {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
};

function breakdown(
  rows: PollAnswers[],
  key: "yearOfStudy" | "faculty",
  groups: readonly Option[],
): GroupBreakdown[] {
  const out: GroupBreakdown[] = [];
  for (const g of groups) {
    const members = rows.filter((r) => r[key] === g.id);
    // Privacy: small groups never leave the aggregator.
    if (members.length < MIN_GROUP_SIZE) continue;
    out.push({
      id: g.id,
      label: g.label,
      n: members.length,
      top: rank(tally(members.flatMap((r) => r.barriers)), members.length, BARRIERS).slice(0, 3),
    });
  }
  return out;
}

/** Same aggregation the SQL views perform; used by the in-memory dev store and tests. */
export function aggregate(rows: PollAnswers[], dataset: Dataset, now = new Date()): PollResults {
  const total = rows.length;
  return {
    dataset,
    total,
    barriers: rank(tally(rows.flatMap((r) => r.barriers)), total, BARRIERS),
    topBarrier: rank(tally(rows.map((r) => r.topBarrier)), total, BARRIERS),
    supports: rank(tally(rows.flatMap((r) => r.supports)), total, SUPPORTS),
    byYear: breakdown(rows, "yearOfStudy", YEARS),
    byFaculty: breakdown(rows, "faculty", FACULTIES),
    updatedAt: now.toISOString(),
  };
}
