/**
 * Renders public/moon.webp: a photo-style waxing gibbous Moon, generated (not downloaded).
 * Run from frontend/:  node scripts/render-moon.mts
 *
 * Decorative only. Maria and named craters sit at their approximate real selenographic
 * positions so the disc reads as "our" Moon; everything else is seeded procedural detail.
 * Deterministic: same seed, same image.
 */
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { createNoise3 } from "../lib/noise.ts";
import { mulberry32 } from "../lib/random.ts";

const SIZE = 720;
const OUT = fileURLToPath(new URL("../public/moon.webp", import.meta.url));
const DEG = Math.PI / 180;
const { fbm3 } = createNoise3(1969);
const rand = mulberry32(1969);

type Vec = [number, number, number];
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: Vec): Vec => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
/** Selenographic lat/lon (deg) → unit vector. x = east (right), y = north (up), z = toward Earth. */
const fromLatLon = (lat: number, lon: number): Vec => [
  Math.cos(lat * DEG) * Math.sin(lon * DEG),
  Math.sin(lat * DEG),
  Math.cos(lat * DEG) * Math.cos(lon * DEG),
];
const angle = (a: Vec, b: Vec) => Math.acos(Math.min(1, Math.max(-1, dot(a, b))));
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// ---- Maria: [lat, lon, approx angular radius in degrees] -------------------------------
const MARIA: [number, number, number][] = [
  [33, -16, 16.5], // Imbrium
  [45, -32, 4.5], // Sinus Iridum
  [28, 17.5, 10.5], // Serenitatis
  [38, 29, 4], // Lacus Somniorum
  [8.5, 31, 11.5], // Tranquillitatis
  [3, 23, 6.5],
  [17, 59, 8], // Crisium
  [36, -56, 12], // Oceanus Procellarum (irregular: several lobes)
  [18, -58, 13],
  [3, -50, 12.5],
  [-10, -42, 9.5],
  [7, -31, 8], // Mare Insularum
  [11, -9, 4], // Sinus Aestuum
  [13, 3.5, 4.2], // Vaporum
  [2, 1, 3], // Sinus Medii
  [-21, -17, 9.5], // Nubium
  [-10, -23, 5], // Cognitum
  [-24, -39, 6.5], // Humorum
  [-8, 51, 10], // Fecunditatis
  [-15, 35, 5.5], // Nectaris
  [57, -28, 5], // Frigoris (long thin band)
  [56, -10, 5],
  [56, 8, 5],
  [57, 26, 4.5],
  [1, 86, 5.5], // Smythii (limb)
  [13, 86, 4], // Marginis (limb)
];
const MARE_VECS = MARIA.map(([lat, lon, r]) => ({ c: fromLatLon(lat, lon), r }));

function mareMask(n: Vec): number {
  // Domain-warp the sample point so shorelines wander instead of tracing circles.
  const w = 0.075;
  const wn = norm([
    n[0] + w * fbm3(n[0] * 2.3 + 11, n[1] * 2.3, n[2] * 2.3, 4),
    n[1] + w * fbm3(n[0] * 2.3, n[1] * 2.3 + 23, n[2] * 2.3, 4),
    n[2] + w * fbm3(n[0] * 2.3, n[1] * 2.3, n[2] * 2.3 + 37, 4),
  ]);
  const edge =
    fbm3(wn[0] * 4, wn[1] * 4, wn[2] * 4, 5) * 6 +
    fbm3(wn[0] * 16, wn[1] * 16, wn[2] * 16, 3) * 1.8;
  let keep = 1;
  for (const { c, r } of MARE_VECS) {
    const d = angle(wn, c) / DEG + edge;
    keep *= 1 - (1 - smoothstep(r - 3.5, r + 2.5, d)); // soft union of all maria
  }
  return 1 - keep;
}

