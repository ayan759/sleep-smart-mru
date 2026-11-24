"use client";

import { useEffect, useRef } from "react";
import { createNoise3 } from "@/lib/noise";
import { mulberry32 } from "@/lib/random";
import { MOON_CENTER } from "@/lib/sky";

// Real star colours by temperature: blue-white, white, yellow-white, orange (rare).
const STAR_COLOURS: [number, number, number][] = [
  [202, 215, 255],
  [248, 247, 255],
  [255, 241, 218],
  [255, 210, 161],
];
const pickColour = (u: number) => STAR_COLOURS[u < 0.3 ? 0 : u < 0.78 ? 1 : u < 0.95 ? 2 : 3];
const TAU = Math.PI * 2;

/** Static layout: Milky Way from low on the left up toward the top-middle, away from the moon. */
const BAND = { x0: -0.05, y0: 0.9, x1: 0.48, y1: -0.05, halfWidth: 0.16 };

function bandDistance(x: number, y: number, aspect: number): number {
  const dx = (BAND.x1 - BAND.x0) * aspect;
  const dy = BAND.y1 - BAND.y0;
  const len = Math.hypot(dx, dy);
  return ((x - BAND.x0) * aspect * dy - (y - BAND.y0) * dx) / len;
}

/** Looping layout: the band's centre follows one full wave across the tile, so it wraps. */
const loopBandCentre = (u: number) => 0.42 + 0.2 * Math.sin(TAU * u + 0.6);
const LOOP_HALF_WIDTH = 0.15;

type Glow = { r: number; g: number; b: number; a: number };

function milkyWay(width: number, height: number, loop: boolean): (x: number, y: number) => Glow {
  const aspect = width / height;
  const { fbm3 } = createNoise3(7);
  const colour = (glow: number, y: number): Glow => {
    // Warmer toward the horizon (where the galactic core would sit), cooler up high.
    const warm = Math.min(1, Math.max(0, y * 1.2 - 0.1));
    return { r: 170 + 70 * warm, g: 170 + 35 * warm, b: 235 - 50 * warm, a: glow * 0.42 };
  };
  if (!loop) {
    return (x, y) => {
      const d = bandDistance(x, y, aspect) / BAND.halfWidth;
      const clouds = 0.55 + 0.45 * fbm3(x * 5 * aspect, y * 5, 0.3, 5);
      let glow = Math.exp(-d * d * 1.6) * clouds;
      const laneOffset = 0.18 * fbm3(x * 3 * aspect, y * 3, 4.1, 3);
      const lane = Math.exp(-(((d - laneOffset) / 0.22) ** 2));
      glow *= 1 - 0.6 * lane * (0.6 + 0.4 * fbm3(x * 9 * aspect, y * 9, 8.7, 3));
      return colour(glow, y);
    };
  }
  // Periodic in x: sample noise on a circle so x = 0 and x = 1 are the same point.
  const ring = (u: number, freq: number) => {
    const k = (freq * aspect) / TAU;
    return [Math.cos(TAU * u) * k, Math.sin(TAU * u) * k] as const;
  };
  return (u, y) => {
    const d = (y - loopBandCentre(u)) / LOOP_HALF_WIDTH;
    const [a5, b5] = ring(u, 5);
    const [a3, b3] = ring(u, 3);
    const [a9, b9] = ring(u, 9);
    const clouds = 0.55 + 0.45 * fbm3(a5, b5, y * 5, 5);
    let glow = Math.exp(-d * d * 1.6) * clouds;
    const laneOffset = 0.18 * fbm3(a3, b3, y * 3 + 4.1, 3);
    const lane = Math.exp(-(((d - laneOffset) / 0.22) ** 2));
    glow *= 1 - 0.6 * lane * (0.6 + 0.4 * fbm3(a9, b9, y * 9 + 8.7, 3));
    return colour(glow, y);
  };
}

