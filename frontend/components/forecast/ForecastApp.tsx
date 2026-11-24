"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { bandOf } from "@/lib/alertness";
import {
  alignLogToToday,
  buildForecast,
  defaultSleepLog,
  isValidSleepLog,
  nightHours,
  SHORT_NIGHTS_NOTE_THRESHOLD,
  type Forecast,
  type SleepLog,
} from "@/lib/forecast";
import { isValidEvent, type ScheduleEvent } from "@/lib/schedule";
import { loadJSON, saveJSON, STORAGE_KEYS } from "@/lib/storage";
import { atClock, edmontonDate, formatClock, formatDay } from "@/lib/time";
import { AlertnessChart, AlertnessTable } from "./AlertnessChart";
import { ScheduleEditor } from "./ScheduleEditor";
import { SleepLogEditor } from "./SleepLogEditor";

// ---------------------------------------------------------------- helpers

const BED_MIN = 21 * 60; // slider: 9:00 p.m. …
const BED_RANGE = 7 * 60; // … to 4:00 a.m.
const hhmm = (minutesFrom9pm: number) => {
  const m = (BED_MIN + minutesFrom9pm) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
const toSlider = (bed: string) => {
  const [h, m] = bed.split(":").map(Number);
  const mins = h * 60 + m;
  return Math.max(0, Math.min(BED_RANGE, (mins < 12 * 60 ? mins + 1440 : mins) - BED_MIN));
};
const clockLabel = (bed: string) => formatClock(atClock("2026-01-15", bed)); // label only
const BED_OPTIONS = Array.from({ length: BED_RANGE / 30 + 1 }, (_, i) => hhmm(i * 30));

const fmtHours = (h: number) => {
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return mins ? `${whole} h ${mins} min` : `${whole} h`;
};

/** Longest run of tomorrow's waking points in a band, as [start, end] instants. */
function longestRun(f: Forecast, band: "low"): [number, number] | null {
  if (!f.bands) return null;
  let best: [number, number] | null = null;
  let start: number | null = null;
  for (const p of f.points) {
    const inBand =
      p.t >= f.wakeAt && !p.asleep && Number.isFinite(p.index) && bandOf(p.index, f.bands) === band;
    if (inBand && start === null) start = p.t;
    if (!inBand && start !== null) {
      if (!best || p.t - start > best[1] - best[0]) best = [start, p.t];
      start = null;
    }
  }
  return best;
}

function outlook(f: Forecast): { word: string; tone: string } {
  if (!f.bands) return { word: "Not enough data", tone: "text-haze" };
  const awake = f.points.filter((p) => !p.asleep && Number.isFinite(p.index));
  const low =
    awake.filter((p) => bandOf(p.index, f.bands!) === "low").length / Math.max(1, awake.length);
  if (low < 0.15) return { word: "Mostly clear", tone: "text-sage" };
  if (low < 0.35) return { word: "Patchy fog", tone: "text-moon" };
  return { word: "Heavy fog", tone: "text-coral" };
}

// ---------------------------------------------------------------- hydration gate

const subscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function ForecastScreen() {
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <div aria-busy="true" className="surface-night mt-8 h-80 animate-pulse rounded-[28px]">
        <span className="sr-only">Loading your forecast…</span>
      </div>
    );
  }
  return <ForecastApp />;
}

// ---------------------------------------------------------------- app

