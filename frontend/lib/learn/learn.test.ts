import { describe, expect, it } from "vitest";
import { HALF_LIFE_H, remainingAt, toTimelineMin } from "./caffeine";
import { BAD_HABITS, GOOD_HABITS, QUIZ } from "./habits";
import { EXAMPLE_NIGHT, NIGHT_MINUTES, minutesLostAfter } from "./night";
import { STUDIES, TOPICS, studyById } from "./studies";

describe("research library", () => {
  it("has unique ids, https links and a known topic on every study", () => {
    const ids = new Set<string>();
    const topics = new Set(TOPICS.map((t) => t.id));
    for (const s of STUDIES) {
      expect(ids.has(s.id)).toBe(false);
      ids.add(s.id);
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.topics.length).toBeGreaterThan(0);
      for (const t of s.topics) expect(topics.has(t)).toBe(true);
    }
    expect(STUDIES.length).toBeGreaterThanOrEqual(20);
  });

  it("every habit and quiz answer cites a study in the library", () => {
    for (const item of [...GOOD_HABITS, ...BAD_HABITS, ...QUIZ]) {
      expect(item.sources.length).toBeGreaterThan(0);
      for (const id of item.sources) expect(studyById(id), id).toBeDefined();
    }
  });
});

describe("caffeine model", () => {
  it("halves every half-life", () => {
    const intake = [{ mg: 200, atMin: 0 }];
    expect(remainingAt(intake, 0, HALF_LIFE_H.typical)).toBe(200);
    expect(remainingAt(intake, 5 * 60, HALF_LIFE_H.typical)).toBeCloseTo(100, 6);
    expect(remainingAt(intake, 10 * 60, HALF_LIFE_H.typical)).toBeCloseTo(50, 6);
  });

  it("adds drinks and ignores ones not yet had", () => {
    const intakes = [
      { mg: 100, atMin: 0 },
      { mg: 100, atMin: 300 },
    ];
    expect(remainingAt(intakes, 299, 5)).toBeLessThan(100);
    expect(remainingAt(intakes, 300, 5)).toBeCloseTo(150, 6);
  });

  it("places times on a 6 a.m. to 6 a.m. timeline", () => {
    expect(toTimelineMin("06:00")).toBe(0);
    expect(toTimelineMin("15:00")).toBe(540);
    expect(toTimelineMin("23:30")).toBe(1050);
    expect(toTimelineMin("01:00")).toBe(1140);
  });
});

describe("example night", () => {
  it("is 8 hours long and cycles through REM several times", () => {
    expect(NIGHT_MINUTES).toBe(480);
    expect(EXAMPLE_NIGHT.filter(([s]) => s === "rem").length).toBeGreaterThanOrEqual(4);
  });

  it("shows that an early alarm costs mostly REM, not deep sleep", () => {
    const lost = minutesLostAfter(360); // alarm at 5 a.m. instead of 7 a.m.
    expect(lost.rem).toBeGreaterThan(lost.n3);
    expect(minutesLostAfter(NIGHT_MINUTES).rem).toBe(0);
  });
});
