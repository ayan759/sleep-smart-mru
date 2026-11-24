import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { importIcs } from "./ics-import";
import { courseCodeOf, guessEventType } from "./schedule";
import { formatClock } from "./time";

const fixture = (name: string) =>
  readFileSync(path.join(import.meta.dirname, "..", "tests", "fixtures", name), "utf8");

describe("importIcs", () => {
  const from = new Date("2026-11-23T00:00:00-07:00");
  const to = new Date("2026-12-10T00:00:00-07:00");

  it("expands a weekly RRULE class into occurrences inside the window", () => {
    const { events, skippedAllDay } = importIcs(
      fixture("weekly-class-with-vtimezone.ics"),
      from,
      to,
    );
    const lectures = events.filter((e) => e.title === "COMP 2631 Lecture");
    // Tue/Thu from Nov 24 through Dec 8: Nov 24, 26, Dec 1, 3, 8 = 5.
    expect(lectures).toHaveLength(5);
    expect(skippedAllDay).toBe(1);
    expect(lectures.every((e) => e.type === "class")).toBe(true);
  });

  it("keeps 8:30 a.m. local across the Nov 1 DST change (MDT → MST)", () => {
    const wide = importIcs(
      fixture("weekly-class-with-vtimezone.ics"),
      new Date("2026-10-26T00:00:00-06:00"),
      to,
    ).events.filter((e) => e.title === "COMP 2631 Lecture");
    const beforeDst = wide.find((e) => e.start.startsWith("2026-10-27"));
    const afterDst = wide.find((e) => e.start.startsWith("2026-11-03"));
    expect(beforeDst?.start).toBe("2026-10-27T14:30:00.000Z"); // 08:30 MDT (-06:00)
    expect(afterDst?.start).toBe("2026-11-03T15:30:00.000Z"); // 08:30 MST (-07:00)
    expect(formatClock(beforeDst!.start)).toBe("8:30 a.m.");
    expect(formatClock(afterDst!.start)).toBe("8:30 a.m.");
  });

  it("detects exams", () => {
    const { events } = importIcs(fixture("weekly-class-with-vtimezone.ics"), from, to);
    const midterm = events.find((e) => e.title === "COMP 2631 Midterm");
    expect(midterm?.type).toBe("exam");
    expect(midterm?.start).toBe("2026-12-02T15:00:00.000Z"); // 8:00 a.m. MST
  });

  it("reads floating times and undefined TZIDs as Calgary time, and honours UTC", () => {
    const { events } = importIcs(fixture("floating-and-utc.ics"), from, to);
    const shift = events.find((e) => e.title === "Work shift");
    const exam = events.find((e) => e.title === "PSYC 1105 Final Exam");
    const group = events.find((e) => e.title === "Study group");
    expect(shift?.start).toBe("2026-12-04T00:00:00.000Z"); // Dec 3 17:00 MST
    expect(shift?.type).toBe("work");
    expect(exam?.start).toBe("2026-12-09T16:00:00.000Z");
    expect(exam?.type).toBe("exam");
    expect(group?.start).toBe("2026-12-05T02:00:00.000Z"); // Dec 4 19:00 MST
  });

  it("parses course codes", () => {
    expect(courseCodeOf("COMP2631 - Lecture")).toBe("COMP 2631");
    expect(guessEventType("Morning shift at Safeway")).toBe("work");
    expect(guessEventType("Coffee with Sam")).toBe("other");
  });
});
