"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { alignLogToToday, defaultSleepLog, isValidSleepLog, type SleepLog } from "@/lib/forecast";
import {
  MAX_DAYS,
  buildPlanRequest,
  defaultInputs,
  googleCalendarLink,
  isValidInputs,
  planToIcs,
  suggestCourses,
  type CourseInput,
  type PlanInputs,
  type PlanOption,
  type PlanResponse,
} from "@/lib/plan";
import { isValidEvent, type ScheduleEvent } from "@/lib/schedule";
import { loadJSON, saveJSON, STORAGE_KEYS } from "@/lib/storage";
import { addDays, atClock, edmontonDate, formatClock, formatDay } from "@/lib/time";
import { useHydrated } from "@/lib/useHydrated";

type Stored = { inputs: PlanInputs; result: PlanResponse | null };

const inputClass =
  "min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-starlight [color-scheme:dark] focus-visible:border-moon/60";
const selectClass =
  "min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-[#0e1329] px-3 text-starlight";

export function PlanScreen() {
  const hydrated = useHydrated();
  if (!hydrated)
    return (
      <div aria-busy="true" className="surface-night mt-8 h-96 animate-pulse rounded-[28px]" />
    );
  return <PlanApp />;
}

// ------------------------------------------------------------------ helpers

const fmtH = (h: number) => `${Number(h.toFixed(1))} h`;
const dayLabel = (ymd: string) => formatDay(atClock(ymd, "12:00"));

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="min-w-0 text-sm text-haze">
      {label}
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs text-haze/80">{hint}</span>}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string | number;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ------------------------------------------------------------------ app