// ---- Craters ---------------------------------------------------------------------------
type Crater = {
  c: Vec;
  r: number; // radians
  depth: number;
  peak: boolean;
  halo: number; // bright ejecta halo strength
  floor?: number; // override floor albedo (dark-floored craters)
  glow?: number; // extra brightness (e.g. Aristarchus)
};

const NAMED: {
  lat: number;
  lon: number;
  rDeg: number;
  floor?: number;
  glow?: number;
  halo?: number;
}[] = [
  { lat: -43.3, lon: -11.2, rDeg: 1.4, halo: 0.25 }, // Tycho
  { lat: 9.6, lon: -20.1, rDeg: 1.55, halo: 0.18 }, // Copernicus
  { lat: 8.1, lon: -38, rDeg: 0.55, halo: 0.15 }, // Kepler
  { lat: 23.7, lon: -47.4, rDeg: 0.66, glow: 0.38, halo: 0.2 }, // Aristarchus
  { lat: 51.6, lon: -9.4, rDeg: 1.65, floor: 0.36 }, // Plato
  { lat: -5.2, lon: -68.6, rDeg: 2.85, floor: 0.34 }, // Grimaldi
  { lat: -8.9, lon: 61, rDeg: 2.1 }, // Langrenus
  { lat: -25.3, lon: 60.4, rDeg: 3 }, // Petavius
  { lat: -58.4, lon: -14.4, rDeg: 3.7 }, // Clavius
  { lat: -9.3, lon: -1.9, rDeg: 2.5, floor: 0.6 }, // Ptolemaeus
  { lat: -11.4, lon: 26.4, rDeg: 1.65 }, // Theophilus
  { lat: 16.1, lon: 46.8, rDeg: 0.46, halo: 0.15 }, // Proclus
  { lat: 14.5, lon: -11.3, rDeg: 0.97 }, // Eratosthenes
  { lat: 29.7, lon: -4, rDeg: 1.4, floor: 0.45 }, // Archimedes
];

const craters: Crater[] = NAMED.map(({ lat, lon, rDeg, floor, glow, halo }) => {
  const r = rDeg * DEG;
  return {
    c: fromLatLon(lat, lon),
    r,
    depth: r * (rDeg > 2 ? 0.16 : 0.3),
    peak: rDeg > 1,
    halo: halo ?? 0.04,
    floor,
    glow,
  };
});

for (let i = 0; i < 16000; i++) {
  // Uniform on the sphere, near side only.
  const y = rand() * 2 - 1;
  const phi = rand() * Math.PI * 2;
  const rr = Math.sqrt(1 - y * y);
  const c: Vec = [rr * Math.cos(phi), y, rr * Math.sin(phi)];
  if (c[2] < -0.05) continue;
  // Maria are younger and smoother: far fewer craters there.
  if (mareMask(c) > 0.5 && rand() > 0.12) continue;
  const rDeg = Math.min(3.2, 0.075 * Math.pow(1 - rand(), -1 / 1.6));
  const r = rDeg * DEG;
  const fresh = rand();
  craters.push({
    c,
    r,
    depth: r * (0.12 + 0.22 * fresh),
    peak: rDeg > 1.1 && fresh > 0.4,
    halo: fresh > 0.7 ? 0.11 * fresh : 0,
  });
}

// ---- Ray systems: Tycho, Copernicus, Kepler, Aristarchus, Proclus ----------------------
type RaySystem = {
  c: Vec;
  e1: Vec;
  e2: Vec;
  strength: number;
  rays: { az: number; w: number; len: number }[];
};
const raySystem = (
  lat: number,
  lon: number,
  strength: number,
  count: number,
  maxLenDeg: number,
): RaySystem => {
  const c = fromLatLon(lat, lon);
  const e1 = norm(cross([0, 1, 0], c));
  const e2 = cross(c, e1);
  const rays = Array.from({ length: count }, () => ({
    az: rand() * Math.PI * 2,
    w: (0.3 + rand() * rand() * 1.8) * DEG,
    len: (0.35 + rand() * 0.65) * maxLenDeg * DEG,
  }));
  return { c, e1, e2, strength, rays };
};
const RAYS = [
  raySystem(-43.3, -11.2, 0.27, 20, 60),
  raySystem(9.6, -20.1, 0.15, 14, 22),
  raySystem(8.1, -38, 0.12, 16, 12),
  raySystem(23.7, -47.4, 0.1, 12, 10),
  raySystem(16.1, 46.8, 0.1, 10, 9),
];

