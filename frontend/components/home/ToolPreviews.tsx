/**
 * Small glowing previews of what each tool does. Decorative (aria-hidden), not real data.
 */

const glow = (rgb: string, px = 6) => ({ filter: `drop-shadow(0 0 ${px}px rgb(${rgb} / 0.6))` });

/** Alertness across a day: groggy after waking, late-morning peak, afternoon slump, evening lift. */
export function ForecastPreview() {
  const curve =
    "M0 70 C 22 70, 34 30, 72 26 S 124 40, 152 52 S 190 58, 212 42 S 262 18, 284 24 S 312 56, 320 66";
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 320 90" className="h-auto w-full">
      <defs>
        <linearGradient id="fc-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(243 223 165)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="rgb(243 223 165)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fc-slump" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(253 94 72)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="rgb(253 94 72)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[22, 45, 68].map((y) => (
        <line key={y} x1="0" x2="320" y1={y} y2={y} stroke="rgb(255 255 255 / 0.05)" />
      ))}
      <rect
        x="146"
        y="2"
        width="56"
        height="86"
        rx="8"
        fill="url(#fc-slump)"
        stroke="rgb(253 94 72 / 0.45)"
        strokeDasharray="3 4"
      />
      <path d={`${curve} L320 90 L0 90 Z`} fill="url(#fc-area)" />
      <path
        d={curve}
        fill="none"
        stroke="var(--color-moon)"
        strokeWidth="2.2"
        strokeLinecap="round"
        style={glow("243 223 165")}
      />
      {/* A class landing in the slump. */}
      <line x1="172" x2="172" y1="62" y2="84" stroke="rgb(253 94 72 / 0.5)" strokeWidth="1.5" />
      <circle cx="172" cy="55" r="4" fill="var(--color-coral)" style={glow("253 94 72", 5)} />
    </svg>
  );
}

/** A week: sleep in the same window every night, study spread across days, exam at the end. */
export function PlannerPreview() {
  const study: [number, number][][] = [
    [[46, 14]],
    [
      [40, 10],
      [64, 12],
    ],
    [[52, 14]],
    [
      [42, 12],
      [66, 10],
    ],
    [[48, 16]],
    [
      [40, 10],
      [60, 12],
    ],
    [],
  ];
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 280 96" className="h-auto w-full">
      {study.map((blocks, day) => {
        const x = 8 + day * 39;
        return (
          <g key={day}>
            <rect x={x} y="2" width="24" height="92" rx="12" fill="rgb(255 255 255 / 0.04)" />
            {/* Sleep: same bedtime and wake time every night. */}
            <rect
              x={x + 3}
              y="5"
              width="18"
              height="28"
              rx="9"
              fill="var(--color-lilac)"
              opacity="0.75"
              style={glow("230 194 222", 4)}
            />
            {blocks.map(([y, h]) => (
              <rect
                key={y}
                x={x + 3}
                y={y}
                width="18"
                height={h}
                rx="6"
                fill="var(--color-sage)"
                opacity="0.85"
                style={glow("210 222 156", 4)}
              />
            ))}
            {day === 6 && (
              <circle
                cx={x + 12}
                cy="58"
                r="5"
                fill="var(--color-coral)"
                style={glow("253 94 72", 5)}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Ranked results bars, like the live committee dashboard. */
export function PollPreview() {
  const shares = [0.92, 0.7, 0.52, 0.36];
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 280 92" className="h-auto w-full">
      {shares.map((share, i) => {
        const y = 4 + i * 23;
        return (
          <g key={share}>
            <rect x="0" y={y} width="280" height="10" rx="5" fill="rgb(255 255 255 / 0.05)" />
            <rect
              x="0"
              y={y}
              width={280 * share}
              height="10"
              rx="5"
              fill="var(--color-lilac)"
              opacity={1 - i * 0.18}
              style={i === 0 ? glow("230 194 222", 5) : undefined}
            />
          </g>
        );
      })}
    </svg>
  );
}
