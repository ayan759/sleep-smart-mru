/**
 * Alertness model for "Sleep Weather". PURE and DETERMINISTIC: no Date.now(), no randomness,
 * no I/O. Educational estimate only, not a medical tool.
 *
 * Structure: the two-process model of sleep regulation, i.e. a homeostatic process S and a
 * circadian process C (Borbély, 1982; Daan, Beersma & Borbély, 1984), extended with a sleep
 * inertia process W as in the three-process model of alertness (Åkerstedt & Folkard, 1997;
 * Åkerstedt, Folkard & Portin, 2004). Predicted alertness A = S + C + W, on the model's
 * internal alertness scale.
 *
 * Every numeric parameter below comes from the three-process model as published by
 * Åkerstedt & Folkard and restated, with these exact values, in the open-access paper:
 *   Ingre, M., Van Leeuwen, W., Klemets, T., Ullvetter, C., Hough, S., Kecklund, G.,
 *   Karlsson, D., & Åkerstedt, T. (2014). Validating and extending the three process model of
 *   alertness in airline operations. PLoS ONE, 9(10), e108679.
 *   https://doi.org/10.1371/journal.pone.0108679  ("Ingre 2014" below)
 * The Åkerstedt & Folkard originals were not readable online (paywalled); values were checked
 * against Ingre 2014's Methods text on 2026-11-23.
 *
 * NOTE ON SIGN CONVENTION: in Borbély's two-process model S is sleep *pressure* (rises while
 * awake). In the three-process model S is the homeostatic *alertness* component (falls while
 * awake, recovers during sleep). This module uses the three-process convention; sleep pressure
 * is `S_UPPER - S`.
 *
 * Time unit: hours. (Ingre 2014 derives the sleep recovery rate from an 8-hour sleep, below.)
 */

// ---------------------------------------------------------------- Process S (homeostatic)

/** Lower asymptote of S while awake. Ingre 2014: "lower (la = 2.4) asymptote". */
export const S_LOWER = 2.4;
/** Upper asymptote of S during sleep. Ingre 2014: "higher (ha = 14.3) ... asymptote". */
export const S_UPPER = 14.3;
/** Exponential decay rate of S while awake, per hour. Ingre 2014: "(d = -0.0353)". */
export const S_WAKE_DECAY = 0.0353;
/**
 * Exponential recovery rate of S during sleep, per hour. Ingre 2014 gives its derivation:
 * "g = log((ha − 14.0)/(ha − 7.96))/8 ≈ -0.3813", i.e. 8 h of sleep starting from S = 7.96
 * brings S to 14.0. Computed here from that formula rather than hard-coded.
 */
export const S_SLEEP_RECOVERY = -Math.log((S_UPPER - 14.0) / (S_UPPER - 7.96)) / 8;
/**
 * TODO(verify): the three-process model slows recovery once S passes a "breakpoint"
 * (Ingre 2014: "S' < bl = 12.2"), but the switching rule (their eq. 1.5) is only in an
 * equation image we could not read. Until verified against Åkerstedt & Folkard (1997), recovery
 * here is the single exponential above. The value is recorded but NOT used.
 */
export const S_SLEEP_BREAKPOINT_UNUSED = 12.2;

// ---------------------------------------------------------------- Process C (circadian)

/** Amplitude of C. Ingre 2014: "amplitude (Ca = 2.5)". Mesor is 0 ("mesor (Cm = 0)"). */
export const C_AMPLITUDE = 2.5;
/** Default acrophase (clock hour of peak). Ingre 2014: "default circadian phase (p = 16.8)". */
export const C_ACROPHASE = 16.8;
/** Period of C in hours. Ingre 2014: "Process C (1.7) has a period of 24 h". */
export const C_PERIOD = 24;

// ---------------------------------------------------------------- Process W (sleep inertia)

/** W at the moment of waking. Ingre 2014: "at the time of waking up (Wc = -5.72)". */
export const W_INITIAL = -5.72;
/** Exponential recovery rate of W, per hour awake. Ingre 2014: "(Wd = -1.51)". */
export const W_DECAY = 1.51;

// Not modelled: the 12-hour ultradian process U that Ingre 2014 adds (an extension beyond the
// S + C + W model specified for this project).

// ---------------------------------------------------------------- Display scale

/**
 * DISPLAY CHOICE (not a physiological parameter): the 0–100 index linearly rescales A between
 * the lowest value the model can produce while awake (S_LOWER - C_AMPLITUDE + W_INITIAL) and the
 * highest (S_UPPER + C_AMPLITUDE). Both ends are derived from the cited parameters above.
 */
export const A_MIN = S_LOWER - C_AMPLITUDE + W_INITIAL;
export const A_MAX = S_UPPER + C_AMPLITUDE;

export function toIndex(alertness: number): number {
  const v = (100 * (alertness - A_MIN)) / (A_MAX - A_MIN);
  return Math.max(0, Math.min(100, v));
}

// ---------------------------------------------------------------- Model

export type SleepEpisode = { start: number; end: number }; // epoch ms