function rayBrightness(n: Vec): number {
  let total = 0;
  for (const s of RAYS) {
    const d = angle(n, s.c);
    if (d > 1.0 || d < 1e-4) continue;
    const proj = [
      n[0] - s.c[0] * dot(n, s.c),
      n[1] - s.c[1] * dot(n, s.c),
      n[2] - s.c[2] * dot(n, s.c),
    ] as Vec;
    const az = Math.atan2(dot(proj, s.e2), dot(proj, s.e1));
    let b = 0;
    for (const ray of s.rays) {
      if (d > ray.len) continue;
      let da = Math.abs(az - ray.az);
      if (da > Math.PI) da = 2 * Math.PI - da;
      const lateral = d * da;
      b += Math.exp(-((lateral / ray.w) ** 2)) * (1 - d / ray.len) ** 1.4;
    }
    const streak = Math.min(1, Math.max(0, 0.45 + 1.1 * fbm3(n[0] * 22, n[1] * 22, n[2] * 22, 4)));
    total += s.strength * Math.min(1.2, b) * streak;
  }
  return total;
}

// ---- Pass 1: albedo + height on the pixel grid -------------------------------------------
const N = SIZE * SIZE;
const albedo = new Float32Array(N);
const height = new Float32Array(N);
const mare = new Float32Array(N);
const inside = new Uint8Array(N);
const normals: (Vec | null)[] = new Array(N).fill(null);

const toPlane = (px: number, py: number): [number, number] => [
  ((px + 0.5) / SIZE) * 2 - 1,
  1 - ((py + 0.5) / SIZE) * 2,
];

for (let py = 0; py < SIZE; py++) {
  for (let px = 0; px < SIZE; px++) {
    const [x, y] = toPlane(px, py);
    const r2 = x * x + y * y;
    if (r2 > 1.0) continue;
    const i = py * SIZE + px;
    const n: Vec = [x, y, Math.sqrt(1 - r2)];
    inside[i] = 1;
    normals[i] = n;

    const m = mareMask(n);
    mare[i] = m;
    const grain = fbm3(n[0] * 110, n[1] * 110, n[2] * 110, 2) * 0.05;
    const highland =
      0.76 +
      fbm3(n[0] * 5, n[1] * 5, n[2] * 5, 4) * 0.09 +
      fbm3(n[0] * 24, n[1] * 24, n[2] * 24, 3) * 0.06 +
      grain;
    const maria =
      0.44 +
      fbm3(n[0] * 2.5 + 7, n[1] * 2.5, n[2] * 2.5, 4) * 0.14 +
      fbm3(n[0] * 12, n[1] * 12, n[2] * 12, 3) * 0.05 +
      grain * 0.6;
    albedo[i] = highland * (1 - m) + (maria - 0.05 * m * m) * m + rayBrightness(n); // mare centres a touch darker

    const rough = fbm3(n[0] * 60, n[1] * 60, n[2] * 60, 4) * 0.0022;
    height[i] = rough * (1 - 0.65 * m);
  }
}

