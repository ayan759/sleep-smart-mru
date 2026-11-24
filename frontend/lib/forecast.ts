import {
  bandOf,
  personalBands,
  simulate,
  type AlertnessPoint,
  type Band,
  type Bands,
  type SleepEpisode,
} from "./alertness";
import { estimateChronotype, type Chronotype, type LoggedNight } from "./chronotype";
import type { ScheduleEvent } from "./schedule";
import { addDays, atClock, clockHour, formatClock, HOUR_MS, weekdayOf } from "./time";

export type SleepNight = {
  nightOf: string; // "YYYY-MM-DD" the night starts on
  bed: string; // "HH:MM"
  wake: string; // "HH:MM" (next morning)
  freeDay: boolean; // no class/work the next day
};

export type SleepLog = {
  nights: SleepNight[]; // last 7 nights, oldest first
  plannedBed: string; // tonight
  plannedWake: string; // tomorrow
  edited: boolean; // false while showing the example defaults
};

const hourOf = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h + m / 60;
};

/** Bed and wake instants for a night. Bedtimes before noon count as after midnight. */
export function nightInstants(nightOf: string, bed: string, wake: string): SleepEpisode | null {
  const bedDay = hourOf(bed) >= 12 ? nightOf : addDays(nightOf, 1);
  const start = atClock(bedDay, bed).getTime();
  const end = atClock(addDays(nightOf, 1), wake).getTime();
  return end > start ? { start, end } : null;
}

export function nightHours(n: { nightOf: string; bed: string; wake: string }): number {
  const ep = nightInstants(n.nightOf, n.bed, n.wake);
  return ep ? (ep.end - ep.start) / HOUR_MS : 0;
}

const isWeekendDay = (ymd: string) => [0, 6].includes(weekdayOf(ymd));

/** Example defaults: 7.5–8 h on school nights, a later lie-in before weekends. */
export function defaultSleepLog(today: string): SleepLog {
  const nights: SleepNight[] = [];
  for (let i = 7; i >= 1; i--) {
    const nightOf = addDays(today, -i);
    const free = isWeekendDay(addDays(nightOf, 1));
    nights.push(
      free
        ? { nightOf, bed: "00:30", wake: "09:00", freeDay: true }
        : { nightOf, bed: "23:30", wake: "07:30", freeDay: false },
    );
  }
  return { nights, plannedBed: "23:30", plannedWake: "07:30", edited: false };
}

/** Keep the log aligned to "the 7 nights before tonight" as days pass. */
export function alignLogToToday(log: SleepLog, today: string): SleepLog {
  const byDate = new Map(log.nights.map((n) => [n.nightOf, n]));
  const fresh = defaultSleepLog(today);
  return {
    ...log,
    nights: fresh.nights.map((d) => byDate.get(d.nightOf) ?? { ...d }),
  };
}

export function isValidSleepLog(x: unknown): x is SleepLog {
  if (!x || typeof x !== "object") return false;
  const l = x as SleepLog;
  const hhmm = (s: unknown) => typeof s === "string" && /^\d{2}:\d{2}$/.test(s);
  return (
    Array.isArray(l.nights) &&
    l.nights.every((n) => typeof n.nightOf === "string" && hhmm(n.bed) && hhmm(n.wake)) &&
    hhmm(l.plannedBed) &&
    hhmm(l.plannedWake)
  );
}

// ------------------------------------------------------------------ Forecast

export type Reason = "inertia" | "circadian-low" | "sleep-pressure" | "low-band";

export type EventWarning = {
  event: ScheduleEvent;
  asleep: boolean;
  minutesAfterWake: number | null;
  index: number | null;
  band: Band | null;
  reasons: Reason[];
  message: string;
};

export type Forecast = {
  day: string; // tomorrow, "YYYY-MM-DD"
  points: AlertnessPoint[]; // tomorrow 00:00–24:00, 15-min steps
  bands: Bands | null;
  chronotype: Chronotype;
  bedAt: number;
  wakeAt: number;
  events: ScheduleEvent[]; // tomorrow's events
  warnings: EventWarning[];
  /** Mean waking index tomorrow. */
  meanIndex: number | null;
  shortNights: number; // nights under 5 h in the log
};

const STEP_MINUTES = 15;
/** Display heuristic: inertia warnings for events within this many minutes of waking. */
const INERTIA_WARNING_MINUTES = 60;
/** Display heuristic: label "built-up sleep pressure" after this many hours awake. */
const LONG_DAY_HOURS = 16;

