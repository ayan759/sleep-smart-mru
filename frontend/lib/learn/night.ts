/**
 * An ILLUSTRATIVE night of sleep (11 p.m. to 7 a.m.) for the "How sleep works" diagram. It is an
 * example, not data: it follows the pattern NIH describes. You cycle through non-REM and REM
 * sleep several times a night; the first REM comes about 90 minutes in; REM periods get longer
 * toward morning while deep sleep comes mostly early (NINDS "Brain Basics: Understanding Sleep";
 * NICHD "What happens during sleep?").
 */

export type Stage = "wake" | "rem" | "n1" | "n2" | "n3";

export const STAGE_INFO: Record<Stage, { name: string; short: string; body: string }> = {
  wake: {
    name: "Awake",
    short: "Awake",
    body: "Time awake in bed: falling asleep at the start, and short moments between sleep cycles in this example.",
  },
  n1: {
    name: "Stage 1",
    short: "Light 1",
    body: "The changeover from waking to sleep. Brain waves start to slow, and it usually lasts only a few minutes.",
  },
  n2: {
    name: "Stage 2",
    short: "Light 2",
    body: "Light sleep before deeper sleep. You spend more of the night here than in any other stage.",
  },
  n3: {
    name: "Deep sleep",
    short: "Deep",
    body: "The deep sleep you need to feel refreshed in the morning. Most of it comes in the first half of the night.",
  },
  rem: {
    name: "REM sleep",
    short: "REM",
    body: "Your eyes move quickly behind closed lids and most dreaming happens. Your arm and leg muscles go briefly slack so you don't act out dreams. The first REM comes about 90 minutes in, and REM periods get longer toward morning.",
  },
};

/** Segments in order: [stage, minutes]. Totals 480 minutes (8 hours). */
export const EXAMPLE_NIGHT: [Stage, number][] = [
  ["wake", 10],
  ["n1", 5],
  ["n2", 20],
  ["n3", 40],
  ["n2", 10],
  ["rem", 10],
  ["n2", 20],
  ["n3", 35],
  ["n2", 15],
  ["rem", 20],
  ["wake", 3],
  ["n1", 4],
  ["n2", 30],
  ["n3", 15],
  ["n2", 15],
  ["rem", 28],
  ["n2", 45],
  ["n3", 5],
  ["n2", 10],
  ["rem", 35],
  ["wake", 4],
  ["n1", 6],
  ["n2", 45],
  ["rem", 45],
  ["wake", 5],
];

export const NIGHT_START_LABEL = "11 p.m.";
export const NIGHT_MINUTES = EXAMPLE_NIGHT.reduce((a, [, m]) => a + m, 0);

/** Minutes of each stage lost if the alarm cuts the night at `cutMin` minutes after 11 p.m. */
export function minutesLostAfter(cutMin: number): Record<Stage, number> {
  const lost: Record<Stage, number> = { wake: 0, rem: 0, n1: 0, n2: 0, n3: 0 };
  let t = 0;
  for (const [stage, m] of EXAMPLE_NIGHT) {
    const start = t;
    const end = t + m;
    t = end;
    if (end <= cutMin) continue;
    lost[stage] += end - Math.max(start, cutMin);
  }
  return lost;
}
