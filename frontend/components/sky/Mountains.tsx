import { mulberry32 } from "@/lib/random";

const W = 1600;
const H = 400;

/** Jagged ridgeline by midpoint displacement (seeded, so it is the same on every render). */
function ridge(
  seed: number,
  base: number,
  amplitude: number,
  roughness: number,
  peakiness: number,
): [number, number][] {
  const rand = mulberry32(seed);
  const n = 256;
  const ys = new Array<number>(n + 1).fill(0);
  ys[0] = rand();
  ys[n] = rand();
  let step = n;
  let scale = 1;
  while (step > 1) {
    const half = step / 2;
    for (let i = half; i < n; i += step) {
      ys[i] = (ys[i - half] + ys[i + half]) / 2 + (rand() - 0.5) * scale;
    }
    step = half;
    scale *= roughness;
  }
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  return ys.map((v, i) => {
    const t = (v - min) / (max - min);
    // Power curve sharpens summits and flattens valleys, like real ranges.
    return [(i / n) * W, base - amplitude * Math.pow(t, peakiness)];
  });
}

const toPath = (pts: [number, number][]) =>
  pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

const FAR = ridge(51, 230, 175, 0.56, 1.35);
const MID = ridge(77, 300, 120, 0.53, 1.2);
const NEAR = ridge(103, 370, 70, 0.5, 1.05);

const closed = (pts: [number, number][]) => `${toPath(pts)} L${W} ${H + 2} L0 ${H + 2} Z`;

/**
 * Three layered ranges with atmospheric perspective: far peaks are hazier and catch a thin
 * line of moonlight; the nearest range is the page colour, so the scene flows into the content.
 */
export function Mountains() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-x-0 bottom-0 h-[52%] w-full"
    >
      <defs>
        <linearGradient id="far-range" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#161d3a" />
          <stop offset="100%" stopColor="#10162e" />
        </linearGradient>
        <linearGradient id="mid-range" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f1429" />
          <stop offset="100%" stopColor="#0b1021" />
        </linearGradient>
      </defs>

      <path d={closed(FAR)} fill="url(#far-range)" />
      {/* Moonlight catching the highest ridgeline (moon is up and to the right). */}
      <path d={toPath(FAR)} fill="none" stroke="rgb(205 215 255 / 0.28)" strokeWidth="1.4" />

      <path d={closed(MID)} fill="url(#mid-range)" />
      <path d={toPath(MID)} fill="none" stroke="rgb(205 215 255 / 0.08)" strokeWidth="1" />

      <path d={closed(NEAR)} fill="var(--color-abyss)" />
    </svg>
  );
}