const REASON_TEXT: Record<Reason, string> = {
  inertia: "sleep inertia",
  "circadian-low": "low circadian alertness",
  "sleep-pressure": "built-up sleep pressure",
  "low-band": "a low-alertness window",
};

export function buildForecast(
  log: SleepLog,
  schedule: ScheduleEvent[],
  today: string,
  overrides: { plannedBed?: string } = {},
): Forecast {
  const day = addDays(today, 1);
  const history = log.nights
    .map((n) => nightInstants(n.nightOf, n.bed, n.wake))
    .filter((e): e is SleepEpisode => e !== null);
  const tonight = nightInstants(today, overrides.plannedBed ?? log.plannedBed, log.plannedWake);
  const episodes = tonight ? [...history, tonight] : history;

  const logged: LoggedNight[] = log.nights.map((n) => ({
    bedHour: hourOf(n.bed),
    durationHours: nightHours(n),
    isFreeDay: n.freeDay,
  }));
  const chronotype = estimateChronotype(logged);
  const opts = { clockHour, phaseShiftHours: chronotype.phaseShiftHours };

  const dayStart = atClock(day, "00:00").getTime();
  const dayEnd = atClock(addDays(day, 1), "00:00").getTime();

  // Personal bands from the logged week (first wake-up → tonight's bedtime).
  const weekFrom = history.length ? history[0].end : dayStart;
  const weekTo = tonight ? tonight.start : dayStart;
  const bands = personalBands(simulate(episodes, weekFrom, weekTo, STEP_MINUTES, opts));

  const points = simulate(episodes, dayStart, dayEnd, STEP_MINUTES, opts);
  // Tomorrow's day = from tomorrow's wake-up on (not the late night before tonight's sleep).
  const wakeAt = tonight?.end ?? dayStart;
  const awake = points.filter((p) => !p.asleep && Number.isFinite(p.index) && p.t >= wakeAt);
  const meanIndex = awake.length ? awake.reduce((a, p) => a + p.index, 0) / awake.length : null;

  const events = schedule
    .filter((e) => {
      const s = Date.parse(e.start);
      return s >= dayStart && s < dayEnd;
    })
    .sort((a, b) => a.start.localeCompare(b.start));

  const warnings: EventWarning[] = [];
  for (const event of events) {
    const t = Date.parse(event.start);
    const p = points.reduce(
      (best, q) => (Math.abs(q.t - t) < Math.abs(best.t - t) ? q : best),
      points[0],
    );
    const clock = formatClock(t);
    if (!p || p.asleep) {
      warnings.push({
        event,
        asleep: true,
        minutesAfterWake: null,
        index: null,
        band: null,
        reasons: [],
        message: `${event.title} at ${clock} is during your planned sleep. Move your wake time or the event.`,
      });
      continue;
    }
    const minutesAfterWake = Math.round(p.hoursAwake * 60);
    const band = bands ? bandOf(p.index, bands) : null;
    const reasons: Reason[] = [];
    if (minutesAfterWake < INERTIA_WARNING_MINUTES) reasons.push("inertia");
    if (p.c < 0) reasons.push("circadian-low");
    if (p.hoursAwake >= LONG_DAY_HOURS) reasons.push("sleep-pressure");
    const flagged = reasons.includes("inertia") || band === "low";
    if (!flagged) continue;
    if (band === "low" && reasons.length === 0) reasons.push("low-band");
    const lead = reasons.includes("inertia")
      ? `${event.title} at ${clock} is ${minutesAfterWake} min after waking`
      : `${event.title} at ${clock} lands in a low-alertness window`;
    const why = reasons.filter((r) => r !== "low-band" || !lead.includes("low-alertness"));
    warnings.push({
      event,
      asleep: false,
      minutesAfterWake,
      index: p.index,
      band,
      reasons,
      message: why.length ? `${lead}: ${why.map((r) => REASON_TEXT[r]).join(" + ")}.` : `${lead}.`,
    });
  }

  const shortNights = log.nights.filter((n) => nightHours(n) < 5).length;
  return {
    day,
    points,
    bands,
    chronotype,
    bedAt: tonight?.start ?? dayStart,
    wakeAt: tonight?.end ?? dayStart,
    events,
    warnings,
    meanIndex,
    shortNights,
  };
}

/** Show the gentle support note when most logged nights are under 5 hours. */
export const SHORT_NIGHTS_NOTE_THRESHOLD = 4;
