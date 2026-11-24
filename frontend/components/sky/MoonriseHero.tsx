/**
 * The page's one orchestrated motion: the moon rises over the hills on load.
 * The moon hangs on an "arm" that pivots around a point below the right edge,
 * so a single CSS rotation traces a natural arc. Static under reduced motion.
 */
const BACK_RIDGE = "M-10 152 C 70 120, 150 124, 230 148 S 330 152, 370 132";

export function MoonriseHero() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 360 200" className="block h-auto w-full">
      <defs>
        <radialGradient id="moon-glow">
          <stop offset="0%" stopColor="var(--color-moon)" stopOpacity="0.28" />
          <stop offset="55%" stopColor="var(--color-moon)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="var(--color-moon)" stopOpacity="0" />
        </radialGradient>
        {/* Hills dissolve into the page background instead of ending in a hard edge. */}
        <linearGradient id="back-hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="40%" stopColor="var(--color-night-soft)" />
          <stop offset="100%" stopColor="var(--color-night-soft)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="front-hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-night-deep)" />
          <stop offset="100%" stopColor="var(--color-night-deep)" stopOpacity="0" />
        </linearGradient>
        {/* Sky above the back ridgeline: the moon is only ever drawn here, so it can't
            show through the faded hills while it is still "below the horizon". */}
        <clipPath id="sky-above-ridge">
          <path d={`${BACK_RIDGE} L 370 -10 L -10 -10 Z`} />
        </clipPath>
      </defs>

      <g clipPath="url(#sky-above-ridge)">
        <g className="moon-arm" style={{ transformOrigin: "360px 340px" }}>
          <circle className="moon-glow" cx="220" cy="92" r="80" fill="url(#moon-glow)" />
          <circle
            cx="220"
            cy="92"
            r="34"
            fill="var(--color-moon)"
            stroke="var(--color-ink)"
            strokeWidth="2.5"
          />
          <circle cx="208" cy="84" r="7" fill="#e5cd8a" />
          <circle cx="231" cy="106" r="4.5" fill="#e5cd8a" />
          <circle cx="234" cy="80" r="3" fill="#e5cd8a" />
        </g>
      </g>

      {/* Hills run past the edges so only their outlined ridgelines show. */}
      <path
        d={`${BACK_RIDGE} L 370 210 L -10 210 Z`}
        fill="url(#back-hill)"
        stroke="var(--color-ink)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M-10 178 C 90 150, 190 160, 260 172 S 340 178, 370 166 L 370 210 L -10 210 Z"
        fill="url(#front-hill)"
        stroke="var(--color-ink)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