export type AlertnessPoint = {
  t: number; // epoch ms
  asleep: boolean;
  s: number;
  c: number;
  w: number;
  /** S + C + W while awake; NaN while asleep. */
  alertness: number;
  /** 0–100 display index; NaN while asleep. */
  index: number;
  /** Hours since the most recent wake-up (NaN while asleep or before any logged sleep). */
  hoursAwake: number;
};

export type ModelOptions = {
  /** Maps an instant to its local clock hour (0–24). Injected so the model stays pure. */
  clockHour: (t: number) => number;
  /** Shift of the circadian acrophase in hours (later chronotype = positive). */
  phaseShiftHours?: number;
};

const HOUR = 3_600_000;

/** Circadian component at a local clock hour. */
export function circadian(hour: number, phaseShiftHours = 0): number {
  return (
    C_AMPLITUDE * Math.cos((2 * Math.PI * (hour - (C_ACROPHASE + phaseShiftHours))) / C_PERIOD)
  );
}

/** S after `hours` awake, starting from s0. */
export function sAfterWake(s0: number, hours: number): number {
  return S_LOWER + (s0 - S_LOWER) * Math.exp(-S_WAKE_DECAY * hours);
}

/** S after `hours` asleep, starting from s0. */
export function sAfterSleep(s0: number, hours: number): number {
  return S_UPPER - (S_UPPER - s0) * Math.exp(-S_SLEEP_RECOVERY * hours);
}

/** Sleep inertia `hours` after waking. */
export function inertia(hours: number): number {
  return W_INITIAL * Math.exp(-W_DECAY * hours);
}

/**
 * Simulate alertness at regular steps over [from, to).
 *
 * Episodes are sorted and merged. The simulation starts at the first episode's start with
 * S = S_LOWER: that initial condition is washed out by the first night (after 8 h of sleep,
 * exp(-0.3813 * 8) ≈ 5% of the starting gap remains), so pass at least one night before `from`.
 */
export function simulate(
  episodes: SleepEpisode[],
  from: number,
  to: number,
  stepMinutes: number,
  options: ModelOptions,
): AlertnessPoint[] {
  const sorted = mergeEpisodes(episodes);
  const shift = options.phaseShiftHours ?? 0;
  const points: AlertnessPoint[] = [];
  if (sorted.length === 0) return points;

  // S at each episode boundary.
  const sAtStart: number[] = [];
  const sAtEnd: number[] = [];
  let s = S_LOWER;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) s = sAfterWake(s, (sorted[i].start - sorted[i - 1].end) / HOUR);
    sAtStart.push(s);
    s = sAfterSleep(s, (sorted[i].end - sorted[i].start) / HOUR);
    sAtEnd.push(s);
  }

  let k = 0; // index of the last episode starting at or before t
  for (let t = from; t < to; t += stepMinutes * 60_000) {
    while (k + 1 < sorted.length && sorted[k + 1].start <= t) k++;
    const c = circadian(options.clockHour(t), shift);
    const ep = sorted[k];
    if (t < sorted[0].start) {
      // Before any logged sleep: unknown history; report circadian only.
      points.push({
        t,
        asleep: false,
        s: NaN,
        c,
        w: NaN,
        alertness: NaN,
        index: NaN,
        hoursAwake: NaN,
      });
    } else if (t < ep.end) {
      const sNow = sAfterSleep(sAtStart[k], (t - ep.start) / HOUR);
      points.push({
        t,
        asleep: true,
        s: sNow,
        c,
        w: 0,
        alertness: NaN,
        index: NaN,
        hoursAwake: NaN,
      });
    } else {
      const hoursAwake = (t - ep.end) / HOUR;
      const sNow = sAfterWake(sAtEnd[k], hoursAwake);
      const w = inertia(hoursAwake);
      const alertness = sNow + c + w;
      points.push({
        t,
        asleep: false,
        s: sNow,
        c,
        w,
        alertness,
        index: toIndex(alertness),
        hoursAwake,
      });
    }
  }
  return points;
}

/** Sort episodes and merge overlapping or touching ones. Invalid (end <= start) are dropped. */
export function mergeEpisodes(episodes: SleepEpisode[]): SleepEpisode[] {
  const valid = episodes.filter((e) => e.end > e.start).sort((a, b) => a.start - b.start);
  const out: SleepEpisode[] = [];
  for (const e of valid) {
    const last = out[out.length - 1];
    if (last && e.start <= last.end) last.end = Math.max(last.end, e.end);
    else out.push({ ...e });
  }
  return out;
}

// ---------------------------------------------------------------- Personal bands

export type Band = "low" | "moderate" | "high";
export type Bands = { min: number; max: number; lowBelow: number; highAbove: number };

/**
 * DISPLAY CHOICE: bands are relative to the user's own range. The waking index values from
 * their logged week are split into thirds between their minimum and maximum.
 */
export function personalBands(points: AlertnessPoint[]): Bands | null {
  const values = points.filter((p) => !p.asleep && Number.isFinite(p.index)).map((p) => p.index);
  if (values.length < 8) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1e-6);
  return { min, max, lowBelow: min + span / 3, highAbove: min + (2 * span) / 3 };
}

export function bandOf(index: number, bands: Bands): Band {
  if (index < bands.lowBelow) return "low";
  if (index >= bands.highAbove) return "high";
  return "moderate";
}
