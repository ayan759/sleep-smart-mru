"use client";

import { useId, useRef, useState } from "react";
import { importIcs } from "@/lib/ics-import";
import { EVENT_TYPES, guessEventType, type EventType, type ScheduleEvent } from "@/lib/schedule";
import { addDays, atClock, edmontonDate, formatClock, formatDay } from "@/lib/time";

const inputClass =
  "min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-starlight [color-scheme:dark] focus-visible:border-moon/60";

const TYPE_DOT: Record<EventType, string> = {
  class: "bg-sage",
  exam: "bg-coral",
  work: "bg-lilac",
  other: "bg-haze",
};

export function ScheduleEditor({
  events,
  today,
  onChange,
}: {
  events: ScheduleEvent[];
  today: string;
  onChange: (events: ScheduleEvent[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const formId = useId();
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [draft, setDraft] = useState({
    title: "",
    date: addDays(today, 1),
    start: "09:00",
    end: "10:00",
  });

  async function onFile(file: File) {
    try {
      const text = await file.text();
      // Two weeks ahead covers tomorrow's forecast and the exam planner's window.
      const { events: imported, skippedAllDay } = importIcs(
        text,
        atClock(today, "00:00"),
        atClock(addDays(today, 15), "00:00"),
      );
      const manual = events.filter((e) => e.source === "manual");
      onChange([...manual, ...imported]);
      setStatus({
        tone: "ok",
        text: `Imported ${imported.length} event${imported.length === 1 ? "" : "s"} for the next 2 weeks${
          skippedAllDay ? ` (skipped ${skippedAllDay} all-day)` : ""
        }. Check the types below.`,
      });
    } catch {
      setStatus({
        tone: "error",
        text: "That file couldn't be read as a calendar. Export an .ics file from your calendar app and try again.",
      });
    }
  }

  function addManual() {
    const title = draft.title.trim();
    const start = atClock(draft.date, draft.start);
    const end = atClock(draft.date, draft.end);
    if (!title || end <= start) {
      setStatus({
        tone: "error",
        text: "Add a name, and make sure the event ends after it starts.",
      });
      return;
    }
    onChange([
      ...events,
      {
        id: `manual-${start.getTime()}-${title}`,
        title,
        type: guessEventType(title),
        start: start.toISOString(),
        end: end.toISOString(),
        source: "manual",
      },
    ]);
    setDraft({ ...draft, title: "" });
    setStatus({ tone: "ok", text: `Added ${title}.` });
  }

  const upcoming = [...events]
    .filter((e) => Date.parse(e.end) > atClock(today, "00:00").getTime())
    .sort((a, b) => a.start.localeCompare(b.start));
  const shown = upcoming.slice(0, 30);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="min-h-11 cursor-pointer rounded-full bg-moon px-5 font-semibold text-[#14182b] shadow-[0_0_24px_-6px_rgb(243_223_165/0.6)] hover:brightness-105"
        >
          Import .ics calendar
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".ics,text/calendar"
          className="sr-only"
          aria-label="Calendar file (.ics)"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = "";
          }}
        />
        <p className="text-sm text-haze">Read on your phone only. Nothing is uploaded.</p>
      </div>

      {status && (
        <p
          role={status.tone === "error" ? "alert" : "status"}
          className={`mt-3 rounded-xl border px-3 py-2 text-sm text-starlight ${
            status.tone === "error" ? "border-coral/40 bg-coral/10" : "border-sage/30 bg-sage/10"
          }`}
        >
          {status.text}
        </p>
      )}

      <form
        aria-labelledby={`${formId}-title`}
        className="mt-5 rounded-2xl border border-white/10 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          addManual();
        }}
      >
        <h3 id={`${formId}-title`} className="text-sm font-semibold text-starlight">
          Add an event by hand
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="col-span-2 text-xs text-haze">
            Name
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="COMP 2631 midterm"
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="col-span-2 text-xs text-haze sm:col-span-2">
            Date
            <input
              type="date"
              value={draft.date}
              min={today}
              onChange={(e) => e.target.value && setDraft({ ...draft, date: e.target.value })}
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="text-xs text-haze">
            Starts
            <input
              type="time"
              step={300}
              value={draft.start}
              onChange={(e) => e.target.value && setDraft({ ...draft, start: e.target.value })}
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="text-xs text-haze">
            Ends
            <input
              type="time"
              step={300}
              value={draft.end}
              onChange={(e) => e.target.value && setDraft({ ...draft, end: e.target.value })}
              className={`${inputClass} mt-1`}
            />
          </label>
          <div className="col-span-2 flex items-end">
            <button
              type="submit"
              className="min-h-11 w-full cursor-pointer rounded-full border border-white/15 px-4 font-medium text-starlight hover:border-white/30"
            >
              Add event
            </button>
          </div>
        </div>
      </form>

      {shown.length === 0 ? (
        <p className="mt-5 text-sm text-haze">
          No upcoming events yet. Import your class calendar or add tomorrow&apos;s classes, exams
          and shifts to see which ones land in a slump.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-white/5">
          {shown.map((e) => {
            const isTomorrow = edmontonDate(Date.parse(e.start)) === addDays(today, 1);
            return (
              <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                <span
                  aria-hidden="true"
                  className={`size-2.5 shrink-0 rounded-full ${TYPE_DOT[e.type]}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-starlight">{e.title}</p>
                  <p className="text-sm text-haze tabular">
                    {isTomorrow ? "Tomorrow" : formatDay(Date.parse(e.start))},{" "}
                    {formatClock(e.start)}–{formatClock(e.end)}
                  </p>
                </div>
                <label className="sr-only" htmlFor={`type-${e.id}`}>
                  Type of {e.title}
                </label>
                <select
                  id={`type-${e.id}`}
                  value={e.type}
                  onChange={(ev) =>
                    onChange(
                      events.map((x) =>
                        x.id === e.id ? { ...x, type: ev.target.value as EventType } : x,
                      ),
                    )
                  }
                  className="min-h-11 rounded-xl border border-white/10 bg-[#0e1329] px-2 text-sm text-starlight"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onChange(events.filter((x) => x.id !== e.id))}
                  className="min-h-11 cursor-pointer rounded-full px-3 text-sm text-haze underline underline-offset-4 hover:text-starlight"
                  aria-label={`Remove ${e.title}`}
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {upcoming.length > shown.length && (
        <p className="mt-2 text-sm text-haze">
          Showing the next {shown.length} of {upcoming.length} events.
        </p>
      )}
      {events.length > 0 && (
        <button
          type="button"
          onClick={() => {
            onChange([]);
            setStatus({ tone: "ok", text: "Cleared your schedule." });
          }}
          className="mt-3 min-h-11 cursor-pointer text-sm text-haze underline underline-offset-4 hover:text-starlight"
        >
          Clear all events
        </button>
      )}
    </div>
  );
}
