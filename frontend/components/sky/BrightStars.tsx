import type { CSSProperties } from "react";
import { mulberry32 } from "@/lib/random";
import { MOON_CENTER } from "@/lib/sky";

type BrightStar = {
  x: number; // % of scene width
  y: number; // % of scene height
  size: number; // core size, px
  colour: string;
  spikes: boolean;
  delay: number; // ms
  duration: number; // ms
};

const COLOURS = ["202 215 255", "248 247 255", "255 241 218", "255 214 170"];

/**
 * A handful of bright stars as DOM elements, so they can glow with real soft light and
 * scintillate gently via CSS (no JS loop). Deterministic positions; kept clear of the moon
 * (upper right) and of the mountains (lower part of the scene).
 */
function makeBrightStars(): BrightStar[] {
  const rand = mulberry32(424242);
  const stars: BrightStar[] = [];
  while (stars.length < 16) {
    const x = 4 + rand() * 92;
    const y = 3 + rand() * 50;
    const nearMoon = Math.hypot((x - MOON_CENTER.x * 100) * 1.2, y - MOON_CENTER.y * 100) < 24;
    if (nearMoon) continue;
    const brightness = rand();
    stars.push({
      x,
      y,
      size: 1.6 + brightness * 2,
      colour: COLOURS[Math.floor(rand() * COLOURS.length)],
      spikes: brightness > 0.72,
      delay: Math.round(rand() * 6000),
      duration: 5200 + Math.round(rand() * 4200),
    });
  }
  return stars;
}

const STARS = makeBrightStars();

/**
 * With `loop`, the parent is two sky tiles wide: every star appears once in each tile (at half
 * scale horizontally) so the drifting sky repeats seamlessly. Moon avoidance only applies to the
 * static layout, since looping stars pass behind the moon's glow.
 */
export function BrightStars({ loop = false }: { loop?: boolean }) {
  const placed = loop
    ? [0, 50].flatMap((offset) => STARS.map((s) => ({ ...s, x: offset + s.x / 2 })))
    : STARS;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {placed.map((s, i) => {
        const style = {
          left: `${s.x}%`,
          top: `${s.y}%`,
          "--star": s.colour,
          "--core": `${s.size}px`,
          animationDelay: `${s.delay}ms`,
          animationDuration: `${s.duration}ms`,
        } as CSSProperties;
        return (
          <span key={i} className="bright-star" style={style}>
            {s.spikes && <span className="bright-star__spikes" />}
          </span>
        );
      })}
    </div>
  );
}