function ForecastApp() {
  const [today] = useState(() => edmontonDate(Date.now()));
  const [log, setLog] = useState<SleepLog>(() =>
    alignLogToToday(
      loadJSON(STORAGE_KEYS.sleepLog, isValidSleepLog, defaultSleepLog(today)),
      today,
    ),
  );
  const [events, setEvents] = useState<ScheduleEvent[]>(() =>
    loadJSON(
      STORAGE_KEYS.schedule,
      (x): x is ScheduleEvent[] => Array.isArray(x) && x.every(isValidEvent),
      [],
    ),
  );
  const [whatIfBed, setWhatIfBed] = useState<string | null>(null);
  const [compare, setCompare] = useState<[string, string]>(["23:30", "02:00"]);

  useEffect(() => saveJSON(STORAGE_KEYS.sleepLog, log), [log]);
  useEffect(() => saveJSON(STORAGE_KEYS.schedule, events), [events]);

  const bed = whatIfBed ?? log.plannedBed;
  const forecast = useMemo(
    () => buildForecast(log, events, today, { plannedBed: bed }),
    [log, events, today, bed],
  );
  const planned = useMemo(() => buildForecast(log, events, today), [log, events, today]);
  const compared = useMemo(
    () => compare.map((b) => buildForecast(log, events, today, { plannedBed: b })),
    [log, events, today, compare],
  );

  const sleepHours = (forecast.wakeAt - forecast.bedAt) / 3_600_000;
  const awakeToday = forecast.points.filter(
    (p) => p.t >= forecast.wakeAt && !p.asleep && Number.isFinite(p.index),
  );
  const peakAt = awakeToday.length
    ? awakeToday.reduce((best, p) => (p.index > best.index ? p : best)).t
    : null;
  const slump = longestRun(forecast, "low");
  const look = outlook(forecast);
  const tomorrowLabel = formatDay(atClock(forecast.day, "12:00"));
  const delta =
    whatIfBed && forecast.meanIndex !== null && planned.meanIndex !== null
      ? Math.round(forecast.meanIndex) - Math.round(planned.meanIndex)
      : 0;

  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-12">
      {/* ---------------- Forecast */}
      <section
        aria-labelledby="forecast-title"
        className="surface-night relative isolate overflow-hidden rounded-[28px] p-5 sm:p-7 lg:col-span-8"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-32 -z-10 size-96 bg-[radial-gradient(closest-side,rgb(243_223_165/0.14),transparent)]"
        />
        <p className="text-sm text-haze">Outlook for {tomorrowLabel}</p>
        <h2 id="forecast-title" className={`mt-1 text-3xl font-bold tracking-tight ${look.tone}`}>
          {look.word}
        </h2>
        <p className="mt-2 max-w-[60ch] leading-relaxed text-haze">
          Wake at{" "}
          <strong className="font-semibold text-starlight">{formatClock(forecast.wakeAt)}</strong>{" "}
          after {fmtHours(sleepHours)} of sleep.
          {/* Clock times already end in "a.m."/"p.m.", so they double as the full stop. */}
          {peakAt !== null && (
            <>
              {" "}
              Peak alertness around{" "}
              <span className="text-starlight tabular">{formatClock(peakAt)}</span>
              {slump ? "," : ""}
            </>
          )}
          {slump && (
            <>
              {" "}
              {peakAt !== null ? "lowest" : "Lowest"} around{" "}
              <span className="text-starlight tabular">{formatClock(slump[0])}</span>
            </>
          )}
        </p>

        <div className="mt-5">
          <AlertnessChart forecast={forecast} />
        </div>
        <ul
          className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-haze"
          aria-label="Chart legend"
        >
          <li className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="h-0.5 w-5 rounded-full bg-moon" /> Predicted
            alertness
          </li>
          <li className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-3 rounded-[4px] border border-dashed border-coral/60 bg-coral/15"
            />{" "}
            Low for you
          </li>
          <li className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="size-3 rounded-[4px] bg-lilac/20" /> Asleep
          </li>
          <li className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="h-1.5 w-4 rounded-sm bg-sage" />
            <span aria-hidden="true" className="-ml-1 h-1.5 w-4 rounded-sm bg-coral" /> Classes and
            exams
          </li>
        </ul>
        <details className="mt-4 text-sm">
          <summary className="min-h-11 cursor-pointer content-center text-haze underline underline-offset-4 hover:text-starlight">
            Show as a table
          </summary>
          <AlertnessTable forecast={forecast} />
        </details>
        <p className="mt-4 text-xs text-haze/80">
          Educational estimate from a published model of alertness, not a medical tool.{" "}
          <Link
            href="/forecast/how-it-works"
            className="underline underline-offset-4 hover:text-starlight"
          >
            How this works
          </Link>
        </p>
      </section>

      {/* ---------------- Warnings + what-if */}
      <div className="grid content-start gap-5 lg:col-span-4">
        <section aria-labelledby="warnings-title" className="surface-night rounded-3xl p-5 sm:p-6">
          <h2 id="warnings-title" className="text-lg font-bold text-starlight">
            Tomorrow&apos;s events
          </h2>
          {forecast.events.length === 0 ? (
            <p className="mt-2 text-sm leading-relaxed text-haze">
              Add tomorrow&apos;s classes, exams or shifts below to check which land in a slump.
            </p>
          ) : forecast.warnings.length === 0 ? (
            <p className="mt-2 rounded-xl border border-sage/30 bg-sage/10 px-3 py-2 text-sm text-starlight">
              None of your {forecast.events.length} event{forecast.events.length === 1 ? "" : "s"}{" "}
              land in a low-alertness window.
            </p>
          ) : (
            <ul className="mt-3 grid gap-3">
              {forecast.warnings.map((w) => (
                <li
                  key={w.event.id}
                  className="rounded-2xl border border-coral/35 bg-coral/10 p-3 text-sm leading-relaxed text-starlight"
                >
                  {w.message}
                  {w.reasons.includes("inertia") && (
                    <span className="mt-1 block text-haze">
                      Waking at least an hour before it (with an earlier bedtime to match) gets you
                      past the groggy first hour.
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="whatif-title" className="surface-night rounded-3xl p-5 sm:p-6">
          <h2 id="whatif-title" className="text-lg font-bold text-starlight">
            What if I sleep at…
          </h2>
          <label htmlFor="whatif" className="mt-1 block text-sm text-haze">
            Bedtime tonight:{" "}
            <span className="font-semibold text-moon tabular">{clockLabel(bed)}</span>
          </label>
          <input
            id="whatif"
            type="range"
            min={0}
            max={BED_RANGE}
            step={15}
            value={toSlider(bed)}
            onChange={(e) => setWhatIfBed(hhmm(Number(e.target.value)))}
            aria-valuetext={`Bedtime ${clockLabel(bed)}`}
            className="mt-3 h-11 w-full cursor-pointer accent-[var(--color-moon)]"
          />
          <div className="flex justify-between text-xs text-haze tabular">
            <span>9 p.m.</span>
            <span>4 a.m.</span>
          </div>
          <p className="mt-3 text-sm text-haze" aria-live="polite">
            {whatIfBed
              ? delta === 0
                ? "About the same alertness as your plan."
                : `${Math.abs(delta)} points ${delta > 0 ? "higher" : "lower"} on average than your plan.`
              : "Drag to see how tomorrow changes. The chart updates as you go."}
          </p>
          {whatIfBed && whatIfBed !== log.plannedBed && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setLog({ ...log, plannedBed: whatIfBed, edited: true });
                  setWhatIfBed(null);
                }}
                className="min-h-11 cursor-pointer rounded-full bg-moon px-4 text-sm font-semibold text-[#14182b] hover:brightness-105"
              >
                Make {clockLabel(whatIfBed)} my plan
              </button>
              <button
                type="button"
                onClick={() => setWhatIfBed(null)}
                className="min-h-11 cursor-pointer rounded-full border border-white/15 px-4 text-sm text-starlight hover:border-white/30"
              >
                Reset
              </button>
            </div>
          )}
        </section>

        {forecast.shortNights >= SHORT_NIGHTS_NOTE_THRESHOLD && (
          <section
            aria-label="Support"
            className="rounded-3xl border border-lilac/30 bg-lilac/10 p-5 text-sm leading-relaxed text-starlight"
          >
            Most of your logged nights were under 5 hours. That&apos;s a lot to carry. If it keeps
            happening, MRU Health Services and{" "}
            <a
              className="font-semibold underline underline-offset-4"
              href="https://www.mtroyal.ca/CampusServices/WellnessServices/index.htm"
            >
              Wellness Services
            </a>{" "}
            (Wellness Centre, U216) can help, free.
          </section>
        )}
      </div>

      {/* ---------------- Compare */}
      <section
        aria-labelledby="compare-title"
        className="surface-night rounded-3xl p-5 sm:p-6 lg:col-span-12"
      >
        <h2 id="compare-title" className="text-lg font-bold text-starlight">
          Compare two bedtimes
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {compared.map((f, i) => (
            <div key={i} className="rounded-2xl border border-white/10 p-4">
              <label className="text-sm text-haze">
                Bed at
                <select
                  value={compare[i]}
                  onChange={(e) => {
                    const next: [string, string] = [...compare];
                    next[i] = e.target.value;
                    setCompare(next);
                  }}
                  className="ml-2 min-h-11 rounded-xl border border-white/10 bg-[#0e1329] px-2 font-semibold text-moon"
                >
                  {BED_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {clockLabel(o)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-2">
                <AlertnessChart forecast={f} compact />
              </div>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <dt className="text-haze">Sleep</dt>
                  <dd className="font-semibold text-starlight tabular">
                    {fmtHours(
                      nightHours({ nightOf: today, bed: compare[i], wake: log.plannedWake }),
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-haze">Average</dt>
                  <dd className="font-semibold text-starlight tabular">
                    {f.meanIndex === null ? "–" : Math.round(f.meanIndex)}
                  </dd>
                </div>
                <div>
                  <dt className="text-haze">Warnings</dt>
                  <dd className="font-semibold text-starlight tabular">{f.warnings.length}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Inputs */}
      <section
        aria-labelledby="sleep-title"
        className="surface-night rounded-3xl p-5 sm:p-6 lg:col-span-6"
      >
        <h2 id="sleep-title" className="text-lg font-bold text-starlight">
          Your sleep
        </h2>
        <p className="mt-1 mb-4 text-sm text-haze">Saved on this device only.</p>
        <SleepLogEditor log={log} today={today} onChange={setLog} />
      </section>

      <section
        aria-labelledby="schedule-title"
        className="surface-night rounded-3xl p-5 sm:p-6 lg:col-span-6"
      >
        <h2 id="schedule-title" className="text-lg font-bold text-starlight">
          Your schedule
        </h2>
        <p className="mt-1 mb-4 text-sm text-haze">
          Classes, exams and shifts. Saved on this device only.
        </p>
        <ScheduleEditor events={events} today={today} onChange={setEvents} />
      </section>
    </div>
  );
}
