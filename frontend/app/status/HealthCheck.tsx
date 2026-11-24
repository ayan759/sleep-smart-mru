"use client";

import { useCallback, useEffect, useState } from "react";

type Health = {
  status: string;
  python: string;
  ortools: string;
  cpsat_smoke: string;
  cpsat_solve_ms: number;
  ortools_import_ms: number;
};

type CheckState =
  | { kind: "checking" }
  | { kind: "ok"; health: Health; roundTripMs: number }
  | { kind: "failed"; message: string };

export function HealthCheck() {
  const [state, setState] = useState<CheckState>({ kind: "checking" });

  const runCheck = useCallback(async () => {
    setState({ kind: "checking" });
    const started = performance.now();
    try {
      const response = await fetch("/api/py/health", { cache: "no-store" });
      if (!response.ok) {
        setState({
          kind: "failed",
          message: `The study planner answered with HTTP ${response.status}. Try again in a moment.`,
        });
        return;
      }
      const health = (await response.json()) as Health;
      setState({ kind: "ok", health, roundTripMs: Math.round(performance.now() - started) });
    } catch {
      setState({
        kind: "failed",
        message: "The study planner didn't respond. Check your connection, then try again.",
      });
    }
  }, []);

  useEffect(() => {
    // Initial check on mount; the effect only kicks off the request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runCheck();
  }, [runCheck]);

  return (
    <div className="mt-8 rounded-3xl border-[2.5px] border-ink bg-starlight p-5 text-ink shadow-sticker-sm">
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3">
        <dt className="font-semibold">Website</dt>
        <dd>Running (you&apos;re reading it)</dd>

        <dt className="font-semibold">Study planner</dt>
        <dd aria-live="polite">
          {state.kind === "checking" && "Checking…"}
          {state.kind === "ok" && "Running"}
          {state.kind === "failed" && <span className="font-semibold">Not responding</span>}
        </dd>

        {state.kind === "ok" && (
          <>
            <dt className="font-semibold">Python</dt>
            <dd className="tabular">{state.health.python}</dd>
            <dt className="font-semibold">OR-Tools</dt>
            <dd className="tabular">{state.health.ortools}</dd>
            <dt className="font-semibold">Solver test</dt>
            <dd className="tabular">
              {state.health.cpsat_smoke === "OPTIMAL" ? "Passed" : state.health.cpsat_smoke} in{" "}
              {state.health.cpsat_solve_ms} ms
            </dd>
            <dt className="font-semibold">Round trip</dt>
            <dd className="tabular">{state.roundTripMs} ms</dd>
          </>
        )}
      </dl>

      {state.kind === "failed" && (
        <p role="alert" className="mt-4 rounded-xl border-2 border-ink bg-coral px-3 py-2 font-medium text-ink">
          {state.message}
        </p>
      )}

      <button
        type="button"
        onClick={() => void runCheck()}
        disabled={state.kind === "checking"}
        className="mt-5 rounded-full border-[2.5px] border-ink bg-moon px-5 py-2 font-bold text-ink shadow-sticker-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
      >
        Check again
      </button>
    </div>
  );
}
