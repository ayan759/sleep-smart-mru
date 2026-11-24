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

/** Milky Way band: from low on the left up toward the top-middle, away from the moon. */
const BAND = { x0: -0.05, y0: 0.9, x1: 0.48, y1: -0.05, halfWidth: 0.16 };

function bandDistance(x: number, y: number, aspect: number): number {
  const dx = (BAND.x1 - BAND.x0) * aspect;
  const dy = BAND.y1 - BAND.y0;
  const len = Math.hypot(dx, dy);
  return ((x - BAND.x0) * aspect * dy - (y - BAND.y0) * dx) / len;
}

function drawSky(canvas: HTMLCanvasElement, width: number, height: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const aspect = width / height;
  const { fbm3 } = createNoise3(7);

  // 1) Milky Way glow, computed at low resolution (it is diffuse) and scaled up smoothly.
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
        const x = px / lw;
        const y = py / lh;
        const d = bandDistance(x, y, aspect) / BAND.halfWidth;
        const clouds = 0.55 + 0.45 * fbm3(x * 5 * aspect, y * 5, 0.3, 5);
        let glow = Math.exp(-d * d * 1.6) * clouds;
        // Dark dust lane wandering along the band's spine.
        const laneOffset = 0.18 * fbm3(x * 3 * aspect, y * 3, 4.1, 3);
        const lane = Math.exp(-(((d - laneOffset) / 0.22) ** 2));
        glow *= 1 - 0.6 * lane * (0.6 + 0.4 * fbm3(x * 9 * aspect, y * 9, 8.7, 3));
        // Warmer toward the horizon (where the galactic core would sit), cooler up high.
        const warm = Math.min(1, Math.max(0, y * 1.2 - 0.1));
        const i = (py * lw + px) * 4;
        img.data[i] = 170 + 70 * warm;
        img.data[i + 1] = 170 + 35 * warm;
        img.data[i + 2] = 235 - 50 * warm;
        img.data[i + 3] = Math.max(0, Math.min(255, glow * 255 * 0.42));
      }
    }
    lctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(low, 0, 0, width, height);
  }

  // 2) Thousands of faint stars, denser inside the Milky Way, washed out near the moon.
  const rand = mulberry32(31337);
  const count = Math.min(6000, Math.round((width * height) / 55));
  const moonX = MOON_CENTER.x * width;
  const moonY = MOON_CENTER.y * height;
  const moonWash = Math.min(width, height) * 0.42;

  for (let s = 0; s < count; s++) {
    let x: number;
    let y: number;
    if (rand() < 0.45) {
      // Sample across the band with a gaussian-ish offset.
      const t = rand();
      const off = (rand() + rand() + rand() - 1.5) * BAND.halfWidth * 0.9;
      const bx = BAND.x0 + (BAND.x1 - BAND.x0) * t;
      const by = BAND.y0 + (BAND.y1 - BAND.y0) * t;
      x = (bx + off * 0.7) * width;
      y = (by + off * 0.7) * height;
    } else {
      x = rand() * width;
      y = rand() * height;
    }
    const brightness = 0.1 + 0.9 * Math.pow(rand(), 9);
    const radius = 0.22 + brightness * 0.8;
    const [r, g, b] = pickColour(rand());
    const wash = Math.min(1, Math.hypot(x - moonX, y - moonY) / moonWash);
    const alpha = Math.min(1, (0.12 + brightness) * (0.2 + 0.8 * wash * wash));
    if (alpha < 0.03) continue;

    if (brightness > 0.6) {
      const halo = ctx.createRadialGradient(x, y, 0, x, y, radius * 3.5);
      halo.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.35})`);
      halo.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = halo;
      ctx.fillRect(x - radius * 3.5, y - radius * 3.5, radius * 7, radius * 7);
    }
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Static, seeded star field + Milky Way, drawn once per size (no animation loop). */
export function StarCanvas() {
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
      drawSky(canvas, width, height);
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
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-1000 data-[ready=true]:opacity-100"
    />
  );
}
