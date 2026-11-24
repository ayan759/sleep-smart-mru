import { describe, expect, it } from "vitest";
import { estimateChronotype, midSleep } from "./chronotype";
import {
  buildForecast,
  defaultSleepLog,
  nightHours,
  nightInstants,
  type SleepLog,
} from "./forecast";
import type { ScheduleEvent } from "./schedule";
import { atClock, formatClock } from "./time";

const TODAY = "2026-12-01"; // Tuesday; forecast is for Wed Dec 2

const event = (
  title: string,
  ymd: string,
  start: string,
  end: string,
  type: ScheduleEvent["type"],
) => ({
  id: title,
  title,
  type,
  start: atClock(ymd, start).toISOString(),
  end: atClock(ymd, end).toISOString(),
  source: "manual" as const,
});

describe("sleep log", () => {
  it("treats bedtimes after midnight as the next calendar day", () => {
    expect(nightHours({ nightOf: TODAY, bed: "23:30", wake: "07:30" })).toBe(8);
    expect(nightHours({ nightOf: TODAY, bed: "01:00", wake: "07:30" })).toBe(6.5);
    expect(nightInstants(TODAY, "08:00", "07:00")).toBeNull();
  });

  it("defaults to 7 example nights before tonight, with weekend lie-ins", () => {
    const log = defaultSleepLog(TODAY);
    expect(log.nights).toHaveLength(7);
    expect(log.nights[6].nightOf).toBe("2026-11-30");
    expect(log.nights.filter((n) => n.freeDay)).toHaveLength(2); // Fri + Sat nights
    expect(log.edited).toBe(false);
  });
});

describe("chronotype", () => {
  it("computes mid-sleep across midnight", () => {
    expect(midSleep({ bedHour: 23, durationHours: 8, isFreeDay: false })).toBe(27);
    expect(midSleep({ bedHour: 1, durationHours: 8, isFreeDay: true })).toBe(29);
  });

  it("shifts later for later free-day sleep and does nothing for a 23:00–07:00 sleeper", () => {
    const early = estimateChronotype([{ bedHour: 23, durationHours: 8, isFreeDay: false }]);
    expect(early.phaseShiftHours).toBe(0);
    const late = estimateChronotype([
      { bedHour: 23, durationHours: 8, isFreeDay: false },
      { bedHour: 2, durationHours: 9, isFreeDay: true },
    ]);
    expect(late.basis).toBe("free-days-corrected");
    expect(late.phaseShiftHours).toBeGreaterThan(2);
  });
});

describe("buildForecast", () => {
  const log: SleepLog = { ...defaultSleepLog(TODAY), plannedBed: "23:30", plannedWake: "07:30" };

  it("returns 96 quarter-hour points for tomorrow", () => {
    const f = buildForecast(log, [], TODAY);
    expect(f.day).toBe("2026-12-02");
    expect(f.points).toHaveLength(96);
    expect(f.bands).not.toBeNull();
    expect(formatClock(f.wakeAt)).toBe("7:30 a.m.");
  });

  it("warns about an 8:00 a.m. midterm 30 minutes after waking", () => {
    const midterm = event("COMP 2631 midterm", "2026-12-02", "08:00", "09:30", "exam");
    const f = buildForecast(log, [midterm], TODAY);
    expect(f.warnings).toHaveLength(1);
    expect(f.warnings[0].reasons).toContain("inertia");
    expect(f.warnings[0].reasons).toContain("circadian-low");
    expect(f.warnings[0].message).toBe(
      "COMP 2631 midterm at 8:00 a.m. is 30 min after waking: sleep inertia + low circadian alertness.",
    );
  });

  it("flags events during planned sleep and ignores other days", () => {
    const early = event("Gym", "2026-12-02", "06:00", "07:00", "other");
    const nextWeek = event("Later", "2026-12-08", "08:00", "09:00", "class");
    const f = buildForecast(log, [early, nextWeek], TODAY);
    expect(f.events).toHaveLength(1);
    expect(f.warnings[0].asleep).toBe(true);
  });

  it("a later bedtime tonight lowers tomorrow's mean alertness", () => {
    const early = buildForecast(log, [], TODAY, { plannedBed: "23:30" });
    const late = buildForecast(log, [], TODAY, { plannedBed: "02:00" });
    expect(late.meanIndex!).toBeLessThan(early.meanIndex!);
  });

  it("counts nights under 5 hours", () => {
    const tired: SleepLog = {
      ...log,
      nights: log.nights.map((n) => ({ ...n, bed: "03:00", wake: "07:00" })),
    };
    expect(buildForecast(tired, [], TODAY).shortNights).toBe(7);
  });
});
