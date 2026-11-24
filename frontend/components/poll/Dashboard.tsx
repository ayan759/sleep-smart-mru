"use client";

import Link from "next/link";
import { useState } from "react";
import type { Dataset, GroupBreakdown, PollResults } from "@/lib/poll/aggregate";
import { MIN_GROUP_SIZE } from "@/lib/poll/options";
import { useHydrated } from "@/lib/useHydrated";
import { ResultBars } from "./ResultBars";
import { usePollResults, type ResultsState } from "./usePollResults";

export function DashboardScreen() {
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <div aria-busy="true" className="surface-night mt-8 h-96 animate-pulse rounded-[28px]" />
    );
  }
  return <Dashboard />;
}

function DatasetToggle({ value, onChange }: { value: Dataset; onChange: (d: Dataset) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="Which responses to show"
      className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1"
    >
      {(["live", "demo"] as const).map((d) => (
        <button
          key={d}
          type="button"
          role="radio"
          aria-checked={value === d}
          onClick={() => onChange(d)}
          className={`min-h-10 cursor-pointer rounded-full px-4 text-sm font-semibold transition-colors ${
            value === d ? "bg-starlight text-[#14182b]" : "text-haze hover:text-starlight"
          }`}
        >
          {d === "live" ? "Live responses" : "Demo data"}
        </button>
      ))}
    </div>
  );
}

