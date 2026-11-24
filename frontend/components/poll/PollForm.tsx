"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BARRIERS,
  CONSENT_LINE,
  FACULTIES,
  MAX_BARRIERS,
  MAX_SUPPORTS,
  POLL_ID,
  SLEEP_BUCKETS,
  SUPPORTS,
  YEARS,
  labelOf,
  type Option,
} from "@/lib/poll/options";
import { useHydrated } from "@/lib/useHydrated";

const STORAGE_KEY = `ssm:v1:poll:${POLL_ID}`;
type Saved = { token: string; submitted: boolean };

function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Saved>) : null;
    if (parsed && typeof parsed.token === "string" && /^[A-Za-z0-9-]{16,64}$/.test(parsed.token))
      return { token: parsed.token, submitted: parsed.submitted === true };
  } catch {
    // fall through
  }
  const fresh = { token: crypto.randomUUID(), submitted: false };
  saveSaved(fresh);
  return fresh;
}
function saveSaved(s: Saved) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // private mode: still works for this visit
  }
}

function Chip({
  label,
  selected,
  disabled,
  onClick,
  role = "checkbox",
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  role?: "checkbox" | "radio";
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`min-h-11 w-full cursor-pointer rounded-2xl border px-3 py-2 text-left text-sm leading-snug transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        selected
          ? "border-lilac/70 bg-lilac/15 text-starlight shadow-[0_0_16px_-4px_rgb(230_194_222/0.6)]"
          : "border-white/12 bg-white/[0.04] text-starlight hover:border-white/25"
      }`}
    >
      {selected && (
        <span aria-hidden="true" className="mr-1.5 text-lilac">
          ✓
        </span>
      )}
      {label}
    </button>
  );
}

function Question({
  n,
  title,
  hint,
  error,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const id = `q${n}`;
  return (
    <fieldset aria-describedby={error ? `${id}-err` : undefined} className="mt-8 first:mt-0">
      <legend className="text-lg font-semibold text-starlight">
        <span className="mr-2 text-haze tabular">{n}.</span>
        {title}
      </legend>
      {hint && <p className="mt-1 text-sm text-haze">{hint}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{children}</div>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-2 text-sm text-coral">
          {error}
        </p>
      )}
    </fieldset>
  );
}

const selectClass =
  "mt-1 min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-[#0e1329] px-3 text-starlight";

function OptionalSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly Option[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="min-w-0 text-sm text-haze">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        <option value="">Prefer not to say</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PollScreen() {
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <div aria-busy="true" className="surface-night mt-6 h-96 animate-pulse rounded-[28px]">
        <span className="sr-only">Loading the poll…</span>
      </div>
    );
  }
  return <PollForm />;
}

