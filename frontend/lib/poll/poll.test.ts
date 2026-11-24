import { describe, expect, it } from "vitest";
import { aggregate } from "./aggregate";
import { DEMO_SIZE, generateDemoResponses } from "./demo";
import { MIN_GROUP_SIZE, POLL_ID } from "./options";
import { deviceHash, ipBucket, safeEqual } from "./privacy";
import { validateSubmission, type PollAnswers } from "./validate";

const base = {
  pollId: POLL_ID,
  token: "3f2c8a9e-1b7d-4c55-9a10-2d6e7f8b9c01",
  barriers: ["assignments", "screens"],
  topBarrier: "screens",
  supports: ["quiet_spaces"],
};

describe("validateSubmission", () => {
  it("accepts a valid minimal answer and fills optional fields with null", () => {
    const r = validateSubmission(base);
    expect(r.ok).toBe(true);
    if (r.ok)
      expect(r.answers).toEqual({
        barriers: ["assignments", "screens"],
        topBarrier: "screens",
        supports: ["quiet_spaces"],
        yearOfStudy: null,
        faculty: null,
        sleepBucket: null,
      });
  });

  it("rejects more than 3 barriers, more than 2 supports, and unknown ids", () => {
    expect(
      validateSubmission({
        ...base,
        barriers: ["exams", "stress", "commute", "noise"],
        topBarrier: "exams",
      }).ok,
    ).toBe(false);
    expect(
      validateSubmission({ ...base, supports: ["posters", "workshops", "quiet_spaces"] }).ok,
    ).toBe(false);
    expect(
      validateSubmission({
        ...base,
        barriers: ["my roommate Kevin"],
        topBarrier: "my roommate Kevin",
      }).ok,
    ).toBe(false);
  });

  it("requires the top barrier to be one of the chosen barriers", () => {
    const r = validateSubmission({ ...base, topBarrier: "exams" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.topBarrier).toBeDefined();
  });

  it("rejects free text in optional fields, a bad token and the wrong poll", () => {
    expect(validateSubmission({ ...base, faculty: "Faculty of Me" }).ok).toBe(false);
    expect(validateSubmission({ ...base, token: "short" }).ok).toBe(false);
    expect(validateSubmission({ ...base, pollId: "other" }).ok).toBe(false);
    expect(validateSubmission("nope").ok).toBe(false);
  });

  it("de-duplicates repeated picks", () => {
    const r = validateSubmission({ ...base, barriers: ["screens", "screens"] });
    expect(r.ok && r.answers.barriers).toEqual(["screens"]);
  });
});

const answer = (p: Partial<PollAnswers>): PollAnswers => ({
  barriers: ["assignments"],
  topBarrier: "assignments",
  supports: ["posters"],
  yearOfStudy: null,
  faculty: null,
  sleepBucket: null,
  ...p,
});

describe("aggregate", () => {
  it("ranks barriers by % of respondents (multi-select can exceed 100% in total)", () => {
    const rows = [
      answer({ barriers: ["assignments", "screens"], topBarrier: "screens" }),
      answer({ barriers: ["screens"], topBarrier: "screens" }),
      answer({ barriers: ["exams"], topBarrier: "exams" }),
      answer({ barriers: ["screens", "exams"], topBarrier: "exams" }),
    ];
    const r = aggregate(rows, "live");
    expect(r.total).toBe(4);
    expect(r.barriers[0]).toMatchObject({ id: "screens", count: 3, pct: 75 });
    expect(r.topBarrier.map((s) => s.id)).toEqual(["exams", "screens"]);
  });

  it(`hides year and faculty groups with fewer than ${MIN_GROUP_SIZE} respondents`, () => {
    const rows = [
      ...Array.from({ length: MIN_GROUP_SIZE }, () =>
        answer({ yearOfStudy: "1", faculty: "arts" }),
      ),
      ...Array.from({ length: MIN_GROUP_SIZE - 1 }, () =>
        answer({ yearOfStudy: "2", faculty: "science_tech" }),
      ),
    ];
    const r = aggregate(rows, "live");
    expect(r.byYear.map((g) => g.id)).toEqual(["1"]);
    expect(r.byFaculty.map((g) => g.id)).toEqual(["arts"]);
    expect(r.byYear[0].n).toBe(MIN_GROUP_SIZE);
  });

  it("returns empty results for no responses", () => {
    const r = aggregate([], "demo");
    expect(r).toMatchObject({ total: 0, barriers: [], byYear: [], dataset: "demo" });
  });
});

describe("demo data", () => {
  it("is deterministic and every row passes validation", () => {
    const a = generateDemoResponses();
    expect(a).toEqual(generateDemoResponses());
    expect(a).toHaveLength(DEMO_SIZE);
    for (const row of a) {
      const r = validateSubmission({ pollId: POLL_ID, token: "demo-token-0000000000", ...row });
      expect(r.ok).toBe(true);
    }
  });
});

describe("privacy helpers", () => {
  it("hashes device tokens per poll, irreversibly and stably", () => {
    const h = deviceHash(POLL_ID, base.token);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).toBe(deviceHash(POLL_ID, base.token));
    expect(h).not.toBe(deviceHash("another-poll", base.token));
    expect(h).not.toContain(base.token);
  });

  it("buckets IPs with a key that rotates daily", () => {
    const d1 = new Date("2026-12-01T18:00:00Z");
    const d2 = new Date("2026-12-02T18:00:00Z");
    expect(ipBucket("203.0.113.7", "secret", d1)).toBe(ipBucket("203.0.113.7", "secret", d1));
    expect(ipBucket("203.0.113.7", "secret", d1)).not.toBe(ipBucket("203.0.113.7", "secret", d2));
    expect(ipBucket("203.0.113.7", "secret", d1)).not.toContain("203");
  });

  it("compares passcodes", () => {
    expect(safeEqual("correct horse", "correct horse")).toBe(true);
    expect(safeEqual("correct horse", "correct hors")).toBe(false);
  });
});
