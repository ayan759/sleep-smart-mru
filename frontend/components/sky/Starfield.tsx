import { mulberry32 } from "@/lib/random";

type Star = { x: number; y: number; r: number; o: number; twinkleDelay: number | null };

const STAR_COUNT = 90;

/** Deterministic star positions so server and client render the same sky. */
function makeStars(seed: number): Star[] {
  const rand = mulberry32(seed);
  return Array.from({ length: STAR_COUNT }, (_, i) => {
    // Bias stars toward the top of the sky, where it is darkest.
    const y = Math.pow(rand(), 1.6) * 1000;
    return {
      x: rand() * 1000,
      y,
      r: 0.8 + rand() * 1.6,
      o: 0.35 + rand() * 0.55,
      twinkleDelay: i % 9 === 0 ? Math.round(rand() * 4000) : null,
    };
  });
}

const STARS = makeStars(2026);

export function Starfield() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      // Full-bleed band behind the hero scene only, so stars never sit behind body text.
      className="pointer-events-none absolute -top-6 bottom-0 left-1/2 -z-10 w-screen -translate-x-1/2 [mask-image:linear-gradient(to_bottom,black_55%,transparent_90%)]"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
    >
      {STARS.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="var(--color-starlight)"
          opacity={s.o}
          className={s.twinkleDelay === null ? undefined : "star-twinkle"}
          style={s.twinkleDelay === null ? undefined : { animationDelay: `${s.twinkleDelay}ms` }}
        />
      ))}
    </svg>
  );
}