function PollForm() {
  const [saved, setSaved] = useState<Saved>(loadSaved);
  const [barriers, setBarriers] = useState<string[]>([]);
  const [top, setTop] = useState<string | null>(null);
  const [supports, setSupports] = useState<string[]>([]);
  const [year, setYear] = useState("");
  const [faculty, setFaculty] = useState("");
  const [sleep, setSleep] = useState("");
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const markSubmitted = () => {
    const next = { ...saved, submitted: true };
    saveSaved(next);
    setSaved(next);
  };

  if (saved.submitted) {
    return (
      <div className="surface-night relative isolate mt-6 overflow-hidden rounded-[28px] p-6 text-center sm:p-10">
        <div
          aria-hidden="true"
          className="poll-thanks-glow pointer-events-none absolute inset-0 -z-10"
        />
        <p className="text-5xl" aria-hidden="true">
          ✦
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-starlight" role="status">
          Thanks, your answer is in.
        </h2>
        <p className="mx-auto mt-3 max-w-[40ch] leading-relaxed text-haze">
          You can only answer once on this device. See what everyone else said, live.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center rounded-full bg-moon px-6 font-semibold text-[#14182b] shadow-[0_0_28px_-6px_rgb(243_223_165/0.6)] hover:brightness-105"
          >
            See live results
          </Link>
          <Link
            href="/forecast"
            className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-6 text-starlight hover:border-white/30"
          >
            Try Sleep Weather
          </Link>
        </div>
      </div>
    );
  }

  const toggle = (list: string[], id: string, max: number) =>
    list.includes(id) ? list.filter((x) => x !== id) : list.length < max ? [...list, id] : list;

  const chooseBarrier = (id: string) => {
    const next = toggle(barriers, id, MAX_BARRIERS);
    setBarriers(next);
    if (next.length === 1) setTop(next[0]);
    else if (top && !next.includes(top)) setTop(null);
  };

  const ready = barriers.length > 0 && top !== null && supports.length > 0;

  async function submit() {
    const local: Record<string, string> = {};
    if (!barriers.length) local.barriers = "Pick at least one.";
    if (!top) local.topBarrier = "Pick the one you most want help with.";
    if (!supports.length) local.supports = "Pick at least one.";
    setErrors(local);
    if (Object.keys(local).length) return;

    setSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pollId: POLL_ID,
          token: saved.token,
          barriers,
          topBarrier: top,
          supports,
          yearOfStudy: year || null,
          faculty: faculty || null,
          sleepBucket: sleep || null,
        }),
      });
      if (res.status === 201 || res.status === 409) return markSubmitted();
      if (res.status === 422) {
        const body = (await res.json()) as { errors?: Record<string, string> };
        setErrors(body.errors ?? {});
        setMessage("Some answers need another look.");
      } else if (res.status === 429) {
        setMessage("Lots of people are voting right now. Wait a minute, then send again.");
      } else if (res.status === 503) {
        setMessage("The poll isn't connected yet. Please try again later.");
      } else {
        setMessage("Your answer didn't go through. Check your connection and send again.");
      }
    } catch {
      setMessage("Your answer didn't go through. Check your connection and send again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      className="surface-night mt-6 rounded-[28px] p-5 sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <Question
        n={1}
        title="What most often cuts into your sleep?"
        hint={`Pick up to ${MAX_BARRIERS}. ${barriers.length} of ${MAX_BARRIERS} chosen.`}
        error={errors.barriers}
      >
        {BARRIERS.map((o) => (
          <Chip
            key={o.id}
            label={o.label}
            selected={barriers.includes(o.id)}
            disabled={!barriers.includes(o.id) && barriers.length >= MAX_BARRIERS}
            onClick={() => chooseBarrier(o.id)}
          />
        ))}
      </Question>

      <Question
        n={2}
        title="Which one do you most want MRU to help with?"
        hint={barriers.length ? "Choose from your answers above." : "Answer question 1 first."}
        error={errors.topBarrier}
      >
        <div
          role="radiogroup"
          aria-label="Most want MRU to help with"
          className="col-span-full grid grid-cols-2 gap-2 sm:grid-cols-3"
        >
          {barriers.map((id) => (
            <Chip
              key={id}
              role="radio"
              label={labelOf(BARRIERS, id)}
              selected={top === id}
              onClick={() => setTop(id)}
            />
          ))}
        </div>
      </Question>

      <Question
        n={3}
        title="Which support would help you most?"
        hint={`Pick up to ${MAX_SUPPORTS}.`}
        error={errors.supports}
      >
        {SUPPORTS.map((o) => (
          <Chip
            key={o.id}
            label={o.label}
            selected={supports.includes(o.id)}
            disabled={!supports.includes(o.id) && supports.length >= MAX_SUPPORTS}
            onClick={() => setSupports(toggle(supports, o.id, MAX_SUPPORTS))}
          />
        ))}
      </Question>

      <details className="mt-8 rounded-2xl border border-white/10 p-4">
        <summary className="min-h-11 cursor-pointer content-center font-medium text-starlight">
          Add optional details
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <OptionalSelect label="Year of study" value={year} options={YEARS} onChange={setYear} />
          <OptionalSelect
            label="Faculty"
            value={faculty}
            options={FACULTIES}
            onChange={setFaculty}
          />
          <OptionalSelect
            label="Usual sleep per night"
            value={sleep}
            options={SLEEP_BUCKETS}
            onChange={setSleep}
          />
        </div>
      </details>

      {message && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-starlight"
        >
          {message}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={sending}
          aria-disabled={!ready}
          className={`min-h-12 cursor-pointer rounded-full px-7 font-semibold transition ${
            ready
              ? "bg-moon text-[#14182b] shadow-[0_0_28px_-6px_rgb(243_223_165/0.6)] hover:brightness-105"
              : "bg-white/10 text-haze"
          } disabled:opacity-60`}
        >
          {sending ? "Sending…" : "Send my answer"}
        </button>
        <p className="text-sm text-haze">{CONSENT_LINE}</p>
      </div>
    </form>
  );
}
