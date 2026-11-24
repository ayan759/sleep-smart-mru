import { describe, expect, it } from "vitest";
import { createNoise3 } from "./noise";

describe("createNoise3", () => {
  it("is deterministic for a seed, so the sky and moon render identically every time", () => {
    const a = createNoise3(7);
    const b = createNoise3(7);
    const points = [
      [0.1, 0.2, 0.3],
      [4.7, 1.1, 9.9],
      [12.5, 3.25, 0.75],
    ] as const;
    for (const [x, y, z] of points) {
      expect(a.fbm3(x, y, z)).toBe(b.fbm3(x, y, z));
    }
  });

  it("stays roughly within [-1, 1]", () => {
    const { noise3, fbm3 } = createNoise3(1969);
    for (let i = 0; i < 500; i++) {
      const x = i * 0.137;
      expect(Math.abs(noise3(x, x * 0.5, x * 0.25))).toBeLessThanOrEqual(1.01);
      expect(Math.abs(fbm3(x, x * 0.3, 1))).toBeLessThanOrEqual(1.01);
    }
  });
});
