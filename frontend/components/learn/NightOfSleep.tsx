"use client";

import { useState } from "react";
import { useElementWidth } from "@/lib/useElementWidth";
import {
  EXAMPLE_NIGHT,
  NIGHT_MINUTES,
  STAGE_INFO,
  minutesLostAfter,
  type Stage,
} from "@/lib/learn/night";

const ORDER: Stage[] = ["wake", "rem", "n1", "n2", "n3"]; // top to bottom, as sleep labs draw it
const COLOUR: Record<Stage, string> = {
  wake: "var(--color-haze)",
  rem: "var(--color-moon)",
  n1: "rgb(230 194 222 / 0.55)",
  n2: "var(--color-lilac)",
  n3: "var(--color-sage)",
};

const H = 230;
const PAD_R = 8;
const ROW = 40;
const TOP = 14;
const y = (s: Stage) => TOP + ORDER.indexOf(s) * ROW;

const clock = (minAfter11pm: number) => {
  const total = (23 * 60 + minAfter11pm) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "a.m." : "p.m."}`;
};

/** Segments with start/end minutes after 11 p.m. (static example data, computed once). */
const SEGMENTS = EXAMPLE_NIGHT.reduce<{ stage: Stage; start: number; end: number }[]>(
  (acc, [stage, m]) => {
    const start = acc.length ? acc[acc.length - 1].end : 0;
    acc.push({ stage, start, end: start + m });
    return acc;
  },
  [],
);

export function NightOfSleep() {
  const [chartRef, W] = useElementWidth<HTMLDivElement>(720);
  const PAD_L = W < 480 ? 52 : 74;
  const x = (min: number) => PAD_L + (min / NIGHT_MINUTES) * (W - PAD_L - PAD_R);
  const [focus, setFocus] = useState<Stage | null>(null);
  const [cut, setCut] = useState(NIGHT_MINUTES); // alarm, minutes after 11 p.m.
  const lost = minutesLostAfter(cut);

  return (
    <div className="rounded-2xl border border-white/[0.09] bg-[#0f1429] p-5 sm:p-7">
      {/* Stage picker */}
      <div role="group" aria-label="Sleep stages" className="flex flex-wrap gap-2">
        {(["n1", "n2", "n3", "rem", "wake"] as Stage[]).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={focus === s}
            onClick={() => setFocus(focus === s ? null : s)}
            className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm transition-colors ${
              focus === s
                ? "border-white/40 bg-white/[0.08] text-starlight"
                : "border-white/[0.12] text-haze hover:text-starlight"
            }`}
          >
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full"
              style={{ background: COLOUR[s] }}
            />
            {STAGE_INFO[s].name}
          </button>
        ))}
      </div>

      {/* Hypnogram */}
      <div ref={chartRef} className="mt-6">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          role="img"
          aria-label="An example night of sleep from 11 p.m. to 7 a.m., cycling between light, deep and REM sleep. REM periods get longer toward morning; deep sleep comes mostly early."
        >
          {ORDER.map((s) => (
            <g key={s}>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={y(s) + 6}
                y2={y(s) + 6}
                stroke="rgb(255 255 255 / 0.05)"
              />
              <text
                x={PAD_L - 12}
                y={y(s) + 10}
                textAnchor="end"
                fontSize="12"
                fill="var(--color-haze)"
              >
                {STAGE_INFO[s].short}
              </text>
            </g>
          ))}
          {/* Thin connectors between stages */}
          {SEGMENTS.slice(1).map((seg, i) => (
            <line
              key={`c${i}`}
              x1={x(seg.start)}
              x2={x(seg.start)}
              y1={y(SEGMENTS[i].stage) + 6}
              y2={y(seg.stage) + 6}
              stroke="rgb(255 255 255 / 0.18)"
            />
          ))}
          {SEGMENTS.map((seg, i) => {
            const dim = (focus && focus !== seg.stage) || seg.start >= cut;
            return (
              <rect
                key={i}
                x={x(seg.start)}
                y={y(seg.stage)}
                width={Math.max(2, x(seg.end) - x(seg.start))}
                height={12}
                rx={3}
                fill={COLOUR[seg.stage]}
                opacity={dim ? 0.16 : 1}
                style={{ transition: "opacity 200ms" }}
              />
            );
          })}
          {cut < NIGHT_MINUTES && (
            <>
              <rect
                x={x(cut)}
                y={4}
                width={x(NIGHT_MINUTES) - x(cut)}
                height={H - 34}
                fill="rgb(10 14 28 / 0.55)"
              />
              <line
                x1={x(cut)}
                x2={x(cut)}
                y1={4}
                y2={H - 30}
                stroke="var(--color-coral)"
                strokeWidth="2"
              />
            </>
          )}
          {[0, 120, 240, 360, 480].map((m) => (
            <text
              key={m}
              x={x(m)}
              y={H - 6}
              textAnchor={m === 0 ? "start" : m === 480 ? "end" : "middle"}
              fontSize="12"
              fill="var(--color-haze)"
            >
              {clock(m).replace(":00", "")}
            </text>
          ))}
        </svg>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2 lg:gap-10">
        <div aria-live="polite">
          <p className="font-semibold text-starlight">
            {focus ? STAGE_INFO[focus].name : "Tap a stage to see what it does"}
          </p>
          <p className="mt-1 leading-relaxed text-haze">
            {focus
              ? STAGE_INFO[focus].body
              : "Through the night you cycle from light sleep into deep sleep and then REM, several times. Deep sleep comes mostly early; REM gets longer toward morning."}
          </p>
        </div>
        <div>
          <label htmlFor="alarm" className="font-semibold text-starlight">
            Alarm at <span className="text-moon tabular">{clock(cut)}</span>
          </label>
          <input
            id="alarm"
            type="range"
            min={300}
            max={NIGHT_MINUTES}
            step={15}
            value={cut}
            onChange={(e) => setCut(Number(e.target.value))}
            aria-valuetext={`Alarm at ${clock(cut)}`}
            className="mt-3 h-11 w-full cursor-pointer accent-[var(--color-moon)]"
          />
          <p className="mt-1 leading-relaxed text-haze" aria-live="polite">
            {cut >= NIGHT_MINUTES
              ? "Drag earlier to see what an early alarm cuts out."
              : `In this example night, waking at ${clock(cut)} instead of 7 a.m. cuts ${lost.rem} min of REM and ${lost.n3} min of deep sleep. The last hours of the night hold the longest REM.`}
          </p>
        </div>
      </div>
      <p className="mt-5 text-xs text-haze/80">
        An example night following the pattern described by the{" "}
        <a
          className="underline underline-offset-2 hover:text-starlight"
          href="https://www.ninds.nih.gov/health-information/public-education/brain-basics/brain-basics-understanding-sleep"
        >
          U.S. National Institutes of Health
        </a>
        . Real nights vary.
      </p>
    </div>
  );
}
