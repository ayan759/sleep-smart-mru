"use client";

import { useState } from "react";
import { useElementWidth } from "@/lib/useElementWidth";
import {
  CUTOFF_HOURS_BEFORE_BED,
  DAILY_LIMIT_MG,
  DRINKS,
  HALF_LIFE_H,
  drinkById,
  remainingAt,
  toTimelineMin,
  type Intake,
} from "@/lib/learn/caffeine";

type Row = { key: number; drinkId: string; time: string };

const H = 220;
const PAD_L = 44;
const PAD_R = 10;
const PAD_T = 18;
const PAD_B = 28;
const DAY = 24 * 60;

const label12 = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "a.m." : "p.m."}`;
};

const inputClass =
  "min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-starlight [color-scheme:dark] focus-visible:border-moon/60";
const selectClass =
  "min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-[#0e1329] px-3 text-starlight";

export function CaffeineCalculator() {
  const [chartRef, W] = useElementWidth<HTMLDivElement>(720);
  const x = (min: number) => PAD_L + (min / DAY) * (W - PAD_L - PAD_R);
  const [bed, setBed] = useState("23:30");
  const [rows, setRows] = useState<Row[]>([
    { key: 1, drinkId: "brewed", time: "08:30" },
    { key: 2, drinkId: "energy", time: "18:00" },
  ]);

  const intakes: Intake[] = rows.map((r) => ({
    mg: drinkById(r.drinkId).mg,
    atMin: toTimelineMin(r.time),
  }));
  const bedMin = toTimelineMin(bed);
  const cutoffMin = bedMin - CUTOFF_HOURS_BEFORE_BED * 60;
  const atBed = remainingAt(intakes, bedMin, HALF_LIFE_H.typical);
  const atBedFast = remainingAt(intakes, bedMin, HALF_LIFE_H.fast);
  const atBedSlow = remainingAt(intakes, bedMin, HALF_LIFE_H.slow);
  const total = intakes.reduce((a, i) => a + i.mg, 0);
  const late = rows.filter(
    (r) => toTimelineMin(r.time) > cutoffMin && toTimelineMin(r.time) <= bedMin,
  );

  // Curves sampled every 10 minutes.
  const samples = Array.from({ length: DAY / 10 + 1 }, (_, i) => i * 10);
  const curve = (hl: number) => samples.map((t) => remainingAt(intakes, t, hl));
  const typical = curve(HALF_LIFE_H.typical);
  const slow = curve(HALF_LIFE_H.slow);
  const fast = curve(HALF_LIFE_H.fast);
  const yMax = Math.max(200, ...slow, ...typical) * 1.1;
  const y = (mg: number) => PAD_T + (1 - mg / yMax) * (H - PAD_T - PAD_B);
  const line = (vals: number[]) =>
    vals.map((v, i) => `${i ? "L" : "M"}${x(samples[i]).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const band = `${line(slow)} ${fast
    .map(
      (v, i) =>
        `L${x(samples[samples.length - 1 - i]).toFixed(1)} ${y(fast[samples.length - 1 - i]).toFixed(1)}`,
    )
    .join(" ")} Z`;

  const update = (key: number, patch: Partial<Row>) =>
    setRows(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <div className="rounded-2xl border border-white/[0.09] bg-[#0f1429] p-5 sm:p-7">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        {/* Inputs */}
        <div>
          <p className="font-semibold text-starlight">Your drinks today</p>
          <ul className="mt-3 grid gap-3">
            {rows.map((r) => (
              <li
                key={r.key}
                className="grid grid-cols-[minmax(0,1fr)_7.5rem_auto] items-end gap-2"
              >
                <label className="min-w-0 text-xs text-haze">
                  Drink
                  <select
                    value={r.drinkId}
                    onChange={(e) => update(r.key, { drinkId: e.target.value })}
                    className={`${selectClass} mt-1`}
                  >
                    {DRINKS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}, {d.shown}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="min-w-0 text-xs text-haze">
                  At
                  <input
                    type="time"
                    step={900}
                    value={r.time}
                    onChange={(e) => e.target.value && update(r.key, { time: e.target.value })}
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setRows(rows.filter((x) => x.key !== r.key))}
                  aria-label={`Remove ${drinkById(r.drinkId).label} at ${label12(r.time)}`}
                  className="grid size-11 cursor-pointer place-items-center rounded-xl text-haze hover:bg-white/[0.06] hover:text-starlight"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <button
              type="button"
              disabled={rows.length >= 6}
              onClick={() => setRows([...rows, { key: Date.now(), drinkId: "tea", time: "13:00" }])}
              className="min-h-11 cursor-pointer rounded-full border border-white/15 px-4 text-sm font-medium text-starlight hover:border-white/30 disabled:opacity-50"
            >
              Add a drink
            </button>
            <label className="ml-auto w-36 text-xs text-haze">
              Bedtime
              <input
                type="time"
                step={900}
                value={bed}
                onChange={(e) => e.target.value && setBed(e.target.value)}
                className={`${inputClass} mt-1`}
              />
            </label>
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-haze">Left in your body at bedtime</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-starlight tabular sm:text-3xl">
                {Math.round(atBed)} mg
              </p>
              <p className="mt-1 text-xs text-haze/80 tabular">
                Estimate; {Math.round(atBedFast)} to {Math.round(atBedSlow)} mg depending on your
                body
              </p>
            </div>
            <div>
              <p className="text-sm text-haze">Today&apos;s total</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-starlight tabular sm:text-3xl">
                {total} mg
              </p>
              <div
                aria-hidden="true"
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"
              >
                <div
                  className={`h-full rounded-full ${total > DAILY_LIMIT_MG ? "bg-coral" : "bg-moon"}`}
                  style={{ width: `${Math.min(100, (100 * total) / DAILY_LIMIT_MG)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-haze/80">
                of Health Canada&apos;s {DAILY_LIMIT_MG} mg daily limit
              </p>
            </div>
          </div>

          <div ref={chartRef} className="mt-5">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="block h-auto w-full"
              role="img"
              aria-label={`Caffeine in your body through the day. About ${Math.round(atBed)} milligrams remain at bedtime.`}
            >
              {[0, 0.5, 1].map((f) => (
                <line
                  key={f}
                  x1={PAD_L}
                  x2={W - PAD_R}
                  y1={y((yMax * f) / 1.1)}
                  y2={y((yMax * f) / 1.1)}
                  stroke="rgb(255 255 255 / 0.06)"
                />
              ))}
              <path d={band} fill="rgb(243 223 165 / 0.09)" />
              <path
                d={`${line(typical)} L${x(DAY)} ${y(0)} L${x(0)} ${y(0)} Z`}
                fill="rgb(243 223 165 / 0.08)"
              />
              <path d={line(typical)} fill="none" stroke="var(--color-moon)" strokeWidth="2" />
              {cutoffMin > 0 && (
                <>
                  <rect
                    x={x(cutoffMin)}
                    y={PAD_T}
                    width={Math.max(0, x(bedMin) - x(cutoffMin))}
                    height={H - PAD_T - PAD_B}
                    fill="rgb(253 94 72 / 0.07)"
                  />
                  <line
                    x1={x(cutoffMin)}
                    x2={x(cutoffMin)}
                    y1={PAD_T}
                    y2={H - PAD_B}
                    stroke="var(--color-coral)"
                    strokeDasharray="3 4"
                  />
                  <text x={x(cutoffMin) + 6} y={PAD_T + 12} fontSize="11" fill="var(--color-coral)">
                    6 h before bed
                  </text>
                </>
              )}
              <line
                x1={x(bedMin)}
                x2={x(bedMin)}
                y1={PAD_T}
                y2={H - PAD_B}
                stroke="var(--color-lilac)"
                strokeWidth="2"
              />
              <text x={x(bedMin) + 6} y={PAD_T + 28} fontSize="11" fill="var(--color-lilac)">
                Bed
              </text>
              <circle cx={x(bedMin)} cy={y(atBed)} r="4" fill="var(--color-lilac)" />
              {intakes.map((i, k) => (
                <circle key={k} cx={x(i.atMin)} cy={H - PAD_B} r="3.5" fill="var(--color-moon)" />
              ))}
              {[0, 360, 720, 1080, 1440].map((m) => (
                <text
                  key={m}
                  x={x(m)}
                  y={H - 8}
                  textAnchor={m === 0 ? "start" : m === 1440 ? "end" : "middle"}
                  fontSize="11"
                  fill="var(--color-haze)"
                >
                  {["6 a.m.", "Noon", "6 p.m.", "Midnight", "6 a.m."][m / 360]}
                </text>
              ))}
              <text
                x={PAD_L - 8}
                y={y(0) + 4}
                textAnchor="end"
                fontSize="11"
                fill="var(--color-haze)"
              >
                0
              </text>
            </svg>
          </div>

          <div aria-live="polite" className="mt-3 text-sm leading-relaxed">
            {late.length > 0 ? (
              <p className="border-l-2 border-coral pl-3 text-starlight">
                {late
                  .map((r) => `${drinkById(r.drinkId).label} at ${label12(r.time)}`)
                  .join(" and ")}{" "}
                {late.length === 1 ? "is" : "are"} within 6 hours of bed. In a sleep study, caffeine
                6 hours before bed still cut sleep by more than an hour.
              </p>
            ) : (
              <p className="border-l-2 border-sage pl-3 text-starlight">
                Nothing within 6 hours of bed. Nice.
              </p>
            )}
          </div>
        </div>
      </div>
      <p className="mt-5 text-xs leading-relaxed text-haze/80">
        Simplified estimate: caffeine counted as absorbed right away, then halving about every 5
        hours (range 1.5 to 9.5 hours between people). Amounts from{" "}
        <a
          className="underline underline-offset-2 hover:text-starlight"
          href="https://www.canada.ca/en/health-canada/services/food-nutrition/food-safety/food-additives/caffeine-foods.html"
        >
          Health Canada
        </a>
        ; half-life from{" "}
        <a
          className="underline underline-offset-2 hover:text-starlight"
          href="https://www.ncbi.nlm.nih.gov/books/NBK223808/"
        >
          NCBI Bookshelf
        </a>
        . Not medical advice.
      </p>
    </div>
  );
}