function PlanApp() {
  const [today] = useState(() => edmontonDate(Date.now()));
  const [log] = useState<SleepLog>(() =>
    alignLogToToday(
      loadJSON(STORAGE_KEYS.sleepLog, isValidSleepLog, defaultSleepLog(today)),
      today,
    ),
  );
  const [schedule] = useState<ScheduleEvent[]>(() =>
    loadJSON(
      STORAGE_KEYS.schedule,
      (x): x is ScheduleEvent[] => Array.isArray(x) && x.every(isValidEvent),
      [],
    ),
  );
  const [stored] = useState<Stored | null>(() =>
    loadJSON(
      STORAGE_KEYS.plan,
      (x): x is Stored => !!x && typeof x === "object" && isValidInputs((x as Stored).inputs),
      null as unknown as Stored,
    ),
  );
  const [inputs, setInputs] = useState<PlanInputs>(() => {
    const base = stored?.inputs ?? defaultInputs(today, log, schedule);
    // Never plan in the past.
    return base.startDate < today ? { ...base, startDate: addDays(today, 1) } : base;
  });
  const [result, setResult] = useState<PlanResponse | null>(stored?.result ?? null);
  const [status, setStatus] = useState<{ kind: "idle" | "loading" | "error"; text?: string }>({
    kind: "idle",
  });

  useEffect(() => saveJSON(STORAGE_KEYS.plan, { inputs, result }), [inputs, result]);

  const update = (patch: Partial<PlanInputs>) => setInputs((p) => ({ ...p, ...patch }));
  const windowEnd = addDays(inputs.startDate, inputs.days);
  const inWindow = useMemo(() => {
    const from = atClock(inputs.startDate, "00:00").getTime();
    const to = atClock(windowEnd, "00:00").getTime();
    return schedule
      .filter((e) => Date.parse(e.end) > from && Date.parse(e.start) < to)
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [schedule, inputs.startDate, windowEnd]);
  const exams = inWindow.filter((e) => e.type === "exam");

  async function build(next: PlanInputs = inputs) {
    if (next.courses.length === 0) {
      setStatus({ kind: "error", text: "Add at least one course to plan for." });
      return;
    }
    setStatus({ kind: "loading" });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 40_000);
    try {
      const res = await fetch("/api/py/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPlanRequest(next, schedule, log)),
        signal: controller.signal,
      });
      if (res.status === 422) {
        setStatus({
          kind: "error",
          text: "Some settings aren't valid. Check each course has hours and an exam time.",
        });
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setResult((await res.json()) as PlanResponse);
      setStatus({ kind: "idle" });
      requestAnimationFrame(() =>
        document.getElementById("plan-result")?.scrollIntoView({ behavior: "smooth" }),
      );
    } catch {
      setStatus({
        kind: "error",
        text: "The planner didn't respond. Check your connection and try again.",
      });
    } finally {
      clearTimeout(timer);
    }
  }

  function applyOption(o: PlanOption) {
    const next = { ...inputs };
    if (o.kind === "reduce_hours" && o.course_id && typeof o.value === "number") {
      next.courses = inputs.courses.map((c) =>
        c.id === o.course_id ? { ...c, hours: o.value as number } : c,
      );
    } else if (o.kind === "start_earlier" && typeof o.value === "number") {
      const earliest = addDays(today, 1);
      const wanted = addDays(inputs.startDate, -o.value);
      const start = wanted < earliest ? earliest : wanted;
      const shift = Math.round((Date.parse(inputs.startDate) - Date.parse(start)) / 86_400_000);
      next.startDate = start;
      next.days = Math.min(MAX_DAYS, inputs.days + shift);
    } else if (o.kind === "raise_daily_cap" && typeof o.value === "number") {
      next.dailyCapHours = o.value;
    } else if ((o.kind === "move_optional" || o.kind === "fix_sleep_conflict") && o.event_id) {
      next.skippedIds = [...new Set([...inputs.skippedIds, o.event_id])];
    } else if (o.kind === "fix_sleep_conflict" && typeof o.value === "number") {
      next.driftMinutes = o.value;
    }
    setInputs(next);
    void build(next);
  }

  const courseName = (id: string) => inputs.courses.find((c) => c.id === id)?.name ?? "Course";

  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-12">
      {/* ---------------- Courses */}
      <section
        aria-labelledby="courses-title"
        className="surface-night rounded-3xl p-5 sm:p-6 lg:col-span-7"
      >
        <h2 id="courses-title" className="text-lg font-bold text-starlight">
          Your exams
        </h2>
        <p className="mt-1 text-sm text-haze">
          How many hours does each course need before its exam?
        </p>
        <CoursesEditor
          courses={inputs.courses}
          exams={exams}
          startDate={inputs.startDate}
          onChange={(courses) => update({ courses })}
          onSuggest={() =>
            update({ courses: suggestCourses(schedule, inputs.startDate, inputs.days) })
          }
        />
      </section>

      {/* ---------------- Rules */}
      <section
        aria-labelledby="rules-title"
        className="surface-night rounded-3xl p-5 sm:p-6 lg:col-span-5"
      >
        <h2 id="rules-title" className="text-lg font-bold text-starlight">
          Your rules
        </h2>
        <p className="mt-1 text-sm text-haze">
          Sleep never drops below 7 hours, whatever you set here.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Start planning">
            <input
              type="date"
              value={inputs.startDate}
              min={today}
              onChange={(e) => e.target.value && update({ startDate: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="For">
            <Select
              value={inputs.days}
              onChange={(v) => update({ days: Number(v) })}
              options={Array.from({ length: MAX_DAYS }, (_, i) => ({
                value: i + 1,
                label: `${i + 1} day${i ? "s" : ""}`,
              }))}
            />
          </Field>
          <Field label="Wake up at">
            <input
              type="time"
              step={1800}
              value={inputs.preferredWake}
              onChange={(e) => e.target.value && update({ preferredWake: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Sleep target">
            <Select
              value={inputs.targetHours}
              onChange={(v) => update({ targetHours: Number(v) })}
              options={[7, 7.5, 8, 8.5, 9].map((h) => ({ value: h, label: fmtH(h) }))}
            />
          </Field>
          <Field label="Wake time can shift">
            <Select
              value={inputs.driftMinutes}
              onChange={(v) => update({ driftMinutes: Number(v) })}
              options={[
                { value: 0, label: "Not at all" },
                { value: 30, label: "± 30 min" },
                { value: 60, label: "± 1 h" },
              ]}
            />
          </Field>
          <Field label="Longest study block">
            <Select
              value={inputs.maxBlockMinutes}
              onChange={(v) => update({ maxBlockMinutes: Number(v) })}
              options={[60, 90, 120].map((m) => ({
                value: m,
                label: m === 60 ? "1 h" : m === 90 ? "1 h 30 min" : "2 h",
              }))}
            />
          </Field>
          <Field label="Daily study limit">
            <Select
              value={inputs.dailyCapHours}
              onChange={(v) => update({ dailyCapHours: Number(v) })}
              options={[2, 3, 4, 5, 6, 7, 8, 9, 10].map((h) => ({ value: h, label: fmtH(h) }))}
            />
          </Field>
          <Field label="Travel time around events">
            <Select
              value={inputs.commuteMinutes}
              onChange={(v) => update({ commuteMinutes: Number(v) })}
              options={[0, 15, 30, 45, 60].map((m) => ({
                value: m,
                label: m ? `${m} min` : "None",
              }))}
            />
          </Field>
        </div>
      </section>

      {/* ---------------- Busy times */}
      <section
        aria-labelledby="busy-title"
        className="surface-night rounded-3xl p-5 sm:p-6 lg:col-span-12"
      >
        <h2 id="busy-title" className="text-lg font-bold text-starlight">
          Busy times
        </h2>
        <p className="mt-1 text-sm text-haze">
          {inWindow.length
            ? `${inWindow.length} class${inWindow.length === 1 ? "" : "es"}, exams and shifts from your Sleep Weather schedule fall in this window. Tick any you could move if time runs short.`
            : "No classes or shifts yet. Add your schedule in Sleep Weather so the plan works around them."}{" "}
          <Link
            href="/forecast#schedule-title"
            className="text-starlight underline underline-offset-4"
          >
            Edit schedule
          </Link>
        </p>
        {inWindow.some((e) => e.type === "work" || e.type === "other") && (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {inWindow
              .filter((e) => e.type === "work" || e.type === "other")
              .map((e) => {
                const skipped = inputs.skippedIds.includes(e.id);
                return (
                  <li key={e.id}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-starlight">
                      <input
                        type="checkbox"
                        checked={inputs.optionalIds.includes(e.id)}
                        onChange={(ev) =>
                          update({
                            optionalIds: ev.target.checked
                              ? [...inputs.optionalIds, e.id]
                              : inputs.optionalIds.filter((x) => x !== e.id),
                          })
                        }
                        className="size-4 accent-[var(--color-moon)]"
                      />
                      <span
                        className={`min-w-0 flex-1 ${skipped ? "line-through opacity-60" : ""}`}
                      >
                        {e.title}, {formatDay(Date.parse(e.start))} {formatClock(e.start)}
                      </span>
                      {skipped && (
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.preventDefault();
                            update({ skippedIds: inputs.skippedIds.filter((x) => x !== e.id) });
                          }}
                          className="text-xs text-haze underline"
                        >
                          Put back
                        </button>
                      )}
                    </label>
                  </li>
                );
              })}
          </ul>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => void build()}
            disabled={status.kind === "loading"}
            className="min-h-12 cursor-pointer rounded-full bg-moon px-7 font-semibold text-[#14182b] shadow-[0_0_28px_-6px_rgb(243_223_165/0.6)] hover:brightness-105 disabled:cursor-wait disabled:opacity-70"
          >
            {status.kind === "loading"
              ? "Building your plan…"
              : result
                ? "Rebuild my plan"
                : "Build my plan"}
          </button>
          <p className="text-sm text-haze" aria-live="polite">
            {status.kind === "loading" ? (
              "Checking thousands of schedules. This takes up to 10 seconds."
            ) : status.kind === "error" ? (
              <span className="text-coral">{status.text}</span>
            ) : (
              "Plans stay on this device."
            )}
          </p>
        </div>
      </section>

      {result && (
        <PlanResult
          plan={result}
          inputs={inputs}
          schedule={inWindow}
          courseName={courseName}
          onOption={applyOption}
          busy={status.kind === "loading"}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------------ courses editor

function CoursesEditor({
  courses,
  exams,
  startDate,
  onChange,
  onSuggest,
}: {
  courses: CourseInput[];
  exams: ScheduleEvent[];
  startDate: string;
  onChange: (c: CourseInput[]) => void;
  onSuggest: () => void;
}) {
  const set = (i: number, patch: Partial<CourseInput>) =>
    onChange(courses.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  return (
    <div className="mt-4">
      {courses.length === 0 && (
        <p className="mb-3 rounded-xl border border-white/10 px-3 py-2 text-sm text-haze">
          Add the courses you&apos;re studying for. Exams in your Sleep Weather schedule fill in
          automatically.
          {exams.length > 0 && (
            <button
              type="button"
              onClick={onSuggest}
              className="ml-1 font-semibold text-starlight underline underline-offset-4"
            >
              Use my {exams.length} exam{exams.length === 1 ? "" : "s"}
            </button>
          )}
        </p>
      )}
      <ul className="grid gap-3">
        {courses.map((c, i) => (
          <li key={c.id} className="rounded-2xl border border-white/10 p-3">
            <div className="grid grid-cols-[1fr_7rem] gap-3">
              <Field label="Course">
                <input
                  value={c.name}
                  onChange={(e) => set(i, { name: e.target.value })}
                  placeholder="COMP 2631"
                  className={inputClass}
                />
              </Field>
              <Field label="Study hours">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0.5}
                  max={80}
                  step={0.5}
                  value={c.hours}
                  onChange={(e) =>
                    set(i, { hours: Math.max(0.5, Math.min(80, Number(e.target.value) || 0.5)) })
                  }
                  className={`${inputClass} tabular`}
                />
              </Field>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Exam">
                <Select
                  value={c.examEventId ?? "__custom"}
                  onChange={(v) => set(i, { examEventId: v === "__custom" ? null : v })}
                  options={[
                    ...exams.map((e) => ({
                      value: e.id,
                      label: `${e.title}, ${formatDay(Date.parse(e.start))}`,
                    })),
                    { value: "__custom", label: "Pick a date and time" },
                  ]}
                />
              </Field>
              {c.examEventId === null ? (
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Date">
                    <input
                      type="date"
                      min={startDate}
                      value={c.examDate}
                      onChange={(e) => e.target.value && set(i, { examDate: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Time">
                    <input
                      type="time"
                      value={c.examTime}
                      onChange={(e) => e.target.value && set(i, { examTime: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                </div>
              ) : (
                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() => onChange(courses.filter((_, j) => j !== i))}
                    className="min-h-11 text-sm text-haze underline underline-offset-4 hover:text-starlight"
                    aria-label={`Remove ${c.name || "course"}`}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            {c.examEventId === null && (
              <button
                type="button"
                onClick={() => onChange(courses.filter((_, j) => j !== i))}
                className="mt-2 min-h-11 text-sm text-haze underline underline-offset-4 hover:text-starlight"
                aria-label={`Remove ${c.name || "course"}`}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={courses.length >= 8}
        onClick={() =>
          onChange([
            ...courses,
            {
              id: `c${Date.now()}`,
              name: "",
              hours: 6,
              examEventId: null,
              examDate: addDays(startDate, Math.min(6, MAX_DAYS - 1)),
              examTime: "09:00",
            },
          ])
        }
        className="mt-3 min-h-11 cursor-pointer rounded-full border border-white/15 px-4 text-sm font-medium text-starlight hover:border-white/30 disabled:opacity-50"
      >
        Add a course
      </button>
    </div>
  );
}

// ------------------------------------------------------------------ results

type Item = {
  kind: "sleep-wake" | "sleep-bed" | "study" | "event";
  start: string;
  end: string;
  title: string;
  detail?: string;
  type?: string;
  courseId?: string;
};

function itemsByDay(
  plan: PlanResponse,
  events: ScheduleEvent[],
  courseName: (id: string) => string,
) {
  const days = new Map<string, Item[]>();
  const push = (ymd: string, it: Item) => days.set(ymd, [...(days.get(ymd) ?? []), it]);
  for (const b of plan.sleep) {
    push(edmontonDate(Date.parse(b.bed)), {
      kind: "sleep-bed",
      start: b.bed,
      end: b.wake,
      title: "Lights out",
      detail: `${b.hours} h of sleep`,
    });
    push(edmontonDate(Date.parse(b.wake)), {
      kind: "sleep-wake",
      start: b.wake,
      end: b.wake,
      title: "Wake up",
    });
  }
  for (const s of plan.sessions)
    push(edmontonDate(Date.parse(s.start)), {
      kind: "study",
      start: s.start,
      end: s.end,
      title: courseName(s.course_id),
      courseId: s.course_id,
    });
  for (const e of events)
    push(edmontonDate(Date.parse(e.start)), {
      kind: "event",
      start: e.start,
      end: e.end,
      title: e.title,
      type: e.type,
    });
  for (const list of days.values()) list.sort((a, b) => a.start.localeCompare(b.start));
  return days;
}

const ITEM_STYLE: Record<string, string> = {
  study: "border-moon/45 border-l-[3px] border-l-moon bg-moon/[0.18]",
  "sleep-bed": "border-lilac/30 border-l-[3px] border-l-lilac bg-lilac/[0.12]",
  "sleep-wake": "border-lilac/30 border-l-[3px] border-l-lilac bg-lilac/[0.12]",
  class: "border-sage/35 border-l-[3px] border-l-sage bg-sage/[0.14]",
  exam: "border-coral/45 border-l-[3px] border-l-coral bg-coral/[0.22]",
  work: "border-white/15 border-l-[3px] border-l-haze bg-white/[0.07]",
  other: "border-white/15 border-l-[3px] border-l-haze bg-white/[0.07]",
};

function PlanResult({
  plan,
  inputs,
  schedule,
  courseName,
  onOption,
  busy,
}: {
  plan: PlanResponse;
  inputs: PlanInputs;
  schedule: ScheduleEvent[];
  courseName: (id: string) => string;
  onOption: (o: PlanOption) => void;
  busy: boolean;
}) {
  const [includeSleep, setIncludeSleep] = useState(false);
  const days = Array.from({ length: inputs.days }, (_, d) => addDays(inputs.startDate, d));
  const byDay = itemsByDay(plan, schedule, courseName);
  const studied = plan.totals.reduce((a, t) => a + t.planned_hours, 0);
  const minSleep = plan.sleep.length ? Math.min(...plan.sleep.map((b) => b.hours)) : null;
  const wake = plan.sleep[0] ? formatClock(plan.sleep[0].wake) : null;

  function download() {
    const ics = planToIcs(plan, courseName, { includeSleep });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "sleep-smart-study-plan.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <section
        id="plan-result"
        aria-labelledby="result-title"
        className={`surface-night relative isolate overflow-hidden rounded-[28px] p-5 sm:p-7 lg:col-span-12 ${busy ? "opacity-60" : ""}`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-32 -z-10 size-96 bg-[radial-gradient(closest-side,rgb(210_222_156/0.12),transparent)]"
        />
        {plan.infeasibility ? (
          <>
            <h2 id="result-title" className="text-2xl font-bold tracking-tight text-coral">
              Not everything fits
            </h2>
            <p className="mt-2 max-w-[70ch] leading-relaxed text-starlight">
              {plan.infeasibility.summary}
            </p>
            {plan.infeasibility.shortfalls.length > 0 && (
              <ul className="mt-3 grid gap-1 text-sm text-haze">
                {plan.infeasibility.shortfalls.map((s) => (
                  <li key={s.course_id}>
                    <span className="text-starlight">{courseName(s.course_id)}:</span> {s.reason}
                  </li>
                ))}
              </ul>
            )}
            {plan.infeasibility.options.length > 0 && (
              <>
                <h3 className="mt-5 text-sm font-semibold text-starlight">Try one of these</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {plan.infeasibility.options.map((o, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={busy}
                      onClick={() => onOption(o)}
                      className="min-h-11 cursor-pointer rounded-full border border-moon/40 bg-moon/10 px-4 text-left text-sm text-starlight hover:bg-moon/20 disabled:opacity-50"
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <h2 id="result-title" className="text-2xl font-bold tracking-tight text-sage">
              Your plan is ready
            </h2>
            <p className="mt-2 max-w-[70ch] leading-relaxed text-starlight">
              {fmtH(studied)} of study across {inputs.days} days, at least{" "}
              {minSleep !== null ? fmtH(minSleep) : "7 h"} of sleep every night
              {wake ? `, waking around ${wake}` : "."}
            </p>
          </>
        )}

        {plan.totals.length > 0 && (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {plan.totals.map((t) => (
              <li key={t.course_id} className="rounded-2xl border border-white/10 p-3">
                <p className="font-medium text-starlight">{courseName(t.course_id)}</p>
                <p className="text-sm text-haze tabular">
                  {fmtH(t.planned_hours)} of {fmtH(t.required_hours)}
                </p>
                <div
                  aria-hidden="true"
                  className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]"
                >
                  <div
                    className={`h-full rounded-full ${t.planned_hours >= t.required_hours ? "bg-sage" : "bg-coral"}`}
                    style={{
                      width: `${Math.min(100, (100 * t.planned_hours) / t.required_hours)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {plan.sessions.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={download}
              className="min-h-11 cursor-pointer rounded-full bg-moon px-5 font-semibold text-[#14182b] hover:brightness-105"
            >
              Download calendar (.ics)
            </button>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-haze">
              <input
                type="checkbox"
                checked={includeSleep}
                onChange={(e) => setIncludeSleep(e.target.checked)}
                className="size-4 accent-[var(--color-moon)]"
              />
              Include sleep times
            </label>
            <p className="text-xs text-haze/80">
              Opens in Google Calendar, Apple Calendar or Outlook.
            </p>
          </div>
        )}
      </section>

      {(plan.sessions.length > 0 || plan.sleep.length > 0) && (
        <>
          {/* Phones and tablets: day-by-day list */}
          <section aria-label="Day-by-day plan" className="grid gap-4 lg:hidden">
            {days.map((d) => (
              <DayCard key={d} ymd={d} items={byDay.get(d) ?? []} />
            ))}
          </section>
          {/* Laptops: week grid */}
          <WeekGrid days={days} byDay={byDay} />
        </>
      )}
    </>
  );
}

function DayCard({ ymd, items }: { ymd: string; items: Item[] }) {
  return (
    <article className="surface-night rounded-3xl p-4">
      <h3 className="font-semibold text-starlight">{dayLabel(ymd)}</h3>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-haze">Nothing planned.</p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {items.map((it, i) => (
            <li
              key={i}
              className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-3 py-2 text-sm ${ITEM_STYLE[it.kind === "event" ? (it.type ?? "other") : it.kind]}`}
            >
              <span className="w-24 shrink-0 text-haze tabular">
                {it.kind === "sleep-wake"
                  ? formatClock(it.start)
                  : `${formatClock(it.start)}${it.kind === "sleep-bed" ? "" : `–${formatClock(it.end)}`}`}
              </span>
              <span className="min-w-0 flex-1 text-starlight">
                {it.kind === "study" ? `Study ${it.title}` : it.title}
                {it.detail && <span className="text-haze">, {it.detail}</span>}
              </span>
              {it.kind === "study" && (
                <a
                  href={googleCalendarLink(
                    `Study: ${it.title}`,
                    it.start,
                    it.end,
                    "Planned by Sleep Smart MRU.",
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="basis-full pl-[6.75rem] text-xs text-haze underline underline-offset-4 hover:text-starlight sm:basis-auto sm:pl-0"
                >
                  Add to Google Calendar
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

const hourLabel = (minutes: number) => {
  const h = Math.floor(minutes / 60) % 24;
  return h === 0 ? "12 a.m." : h === 12 ? "Noon" : h < 12 ? `${h} a.m.` : `${h - 12} p.m.`;
};

const GRID_FROM = 6 * 60; // 6 a.m.
const GRID_TO = 26 * 60; // 2 a.m. next day
const PX_PER_MIN = 0.62;

function WeekGrid({ days, byDay }: { days: string[]; byDay: Map<string, Item[]> }) {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(days.length / 7);
  const shown = days.slice(page * 7, page * 7 + 7);
  const minutesFrom = (ymd: string, iso: string) =>
    (Date.parse(iso) - atClock(ymd, "00:00").getTime()) / 60_000;
  const height = (GRID_TO - GRID_FROM) * PX_PER_MIN;

  return (
    <section
      aria-label="Week view of the plan"
      className="surface-night hidden rounded-[28px] p-5 lg:col-span-12 lg:block"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-starlight">Week view</h2>
        {pages > 1 && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="min-h-10 rounded-full border border-white/15 px-4 text-sm text-starlight disabled:opacity-40"
            >
              Previous week
            </button>
            <button
              type="button"
              disabled={page >= pages - 1}
              onClick={() => setPage(page + 1)}
              className="min-h-10 rounded-full border border-white/15 px-4 text-sm text-starlight disabled:opacity-40"
            >
              Next week
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] gap-x-2">
        <div />
        {shown.map((d) => (
          <p key={d} className="pb-2 text-center text-sm font-medium text-starlight">
            {dayLabel(d)}
          </p>
        ))}
        <div className="relative" style={{ height }}>
          {Array.from(
            { length: (GRID_TO - GRID_FROM) / 120 + 1 },
            (_, i) => GRID_FROM + i * 120,
          ).map((m) => (
            <span
              key={m}
              className="absolute right-1 -translate-y-1/2 text-[11px] text-haze/70 tabular"
              style={{ top: (m - GRID_FROM) * PX_PER_MIN }}
            >
              {hourLabel(m)}
            </span>
          ))}
        </div>
        {shown.map((d) => (
          <div
            key={d}
            className="relative rounded-xl border border-white/[0.06] bg-white/[0.02]"
            style={{ height }}
          >
            {(byDay.get(d) ?? [])
              .filter((it) => it.kind !== "sleep-wake")
              .map((it, i) => {
                const a = Math.max(GRID_FROM, minutesFrom(d, it.start));
                const b = Math.min(GRID_TO, minutesFrom(d, it.end));
                if (b <= GRID_FROM || a >= GRID_TO || b <= a) return null;
                return (
                  <div
                    key={i}
                    title={`${it.kind === "study" ? "Study " : ""}${it.title}, ${formatClock(it.start)}–${formatClock(it.end)}`}
                    className={`absolute inset-x-1 overflow-hidden rounded-lg border px-1.5 py-0.5 text-[11px] leading-tight text-starlight ${ITEM_STYLE[it.kind === "event" ? (it.type ?? "other") : it.kind]}`}
                    style={{
                      top: (a - GRID_FROM) * PX_PER_MIN,
                      height: Math.max(14, (b - a) * PX_PER_MIN),
                    }}
                  >
                    {it.kind === "sleep-bed" ? "Sleep" : it.title}
                  </div>
                );
              })}
            {/* Morning part of the previous night's sleep */}
            {(byDay.get(d) ?? [])
              .filter((it) => it.kind === "sleep-wake")
              .map((it, i) => {
                const b = Math.min(GRID_TO, minutesFrom(d, it.start));
                if (b <= GRID_FROM) return null;
                return (
                  <div
                    key={`w${i}`}
                    className={`absolute inset-x-1 rounded-lg border px-1.5 py-0.5 text-[11px] text-starlight ${ITEM_STYLE["sleep-wake"]}`}
                    style={{ top: 0, height: (b - GRID_FROM) * PX_PER_MIN }}
                  >
                    Sleep
                  </div>
                );
              })}
          </div>
        ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-haze" aria-label="Legend">
        <li className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-3 rounded border-l-[3px] border-l-moon bg-moon/[0.18]"
          />{" "}
          Study
        </li>
        <li className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-3 rounded border-l-[3px] border-l-lilac bg-lilac/[0.12]"
          />{" "}
          Sleep
        </li>
        <li className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-3 rounded border-l-[3px] border-l-sage bg-sage/[0.14]"
          />{" "}
          Class
        </li>
        <li className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-3 rounded border-l-[3px] border-l-coral bg-coral/[0.22]"
          />{" "}
          Exam
        </li>
        <li className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-3 rounded border-l-[3px] border-l-haze bg-white/[0.07]"
          />{" "}
          Work or other
        </li>
      </ul>
    </section>
  );
}
