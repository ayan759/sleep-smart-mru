import { simulate, type SleepEpisode } from "./alertness";
import { estimateChronotype } from "./chronotype";
import { nightHours, nightInstants, type SleepLog } from "./forecast";
import { courseCodeOf, type ScheduleEvent } from "./schedule";
import { addDays, atClock, clockHour } from "./time";

// ------------------------------------------------------------------ API types (mirror backend)

export type PlanSession = { course_id: string; start: string; end: string };
export type PlanSleep = { night_of: string; bed: string; wake: string; hours: number };
export type PlanOption = {
  kind:
    "start_earlier" | "move_optional" | "reduce_hours" | "raise_daily_cap" | "fix_sleep_conflict";
  label: string;
  course_id?: string | null;
  event_id?: string | null;
  value?: number | string | null;
};
export type PlanResponse = {
  status: "optimal" | "feasible" | "infeasible";
  sessions: PlanSession[];
  sleep: PlanSleep[];
  totals: { course_id: string; planned_hours: number; required_hours: number }[];
  stats: { wake_spread_minutes: number; solve_ms: number };
  infeasibility: null | {
    summary: string;
    shortfalls: { course_id: string; short_hours: number; reason: string }[];
    options: PlanOption[];
  };
};

// ------------------------------------------------------------------ inputs

export type CourseInput = {
  id: string;
  name: string;
  hours: number;
  examEventId: string | null; // from the schedule
  examDate: string; // used when examEventId is null
  examTime: string;
};

export type PlanInputs = {
  startDate: string;
  days: number;
  preferredWake: string;
  targetHours: number;
  driftMinutes: number;
  maxBlockMinutes: number;
  dailyCapHours: number;
  commuteMinutes: number;
  courses: CourseInput[];
  /** Event ids the student is willing to move (the planner may suggest skipping them). */
  optionalIds: string[];
  /** Event ids left out of this plan (e.g. after "move or skip" was applied). */
  skippedIds: string[];
};

export const MAX_DAYS = 14;

export function defaultInputs(today: string, log: SleepLog, schedule: ScheduleEvent[]): PlanInputs {
  const startDate = addDays(today, 1);
  return {
    startDate,
    days: 10,
    preferredWake: log.plannedWake,
    targetHours: 8,
    driftMinutes: 30,
    maxBlockMinutes: 120,
    dailyCapHours: 6,
    commuteMinutes: 0,
    courses: suggestCourses(schedule, startDate, MAX_DAYS),
    optionalIds: schedule.filter((e) => e.optional).map((e) => e.id),
    skippedIds: [],
  };
}

/** One course per upcoming exam in the schedule (name from its course code when present). */
export function suggestCourses(
  schedule: ScheduleEvent[],
  startDate: string,
  days: number,
): CourseInput[] {
  const from = atClock(startDate, "00:00").getTime();
  const to = atClock(addDays(startDate, days), "00:00").getTime();
  return schedule
    .filter((e) => e.type === "exam" && Date.parse(e.start) >= from && Date.parse(e.start) < to)
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((e, i) => ({
      id: `c${i + 1}`,
      name: courseCodeOf(e.title) ?? e.title,
      hours: 6,
      examEventId: e.id,
      examDate: startDate,
      examTime: "09:00",
    }));
}

export function isValidInputs(x: unknown): x is PlanInputs {
  if (!x || typeof x !== "object") return false;
  const p = x as PlanInputs;
  return (
    typeof p.startDate === "string" &&
    typeof p.days === "number" &&
    Array.isArray(p.courses) &&
    Array.isArray(p.optionalIds) &&
    Array.isArray(p.skippedIds)
  );
}

// ------------------------------------------------------------------ request

/** Local midnights (device's view of Calgary time) for days 0..days. */
export function dayStarts(startDate: string, days: number): string[] {
  return Array.from({ length: days + 1 }, (_, d) =>
    atClock(addDays(startDate, d), "00:00").toISOString(),
  );
}

/**
 * Sleep Weather's alertness model across the window, assuming the student sleeps target hours
 * before their preferred wake each night. Sent as per-slot weights (0–100) so the planner
 * prefers sharper hours for study.
 */