// ---- Pass 2: stamp craters over their pixel bounding boxes -------------------------------
for (const k of craters) {
  if (k.c[2] < -0.05) continue;
  const reach = k.r * 2.2;
  const cx = ((k.c[0] + 1) / 2) * SIZE;
  const cy = ((1 - k.c[1]) / 2) * SIZE;
  const rad = Math.ceil((reach / 2) * SIZE) + 2;
  for (let py = Math.max(0, Math.floor(cy - rad)); py < Math.min(SIZE, Math.ceil(cy + rad)); py++) {
    for (
      let px = Math.max(0, Math.floor(cx - rad));
      px < Math.min(SIZE, Math.ceil(cx + rad));
      px++
    ) {
      const i = py * SIZE + px;
      const n = normals[i];
      if (!n) continue;
      const d = angle(n, k.c);
      const q = d / k.r;
      if (q > 2.2) continue;
      let h = 0;
      if (q < 1) h -= k.depth * (1 - q * q);
      h += k.depth * 0.16 * Math.exp(-(((q - 1) / 0.13) ** 2)); // raised rim
      if (k.peak && q < 0.3) h += k.depth * 0.35 * Math.exp(-((q / 0.12) ** 2)); // central peak
      height[i] += h;
      if (k.halo) albedo[i] += k.halo * Math.exp(-((q / 1.6) ** 2)); // filled ejecta glow, not a ring
      if (k.floor !== undefined && q < 0.92) albedo[i] = albedo[i] * 0.25 + k.floor * 0.75;
      if (k.glow && q < 1.4) albedo[i] += k.glow * (1 - smoothstep(0.6, 1.4, q));
    }
  }
}

// ---- Pass 3: light it (waxing gibbous, sun from the right) ------------------------------
const SUN_ANGLE = 36 * DEG;
const L = norm([Math.sin(SUN_ANGLE), 0.06, Math.cos(SUN_ANGLE)]);
const PIX = 2 / SIZE;
const BUMP = 0.55;
const rgba = Buffer.alloc(N * 4);

for (let py = 0; py < SIZE; py++) {
  for (let px = 0; px < SIZE; px++) {
    const i = py * SIZE + px;
    const [x, y] = toPlane(px, py);
    const dist = Math.sqrt(x * x + y * y);
    // Anti-aliased limb.
    const coverage = Math.min(1, Math.max(0, (1 - dist) * (SIZE / 2) + 0.5));
    if (coverage <= 0) continue;
    const n = normals[i] ?? norm([x, y, 0.001]);
    const z = n[2];

    const hx =
      (height[py * SIZE + Math.min(SIZE - 1, px + 1)] - height[py * SIZE + Math.max(0, px - 1)]) /
      (2 * PIX);
    const hy =
      (height[Math.max(0, py - 1) * SIZE + px] - height[Math.min(SIZE - 1, py + 1) * SIZE + px]) /
      (2 * PIX);
    const np = norm([n[0] - hx * z * BUMP, n[1] - hy * z * BUMP, n[2]]);

    const mu0 = dot(np, L);
    const mu = Math.max(0.02, np[2]);
    const lit = smoothstep(-0.015, 0.07, mu0);
    // Lommel–Seeliger (why the full Moon looks "flat") blended with a little Lambert for relief.
    const ls = mu0 > 0 ? (2 * mu0) / (mu0 + mu) : 0;
    const shade = 0.72 * ls + 0.36 * Math.max(0, mu0);
    const a = Math.max(0, albedo[i]);
    const m = mare[i];

    let v = a * shade * lit;
    v += a * 0.018 * (1 - lit); // faint earthshine on the night side
    v = 1 - Math.exp(-v * 1.55); // soft highlight roll-off

    // Highlands warm grey; maria a touch cooler.
    const rC = 1.0 - 0.05 * m;
    const gC = 0.975 - 0.02 * m;
    const bC = 0.93 + 0.05 * m;
    rgba[i * 4] = Math.round(Math.min(1, v * rC) * 255);
    rgba[i * 4 + 1] = Math.round(Math.min(1, v * gC) * 255);
    rgba[i * 4 + 2] = Math.round(Math.min(1, v * bC) * 255);
    rgba[i * 4 + 3] = Math.round(coverage * 255);
  }
}

await sharp(rgba, { raw: { width: SIZE, height: SIZE, channels: 4 } })
  .webp({ quality: 90, alphaQuality: 100, effort: 6 })
  .toFile(OUT);
console.log(`wrote ${OUT}`);
