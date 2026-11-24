import { describe, expect, it } from "vitest";
import { defaultSleepLog } from "./forecast";
import {
  buildPlanRequest,
  dayStarts,
  defaultInputs,
  googleCalendarLink,
  planToIcs,
  suggestCourses,
  type PlanResponse,
} from "./plan";
import type { ScheduleEvent } from "./schedule";
import { atClock } from "./time";

const TODAY = "2026-12-01";
const ev = (
  id: string,
  title: string,
  type: ScheduleEvent["type"],
  ymd: string,
  s: string,
  e: string,
): ScheduleEvent => ({
  id,
  title,
  type,
  start: atClock(ymd, s).toISOString(),
  end: atClock(ymd, e).toISOString(),
  source: "manual",
});
const schedule = [
  ev("ex1", "COMP2631 Final Exam", "exam", "2026-12-08", "09:00", "12:00"),
  ev("ex2", "PSYC 1105 Final", "exam", "2026-12-10", "13:00", "15:00"),
  ev("lec", "COMP 2631 Lecture", "class", "2026-12-03", "08:30", "09:50"),
  ev("old", "Old exam", "exam", "2026-11-20", "09:00", "10:00"),
];

describe("plan inputs", () => {
  it("suggests one course per upcoming exam, named by course code", () => {
    const courses = suggestCourses(schedule, "2026-12-02", 14);
    expect(courses.map((c) => c.name)).toEqual(["COMP 2631", "PSYC 1105"]);
    expect(courses[0].examEventId).toBe("ex1");
  });

  it("builds a request with device day starts, events in range and alertness weights", () => {
    const log = defaultSleepLog(TODAY);
    const inputs = { ...defaultInputs(TODAY, log, schedule), days: 9 };
    const req = buildPlanRequest(inputs, schedule, log);
    expect(req.day_starts).toHaveLength(10);
    expect(req.day_starts).toEqual(dayStarts("2026-12-02", 9));
    expect(req.sleep.min_hours).toBe(7);
    expect(req.fixed_events.map((e) => e.id)).not.toContain("old");
    expect(req.courses[0]).toMatchObject({
      name: "COMP 2631",
      exam_event_id: "ex1",
      exam_start: null,
    });
    expect(req.alertness.values).toHaveLength(9 * 48);
    expect(Math.max(...req.alertness.values)).toBeLessThanOrEqual(100);
  });

  it("leaves skipped events out of the request", () => {
    const log = defaultSleepLog(TODAY);
    const inputs = { ...defaultInputs(TODAY, log, schedule), skippedIds: ["lec"] };
    expect(buildPlanRequest(inputs, schedule, log).fixed_events.map((e) => e.id)).not.toContain(
      "lec",
    );
  });
});

const plan: PlanResponse = {
  status: "optimal",
  sessions: [
    { course_id: "c1", start: "2026-12-02T17:00:00.000Z", end: "2026-12-02T18:30:00.000Z" },
  ],
  sleep: [
    {
      night_of: "2026-12-02",
      bed: "2026-12-03T05:30:00.000Z",
      wake: "2026-12-03T13:30:00.000Z",
      hours: 8,
    },
  ],
  totals: [],
  stats: { wake_spread_minutes: 0, solve_ms: 100 },
  infeasibility: null,
};

describe("calendar export", () => {
  it("writes a valid VCALENDAR with UTC times and escaped text", () => {
    const ics = planToIcs(plan, () => "COMP 2631, Algorithms", {
      includeSleep: true,
      now: new Date("2026-12-01T00:00:00Z"),
    });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20261202T170000Z");
    expect(ics).toContain("SUMMARY:Study: COMP 2631\\, Algorithms");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    const noSleep = planToIcs(plan, () => "X", { includeSleep: false });
    expect(noSleep.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  });

  it("builds Google Calendar links", () => {
    const url = new URL(
      googleCalendarLink(
        "Study: COMP 2631",
        plan.sessions[0].start,
        plan.sessions[0].end,
        "Planned",
      ),
    );
    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("dates")).toBe("20261202T170000Z/20261202T183000Z");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
  });
});