export function alertnessWeights(
  inputs: PlanInputs,
  log: SleepLog,
): { start: string; values: number[] } {
  const history = log.nights
    .map((n) => nightInstants(n.nightOf, n.bed, n.wake))
    .filter((e): e is SleepEpisode => e !== null);
  const planned: SleepEpisode[] = [];
  for (let d = -1; d < inputs.days; d++) {
    const wake = atClock(addDays(inputs.startDate, d + 1), inputs.preferredWake).getTime();
    planned.push({ start: wake - inputs.targetHours * 3_600_000, end: wake });
  }
  const chronotype = estimateChronotype(
    log.nights.map((n) => ({
      bedHour: Number(n.bed.slice(0, 2)) + Number(n.bed.slice(3)) / 60,
      durationHours: nightHours(n),
      isFreeDay: n.freeDay,
    })),
  );
  const from = atClock(inputs.startDate, "00:00").getTime();
  const to = atClock(addDays(inputs.startDate, inputs.days), "00:00").getTime();
  const points = simulate([...history, ...planned], from, to, 30, {
    clockHour,
    phaseShiftHours: chronotype.phaseShiftHours,
  });
  return {
    start: new Date(from).toISOString(),
    values: points.map((p) => (Number.isFinite(p.index) ? Math.round(p.index) : 0)),
  };
}

export function buildPlanRequest(inputs: PlanInputs, schedule: ScheduleEvent[], log: SleepLog) {
  const from = atClock(addDays(inputs.startDate, -1), "00:00").getTime();
  const to = atClock(addDays(inputs.startDate, inputs.days + 1), "13:00").getTime();
  const skipped = new Set(inputs.skippedIds);
  const optional = new Set(inputs.optionalIds);
  const events = schedule.filter(
    (e) => !skipped.has(e.id) && Date.parse(e.end) > from && Date.parse(e.start) < to,
  );
  return {
    timezone: "America/Edmonton",
    window: { start_date: inputs.startDate, days: inputs.days },
    day_starts: dayStarts(inputs.startDate, inputs.days),
    slot_minutes: 30,
    sleep: {
      min_hours: 7,
      target_hours: inputs.targetHours,
      preferred_wake: inputs.preferredWake,
      wake_drift_minutes: inputs.driftMinutes,
    },
    study_rules: {
      max_block_minutes: inputs.maxBlockMinutes,
      break_minutes: 30,
      no_study_before_bed_minutes: 60,
      daily_cap_hours: inputs.dailyCapHours,
      commute_buffer_minutes: inputs.commuteMinutes,
    },
    fixed_events: events.map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      start: e.start,
      end: e.end,
      optional: optional.has(e.id),
    })),
    courses: inputs.courses.map((c) => ({
      id: c.id,
      name: c.name || "Course",
      study_hours: c.hours,
      exam_event_id:
        c.examEventId && events.some((e) => e.id === c.examEventId) ? c.examEventId : null,
      exam_start:
        c.examEventId && events.some((e) => e.id === c.examEventId)
          ? null
          : atClock(c.examDate, c.examTime).toISOString(),
    })),
    alertness: { ...alertnessWeights(inputs, log), slot_minutes: 30 },
  };
}

// ------------------------------------------------------------------ calendar export

const icsDate = (iso: string) =>
  new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
const icsText = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function planToIcs(
  plan: PlanResponse,
  courseName: (id: string) => string,
  options: { includeSleep: boolean; now?: Date },
): string {
  const stamp = icsDate((options.now ?? new Date()).toISOString());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sleep Smart MRU//Exam-crunch planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  const add = (uid: string, start: string, end: string, summary: string, description: string) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}@sleep-smart-mru`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${icsText(summary)}`,
      `DESCRIPTION:${icsText(description)}`,
      "END:VEVENT",
    );
  };
  for (const s of plan.sessions) {
    add(
      `study-${s.course_id}-${icsDate(s.start)}`,
      s.start,
      s.end,
      `Study: ${courseName(s.course_id)}`,
      "Planned by Sleep Smart MRU. Take a break after this block.",
    );
  }
  if (options.includeSleep) {
    for (const b of plan.sleep) {
      add(
        `sleep-${b.night_of}`,
        b.bed,
        b.wake,
        "Sleep (protected)",
        `${b.hours} h of sleep. Lights out on time.`,
      );
    }
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export function googleCalendarLink(
  title: string,
  start: string,
  end: string,
  details: string,
): string {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${icsDate(start)}/${icsDate(end)}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
