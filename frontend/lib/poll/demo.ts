import { mulberry32 } from "../random";
import {
  FACULTIES,
  MAX_BARRIERS,
  SLEEP_BUCKETS,
  YEARS,
  type BarrierId,
  type SupportId,
} from "./options";
import type { PollAnswers } from "./validate";

/**
 * FAKE demo responses for rehearsing the dashboard. Always stored in the "demo" dataset and
 * shown with a "Demo data" label. Weights are invented for a plausible-looking demo and are
 * NOT research findings.
 */
const BARRIER_WEIGHTS: Record<BarrierId, number> = {
  assignments: 9,
  exams: 7,
  stress: 7,
  screens: 8,
  early_classes: 4,
  job_shifts: 4,
  late_classes: 2,
  commute: 3,
  gaming: 3,
  caffeine: 2,
  social: 3,
  noise: 2,
  family: 2,
  other: 1,
};
const SUPPORT_WEIGHTS: Record<SupportId, number> = {
  app_reminders: 6,
  quiet_spaces: 7,
  fewer_early_exams: 6,
  sleep_tools: 5,
  posters: 3,
  workshops: 3,
  other: 1,
};

function pickWeighted(
  rand: () => number,
  weights: Record<string, number>,
  exclude: Set<string>,
): string {
  const entries = Object.entries(weights).filter(([id]) => !exclude.has(id));
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let r = rand() * total;
  for (const [id, w] of entries) if ((r -= w) <= 0) return id;
  return entries[entries.length - 1][0];
}

function pickMany(rand: () => number, weights: Record<string, number>, n: number): string[] {
  const chosen = new Set<string>();
  while (chosen.size < n) chosen.add(pickWeighted(rand, weights, chosen));
  return [...chosen];
}

export const DEMO_SIZE = 84;

export function generateDemoResponses(count = DEMO_SIZE, seed = 20261201): PollAnswers[] {
  const rand = mulberry32(seed);
  const rows: PollAnswers[] = [];
  for (let i = 0; i < count; i++) {
    const barriers = pickMany(rand, BARRIER_WEIGHTS, 1 + Math.floor(rand() * MAX_BARRIERS));
    const supports = pickMany(rand, SUPPORT_WEIGHTS, 1 + Math.floor(rand() * 2));
    const pick = <T extends { id: string }>(list: readonly T[], skip: number) =>
      rand() < skip ? null : list[Math.floor(rand() * list.length)].id;
    rows.push({
      barriers,
      topBarrier: barriers[Math.floor(rand() * barriers.length)],
      supports,
      yearOfStudy: pick(YEARS, 0.15),
      faculty: pick(FACULTIES, 0.2),
      sleepBucket: pick(SLEEP_BUCKETS, 0.25),
    });
  }
  return rows;
}
