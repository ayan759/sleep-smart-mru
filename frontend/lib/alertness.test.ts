import { describe, expect, it } from "vitest";
import {
  A_MAX,
  A_MIN,
  C_PERIOD,
  S_SLEEP_RECOVERY,
  S_UPPER,
  circadian,
  inertia,
  mergeEpisodes,
  sAfterSleep,
  simulate,
  toIndex,
  type SleepEpisode,
} from "./alertness";

const H = 3_600_000;
// Pure clock for tests: UTC hour of day (no time zones involved).
const opts = { clockHour: (t: number) => (((t / H) % 24) + 24) % 24 };
const day = (d: number) => Date.UTC(2026, 11, d); // Dec d, 2026 00:00 UTC

/** n nights of 23:00 → 23:00 + hours. */
function nights(count: number, hours: number, lastNightHours = hours): SleepEpisode[] {
  return Array.from({ length: count }, (_, i) => {
    const start = day(1 + i) + 23 * H;
    const h = i === count - 1 ? lastNightHours : hours;
    return { start, end: start + h * H };
  });
}

const meanAwake = (pts: ReturnType<typeof simulate>) => {
  const a = pts.filter((p) => !p.asleep).map((p) => p.alertness);
  return a.reduce((x, y) => x + y, 0) / a.length;
};

describe("Process S (homeostatic)", () => {
  it("sleep pressure rises while awake and falls while asleep", () => {
    const eps = nights(3, 8);
    const pts = simulate(eps, day(2), day(5), 15, opts);
    const pressure = (p: (typeof pts)[number]) => S_UPPER - p.s;
    // A waking stretch: Dec 3, 08:00 → 22:00.
    const awake = pts.filter((p) => p.t >= day(3) + 8 * H && p.t <= day(3) + 22 * H);
    for (let i = 1; i < awake.length; i++)
      expect(pressure(awake[i])).toBeGreaterThan(pressure(awake[i - 1]));
    // A sleeping stretch: Dec 3, 23:15 → Dec 4, 06:45.
    const asleep = pts.filter((p) => p.asleep && p.t > day(3) + 23 * H && p.t < day(4) + 7 * H);
    expect(asleep.length).toBeGreaterThan(10);
    for (let i = 1; i < asleep.length; i++)
      expect(pressure(asleep[i])).toBeLessThan(pressure(asleep[i - 1]));
  });

  it("reproduces the published recovery derivation: 8 h of sleep from 7.96 reaches 14.0", () => {
    expect(S_SLEEP_RECOVERY).toBeCloseTo(0.3813, 3); // paper rounds to 0.3813
    expect(sAfterSleep(7.96, 8)).toBeCloseTo(14.0, 6);
  });
});

describe("Process C (circadian)", () => {
  it("has a ~24 h period", () => {
    expect(C_PERIOD).toBe(24);
    for (const h of [0, 3.5, 9, 16.8, 21]) expect(circadian(h + 24)).toBeCloseTo(circadian(h), 10);
    expect(circadian(16.8)).toBeCloseTo(2.5, 10); // peak at the acrophase
    expect(circadian(16.8 - 12)).toBeCloseTo(-2.5, 10); // trough 12 h earlier
  });

  it("shifts later for a later chronotype", () => {
    expect(circadian(17.8, 1)).toBeCloseTo(2.5, 10);
  });
});

describe("tomorrow's curve", () => {
  it("is lower after a short night than after a full one", () => {
    const full = simulate(nights(4, 8), day(5), day(6), 15, opts);
    const short = simulate(nights(4, 8, 4.5), day(5), day(6), 15, opts);
    // Compare the same waking window (from the later wake-up to 22:00).
    const window = (pts: typeof full) =>
      pts.filter((p) => p.t >= day(5) + 7 * H && p.t < day(5) + 22 * H);
    expect(meanAwake(window(short))).toBeLessThan(meanAwake(window(full)));
  });
});

describe("Process W (sleep inertia)", () => {
  it("lowers alertness in the first hour after waking", () => {
    expect(inertia(0)).toBeCloseTo(-5.72, 10);
    expect(inertia(1)).toBeGreaterThan(inertia(0.25));
    expect(Math.abs(inertia(1))).toBeLessThan(Math.abs(inertia(0)) * 0.25);
    const pts = simulate(nights(3, 8), day(3) + 7 * H, day(3) + 10 * H, 15, opts);
    const firstHour = pts.filter((p) => !p.asleep && p.hoursAwake < 1);
    expect(firstHour.length).toBeGreaterThan(0);
    for (const p of firstHour) expect(p.w).toBeLessThan(-1);
    for (const p of firstHour) expect(p.alertness).toBeLessThan(p.s + p.c);
  });
});

describe("determinism and scale", () => {
  it("returns identical output for identical input", () => {
    const a = simulate(nights(5, 7.5), day(3), day(6), 15, opts);
    const b = simulate(nights(5, 7.5), day(3), day(6), 15, opts);
    expect(a).toEqual(b);
  });

  it("maps the model's waking range onto 0–100", () => {
    expect(toIndex(A_MIN)).toBe(0);
    expect(toIndex(A_MAX)).toBe(100);
    expect(toIndex(A_MAX + 5)).toBe(100);
  });

  it("merges overlapping sleep episodes", () => {
    expect(
      mergeEpisodes([
        { start: 5, end: 10 },
        { start: 0, end: 6 },
        { start: 20, end: 15 },
      ]),
    ).toEqual([{ start: 0, end: 10 }]);
  });
});
