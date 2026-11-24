import { describe, expect, it } from "vitest";
import { mulberry32 } from "./random";
import { edmontonOffset, formatClock } from "./time";

describe("Edmonton time helpers", () => {
  it("uses MST (-07:00) in late November", () => {
    expect(edmontonOffset(new Date("2026-11-24T15:00:00Z"))).toBe("-07:00");
  });

  it("uses MDT (-06:00) in summer", () => {
    expect(edmontonOffset(new Date("2026-07-01T15:00:00Z"))).toBe("-06:00");
  });

  it("switches offset across the Nov 1, 2026 DST change", () => {
    // DST ends 2026-11-01 at 02:00 local (08:00Z): before = MDT, after = MST.
    expect(edmontonOffset(new Date("2026-11-01T07:30:00Z"))).toBe("-06:00");
    expect(edmontonOffset(new Date("2026-11-01T09:30:00Z"))).toBe("-07:00");
  });

  it("formats clock times the Canadian way", () => {
    expect(formatClock("2026-12-02T08:00:00-07:00")).toBe("8:00 a.m.");
    expect(formatClock("2026-12-02T23:30:00-07:00")).toBe("11:30 p.m.");
  });
});

describe("mulberry32", () => {
  it("is deterministic for a seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const runA = Array.from({ length: 5 }, a);
    const runB = Array.from({ length: 5 }, b);
    expect(runA).toEqual(runB);
    runA.forEach((n) => expect(n).toBeGreaterThanOrEqual(0));
    runA.forEach((n) => expect(n).toBeLessThan(1));
  });
});
