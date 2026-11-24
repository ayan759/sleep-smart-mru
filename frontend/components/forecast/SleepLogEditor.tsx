"use client";

import { nightHours, type SleepLog, type SleepNight } from "@/lib/forecast";
import { addDays, formatDay, atClock } from "@/lib/time";

const fmtHours = (h: number) => {
  if (h <= 0) return "check times";
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return mins ? `${whole} h ${mins} min` : `${whole} h`;
};

const inputClass =
  "min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-starlight tabular [color-scheme:dark] focus-visible:border-moon/60";

export function SleepLogEditor({
  log,
  today,
  onChange,
}: {
  log: SleepLog;
  today: string;
  onChange: (log: SleepLog) => void;
}) {
  const update = (patch: Partial<SleepLog>) => onChange({ ...log, ...patch, edited: true });
  const updateNight = (i: number, patch: Partial<SleepNight>) =>
    update({ nights: log.nights.map((n, j) => (j === i ? { ...n, ...patch } : n)) });
  const tonightHours = nightHours({ nightOf: today, bed: log.plannedBed, wake: log.plannedWake });

  return (
    <div>
      {!log.edited && (
        <p className="mb-4 rounded-xl border border-moon/25 bg-moon/10 px-3 py-2 text-sm text-starlight">
          These are example times. Change them to match how you actually slept.
        </p>
      )}

      <fieldset className="rounded-2xl border border-moon/20 bg-moon/[0.04] p-4">
        <legend className="px-1 text-sm font-semibold text-moon">Tonight&apos;s plan</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="min-w-0 text-sm text-haze">
            Bedtime
            <input
              type="time"
              step={900}
              value={log.plannedBed}
              onChange={(e) => e.target.value && update({ plannedBed: e.target.value })}
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="min-w-0 text-sm text-haze">
            Wake up
            <input
              type="time"
              step={900}
              value={log.plannedWake}
              onChange={(e) => e.target.value && update({ plannedWake: e.target.value })}
              className={`${inputClass} mt-1`}
            />
          </label>
        </div>
        <p className="mt-2 text-sm text-haze tabular">
          That&apos;s {fmtHours(tonightHours)} of sleep, waking {formatDay(atClock(addDays(today, 1), "12:00"))}.
        </p>
      </fieldset>

      <h3 className="mt-6 text-sm font-semibold text-starlight">Last 7 nights</h3>
      <ul className="mt-2 divide-y divide-white/5">
        {log.nights.map((n, i) => {
          const hours = nightHours(n);
          return (
            <li
              key={n.nightOf}
              className="grid grid-cols-[1fr_1fr] gap-x-3 gap-y-2 py-3 sm:grid-cols-[8.5rem_1fr_1fr_auto] sm:items-end lg:grid-cols-2"
            >
              <div className="col-span-2 flex items-baseline justify-between sm:col-span-1 sm:block lg:col-span-2 lg:flex">
                <p className="font-medium text-starlight">
                  {formatDay(atClock(n.nightOf, "12:00"))} night
                </p>
                <p
                  className={`text-sm tabular ${hours > 0 && hours < 5 ? "text-coral" : "text-haze"}`}
                >
                  {fmtHours(hours)}
                </p>
              </div>
              <label className="min-w-0 text-xs text-haze">
                Bed
                <input
                  type="time"
                  step={900}
                  value={n.bed}
                  onChange={(e) => e.target.value && updateNight(i, { bed: e.target.value })}
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="min-w-0 text-xs text-haze">
                Woke
                <input
                  type="time"
                  step={900}
                  value={n.wake}
                  onChange={(e) => e.target.value && updateNight(i, { wake: e.target.value })}
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="col-span-2 flex min-h-11 cursor-pointer items-center gap-2 text-sm text-haze sm:col-span-1 lg:col-span-2">
                <input
                  type="checkbox"
                  checked={n.freeDay}
                  onChange={(e) => updateNight(i, { freeDay: e.target.checked })}
                  className="size-4 accent-[var(--color-moon)]"
                />
                No class or work next day
              </label>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() =>
          update({
            nights: log.nights.map((n) => ({ ...n, bed: log.plannedBed, wake: log.plannedWake })),
          })
        }
        className="mt-3 min-h-11 cursor-pointer rounded-full border border-white/15 px-4 text-sm font-medium text-starlight hover:border-white/30"
      >
        Copy tonight&apos;s plan to all 7 nights
      </button>
    </div>
  );
}
