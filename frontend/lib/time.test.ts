import { describe, expect, it } from "vitest";
import { mulberry32 } from "./random";
import { atClock, clockOf, edmontonDate, edmontonOffset, formatClock } from "./time";

describe("Edmonton time helpers", () => {
  // Alberta's rules changed in Nov 2026 (IANA tzdata 2026f: permanent UTC-6), and devices may
  // carry older or newer data. These tests only use dates every tzdata version agrees on.
  it("uses MST (-07:00) in January 2026", () => {
    expect(edmontonOffset(new Date("2026-01-15T15:00:00Z"))).toBe("-07:00");
  });

  it("uses MDT (-06:00) in summer 2026", () => {
    expect(edmontonOffset(new Date("2026-07-01T15:00:00Z"))).toBe("-06:00");
  });

  it("switches offset across the Mar 8, 2026 spring-forward", () => {
    // 02:00 MST (09:00Z) jumps to 03:00 MDT.
    expect(edmontonOffset(new Date("2026-03-08T08:30:00Z"))).toBe("-07:00");
    expect(edmontonOffset(new Date("2026-03-08T09:30:00Z"))).toBe("-06:00");
  });

  it("round-trips wall-clock times through the device's own rules", () => {
    for (const ymd of ["2026-03-08", "2026-07-01", "2026-12-02"]) {
      expect(clockOf(atClock(ymd, "08:30"))).toBe("08:30");
      expect(edmontonDate(atClock(ymd, "23:45"))).toBe(ymd);
    }
  });

  it("formats clock times the Canadian way", () => {
    expect(formatClock("2026-01-14T08:00:00-07:00")).toBe("8:00 a.m.");
    expect(formatClock("2026-01-14T23:30:00-07:00")).toBe("11:30 p.m.");
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
