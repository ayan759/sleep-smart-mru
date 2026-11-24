/**
 * Flat, readable miniatures of each tool's real screen (example content). Decorative: the row's
 * heading and text already say what each tool does, so these are hidden from screen readers.
 */

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-white/[0.09] bg-[#0f1429] p-5 transition-colors duration-300 group-hover:border-white/[0.16] sm:p-6"
    >
      {children}
    </div>
  );
}

/** Sleep Weather: tomorrow's curve, the groggy first hour, and the warning it gives. */
export function ForecastScreen() {
  // x: 7 a.m. (0) to 11 p.m. (320), 20 px per hour. Groggy after waking, late-morning peak,
  // afternoon dip, evening lift, then the slide toward bedtime.
  const curve =
    "M0 80 C 10 64, 18 44, 46 36 S 98 30, 124 38 S 156 52, 178 48 S 214 28, 238 30 S 296 52, 320 72";
  return (
    <Frame>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-haze">Tomorrow</span>
        <span className="font-semibold text-moon">Patchy fog</span>
      </div>
      <svg viewBox="0 0 320 96" className="mt-4 h-auto w-full overflow-visible">
        {[24, 52, 80].map((y) => (
          <line key={y} x1="0" x2="320" y1={y} y2={y} stroke="rgb(255 255 255 / 0.06)" />
        ))}
        {/* Low for you: the first hour and a half after waking. */}
        <rect x="0" y="4" width="34" height="92" rx="3" fill="rgb(253 94 72 / 0.14)" />
        <path d={`${curve} L320 96 L0 96 Z`} fill="rgb(243 223 165 / 0.07)" />
        <path
          d={curve}
          fill="none"
          stroke="var(--color-moon)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line x1="20" x2="20" y1="56" y2="96" stroke="var(--color-coral)" strokeWidth="1.5" />
        <circle cx="20" cy="54" r="4" fill="var(--color-coral)" />
      </svg>
      <div className="mt-2 flex justify-between text-xs text-haze/80 tabular">
        <span>7 a.m.</span>
        <span>Noon</span>
        <span>5 p.m.</span>
        <span>11 p.m.</span>
      </div>
      <p className="mt-5 border-l-2 border-coral pl-3 text-sm leading-relaxed text-starlight">
        COMP 2631 midterm at 8:00 a.m. is 30 min after waking: sleep inertia and low circadian
        alertness.
      </p>
    </Frame>
  );
}

const DAY: { time: string; label: string; bar: string }[] = [
  { time: "7:30 a.m.", label: "Wake up", bar: "bg-lilac" },
  { time: "8:30 a.m.", label: "COMP 2631 lecture", bar: "bg-sage" },
  { time: "10:00 a.m.", label: "Study PSYC 1105, 2 h", bar: "bg-moon" },
  { time: "2:00 p.m.", label: "Study COMP 2631, 90 min", bar: "bg-moon" },
  { time: "10:30 p.m.", label: "Wind down, no more study", bar: "bg-haze/50" },
  { time: "11:30 p.m.", label: "Lights out", bar: "bg-lilac" },
];

/** Exam-crunch planner: one day of a plan, with sleep protected at both ends. */
export function PlannerScreen() {
  return (
    <Frame>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-haze">Thursday</span>
        <span className="font-semibold text-lilac">8 h of sleep</span>
      </div>
      <ol className="mt-4 divide-y divide-white/[0.06]">
        {DAY.map((row) => (
          <li key={row.time} className="flex items-center gap-4 py-2.5 text-sm">
            <span className="w-20 shrink-0 text-haze tabular">{row.time}</span>
            <span className={`h-5 w-[3px] shrink-0 rounded-full ${row.bar}`} />
            <span className="text-starlight">{row.label}</span>
          </li>
        ))}
      </ol>
    </Frame>
  );
}

const CHOICES: { label: string; on: boolean }[] = [
  { label: "Assignments or studying", on: true },
  { label: "Exams or midterms", on: false },
  { label: "Stress or anxiety", on: true },
  { label: "Phone, social media or screens", on: false },
  { label: "Early classes", on: false },
  { label: "Part-time job shifts", on: false },
];

/** Sleep barrier poll: its first question, two answers picked. */
export function PollScreen() {
  return (
    <Frame>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-haze">Question 1 of 3</span>
        <span className="text-haze tabular">2 of 3 chosen</span>
      </div>
      <p className="mt-3 font-medium text-starlight">What most often cuts into your sleep?</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {CHOICES.map((c) => (
          <span
            key={c.label}
            className={`rounded-xl border px-3 py-2 text-[13px] leading-snug ${
              c.on
                ? "border-lilac/60 bg-lilac/[0.12] text-starlight"
                : "border-white/[0.09] text-haze"
            }`}
          >
            {c.on && <span className="mr-1.5 text-lilac">✓</span>}
            {c.label}
          </span>
        ))}
      </div>
    </Frame>
  );
}

/** Sleep guide: one quiz card, answered, with the study behind it. */
export function GuideScreen() {
  return (
    <Frame>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold text-starlight">Good habit or bad habit?</span>
        <span className="text-haze tabular">1 of 8</span>
      </div>
      <p className="mt-4 text-xl font-semibold leading-snug tracking-tight text-starlight">
        Sleeping until noon on Saturday to catch up
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-semibold">
        <span className="rounded-xl border border-white/10 px-3 py-2.5 text-center text-haze/60">
          Good habit
        </span>
        <span className="rounded-xl border border-sage/60 bg-sage/[0.14] px-3 py-2.5 text-center text-starlight">
          Bad habit
        </span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-haze">
        A big weekend shift works like weekly jet lag.{" "}
        <span className="text-haze/80 underline underline-offset-2">Wittmann 2006</span>
      </p>
    </Frame>
  );
}