/** Draw one sky into ctx over [0, width) × [0, height). In loop mode it tiles horizontally. */
function paintSky(ctx: CanvasRenderingContext2D, width: number, height: number, loop: boolean) {
  // 1) Milky Way glow, computed at low resolution (it is diffuse) and scaled up smoothly.
  const glowAt = milkyWay(width, height, loop);
  const lw = Math.max(32, Math.round(width / 3));
  const lh = Math.max(32, Math.round(height / 3));
  const low = document.createElement("canvas");
  low.width = lw;
  low.height = lh;
  const lctx = low.getContext("2d");
  if (lctx) {
    const img = lctx.createImageData(lw, lh);
    for (let py = 0; py < lh; py++) {
      for (let px = 0; px < lw; px++) {
        const g = glowAt(px / lw, py / lh);
        const i = (py * lw + px) * 4;
        img.data[i] = g.r;
        img.data[i + 1] = g.g;
        img.data[i + 2] = g.b;
        img.data[i + 3] = Math.max(0, Math.min(255, g.a * 255));
      }
    }
    lctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(low, 0, 0, width, height);
  }

  // 2) Thousands of faint stars, denser inside the Milky Way. In the static layout they're
  // washed out near the moon; the looping layout leaves that to a fixed overlay by the moon.
  const rand = mulberry32(31337);
  const count = Math.min(6000, Math.round((width * height) / 55));
  const moonX = MOON_CENTER.x * width;
  const moonY = MOON_CENTER.y * height;
  const moonWash = Math.min(width, height) * 0.42;

  for (let s = 0; s < count; s++) {
    let x: number;
    let y: number;
    if (rand() < 0.45) {
      const t = rand();
      const off = (rand() + rand() + rand() - 1.5) * 0.9;
      if (loop) {
        x = t * width;
        y = (loopBandCentre(t) + off * LOOP_HALF_WIDTH * 0.7) * height;
      } else {
        const bx = BAND.x0 + (BAND.x1 - BAND.x0) * t;
        const by = BAND.y0 + (BAND.y1 - BAND.y0) * t;
        x = (bx + off * BAND.halfWidth * 0.7) * width;
        y = (by + off * BAND.halfWidth * 0.7) * height;
      }
    } else {
      x = rand() * width;
      y = rand() * height;
    }
    const brightness = 0.1 + 0.9 * Math.pow(rand(), 9);
    const radius = 0.22 + brightness * 0.8;
    const [r, g, b] = pickColour(rand());
    const wash = loop ? 1 : Math.min(1, Math.hypot(x - moonX, y - moonY) / moonWash);
    const alpha = Math.min(1, (0.12 + brightness) * (0.2 + 0.8 * wash * wash));
    if (alpha < 0.03) continue;

    // In loop mode, stars near an edge are also drawn wrapped onto the other side.
    const reach = radius * 4;
    const copies = loop
      ? [x, ...(x < reach ? [x + width] : []), ...(x > width - reach ? [x - width] : [])]
      : [x];
    for (const cx of copies) {
      if (brightness > 0.6) {
        const halo = ctx.createRadialGradient(cx, y, 0, cx, y, radius * 3.5);
        halo.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.35})`);
        halo.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = halo;
        ctx.fillRect(cx - radius * 3.5, y - radius * 3.5, radius * 7, radius * 7);
      }
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.beginPath();
      ctx.arc(cx, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawSky(canvas: HTMLCanvasElement, width: number, height: number, loop: boolean) {
  // The looping canvas is two tiles wide, so cap its resolution a little lower.
  const dpr = Math.min(window.devicePixelRatio || 1, loop ? 1.5 : 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  if (!loop) {
    paintSky(ctx, width, height, false);
    return;
  }
  // Paint one seamless tile, then place it twice side by side.
  const tileW = width / 2;
  const tile = document.createElement("canvas");
  tile.width = Math.round(tileW * dpr);
  tile.height = canvas.height;
  const tctx = tile.getContext("2d");
  if (!tctx) return;
  tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  paintSky(tctx, tileW, height, true);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(tile, 0, 0);
  ctx.drawImage(tile, tile.width, 0);
}

/**
 * Seeded star field + Milky Way, drawn once per size (no animation loop).
 * With `loop`, the parent is two tiles wide and the sky repeats seamlessly so a CSS animation
 * can slide it forever.
 */
export function StarCanvas({ loop = false }: { loop?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    let lastW = 0;
    let lastH = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const draw = (width: number, height: number) => {
      // Mobile URL bars change height constantly; only redraw on real size changes.
      if (Math.abs(width - lastW) < 2 && Math.abs(height - lastH) < 80) return;
      lastW = width;
      lastH = height;
      drawSky(canvas, width, height, loop);
      canvas.dataset.ready = "true";
    };

    const rect = parent.getBoundingClientRect();
    draw(rect.width, rect.height);

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      clearTimeout(timer);
      timer = setTimeout(() => draw(width, height), 150);
    });
    observer.observe(parent);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [loop]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-1000 data-[ready=true]:opacity-100"
    />
  );
}