function Groups({ title, groups }: { title: string; groups: GroupBreakdown[] }) {
  return (
    <section className="surface-night rounded-3xl p-5 sm:p-6">
      <h2 className="text-lg font-bold text-starlight">{title}</h2>
      {groups.length === 0 ? (
        <p className="mt-2 text-sm text-haze">
          No group has {MIN_GROUP_SIZE} or more responses yet.
        </p>
      ) : (
        <ul className="mt-3 grid gap-4">
          {groups.map((g) => (
            <li key={g.id}>
              <p className="font-medium text-starlight">
                {g.label}{" "}
                <span className="text-sm font-normal text-haze tabular">({g.n} responses)</span>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-haze">
                {g.top.map((s) => `${s.label} ${Math.round(s.pct)}%`).join(", ")}
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-haze/80">
        Groups with fewer than {MIN_GROUP_SIZE} responses are hidden to protect anonymity.
      </p>
    </section>
  );
}

function Results({ results }: { results: PollResults }) {
  const lead = results.topBarrier[0];
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-12">
      <section className="surface-night relative isolate overflow-hidden rounded-[28px] p-5 sm:p-7 lg:col-span-7 lg:row-span-2">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-32 -z-10 size-96 bg-[radial-gradient(closest-side,rgb(230_194_222/0.14),transparent)]"
        />
        <h2 className="text-lg font-bold text-starlight">What cuts into students&apos; sleep</h2>
        <p className="mt-1 mb-5 text-sm text-haze">
          % of respondents who picked each. People could choose up to 3.
        </p>
        <ResultBars
          shares={results.barriers}
          tone="lilac"
          emptyText="No responses yet. Share the poll link or QR code."
        />
      </section>

      <section className="surface-night rounded-3xl p-5 sm:p-6 lg:col-span-5">
        <h2 className="text-lg font-bold text-starlight">Most want MRU to address</h2>
        {lead ? (
          <>
            <p className="mt-3 text-3xl font-bold tracking-tight text-moon">{lead.label}</p>
            <p className="mt-1 text-sm text-haze tabular">
              {Math.round(lead.pct)}% of respondents chose this as their number one.
            </p>
            <div className="mt-5">
              <ResultBars shares={results.topBarrier.slice(1)} tone="moon" limit={4} emptyText="" />
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-haze">No responses yet.</p>
        )}
      </section>

      <section className="surface-night rounded-3xl p-5 sm:p-6 lg:col-span-5">
        <h2 className="text-lg font-bold text-starlight">Supports students want</h2>
        <p className="mt-1 mb-4 text-sm text-haze">People could choose up to 2.</p>
        <ResultBars shares={results.supports} tone="sage" />
      </section>

      <div className="grid gap-5 sm:grid-cols-2 lg:col-span-12">
        <Groups title="By year of study" groups={results.byYear} />
        <Groups title="By faculty" groups={results.byFaculty} />
      </div>
    </div>
  );
}

function StateMessage({ state }: { state: ResultsState }) {
  if (state.status === "loading")
    return (
      <div aria-busy="true" className="surface-night mt-6 h-72 animate-pulse rounded-[28px]" />
    );
  if (state.status === "not_connected")
    return (
      <p className="surface-night mt-6 rounded-3xl p-6 text-haze">
        The poll database isn&apos;t connected yet, so there are no results to show.
      </p>
    );
  return (
    <p className="mt-6 rounded-3xl border border-coral/40 bg-coral/10 p-6 text-starlight">
      Results couldn&apos;t load. Check your connection; this page retries on its own.
    </p>
  );
}

function AdminTools({ onDone }: { onDone: () => void }) {
  const [passcode, setPasscode] = useState("");
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: "reset_live" | "reseed_demo") {
    if (
      action === "reset_live" &&
      !window.confirm("Delete ALL live responses? This can't be undone.")
    )
      return;
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-passcode": passcode },
        body: JSON.stringify({ action }),
      });
      const body = (await res.json().catch(() => ({}))) as { removed?: number; added?: number };
      if (res.status === 401) setStatus({ tone: "error", text: "That passcode isn't right." });
      else if (res.status === 429)
        setStatus({ tone: "error", text: "Too many tries. Wait a minute." });
      else if (!res.ok) setStatus({ tone: "error", text: "That didn't work. Try again." });
      else {
        setStatus({
          tone: "ok",
          text:
            action === "reset_live"
              ? `Deleted ${body.removed ?? 0} live responses.`
              : `Loaded ${body.added ?? 0} demo responses.`,
        });
        onDone();
      }
    } catch {
      setStatus({ tone: "error", text: "That didn't work. Check your connection." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="mt-10 rounded-3xl border border-white/10 p-5">
      <summary className="min-h-11 cursor-pointer content-center font-medium text-haze hover:text-starlight">
        Organizer tools
      </summary>
      <div className="mt-3 max-w-md">
        <label className="block text-sm text-haze">
          Admin passcode
          <input
            type="password"
            autoComplete="off"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-starlight"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!passcode || busy}
            onClick={() => void run("reseed_demo")}
            className="min-h-11 cursor-pointer rounded-full border border-white/15 px-4 text-sm text-starlight hover:border-white/30 disabled:opacity-50"
          >
            Reload demo data
          </button>
          <button
            type="button"
            disabled={!passcode || busy}
            onClick={() => void run("reset_live")}
            className="min-h-11 cursor-pointer rounded-full border border-coral/50 px-4 text-sm text-starlight hover:bg-coral/10 disabled:opacity-50"
          >
            Reset live responses
          </button>
        </div>
        {status && (
          <p
            role={status.tone === "error" ? "alert" : "status"}
            className={`mt-3 text-sm ${status.tone === "error" ? "text-coral" : "text-sage"}`}
          >
            {status.text}
          </p>
        )}
      </div>
    </details>
  );
}

function Dashboard() {
  const [dataset, setDataset] = useState<Dataset>(() =>
    new URLSearchParams(window.location.search).get("dataset") === "demo" ? "demo" : "live",
  );
  const { state, reload } = usePollResults(dataset);

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DatasetToggle value={dataset} onChange={setDataset} />
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/present${dataset === "demo" ? "?dataset=demo" : ""}`}
            className="inline-flex min-h-11 items-center rounded-full bg-moon px-5 font-semibold text-[#14182b] shadow-[0_0_24px_-6px_rgb(243_223_165/0.6)] hover:brightness-105"
          >
            Presentation mode
          </Link>
          <Link
            href="/poll"
            className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-starlight hover:border-white/30"
          >
            Take the poll
          </Link>
        </div>
      </div>

      {dataset === "demo" && (
        <p className="mt-5 rounded-xl border border-moon/30 bg-moon/10 px-4 py-2 text-sm font-medium text-starlight">
          Demo data: these are made-up responses for rehearsing, not real students.
        </p>
      )}

      {state.status === "ready" ? (
        <>
          <p className="mt-6 text-haze" aria-live="polite">
            <span className="text-4xl font-bold text-starlight tabular">{state.results.total}</span>{" "}
            {state.results.total === 1 ? "response" : "responses"}
            {state.live ? ", updating live" : ""}
            {state.storage === "memory" ? " (local test storage)" : ""}
          </p>
          <Results results={state.results} />
        </>
      ) : (
        <StateMessage state={state} />
      )}

      <AdminTools onDone={reload} />
    </div>
  );
}
