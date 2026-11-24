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

function StatusDot({ tone, label }: { tone: "ok" | "bad"; label: string }) {
  const colour =
    tone === "ok"
      ? "bg-sage shadow-[0_0_8px_rgb(210_222_156/0.8)]"
      : "bg-coral shadow-[0_0_8px_rgb(253_94_72/0.8)]";
  return (
    <span className="inline-flex items-center gap-2 font-semibold">
      <span aria-hidden="true" className={`size-2 rounded-full ${colour}`} />
      {label}
    </span>
  );
}

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
    <div className="surface-night mt-8 max-w-xl rounded-3xl p-5 sm:p-6">
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-starlight">
        <dt className="font-medium text-haze">Website</dt>
        <dd>Running (you&apos;re reading it)</dd>

        <dt className="font-medium text-haze">Study planner</dt>
        <dd aria-live="polite">
          {state.kind === "checking" && "Checking…"}
          {state.kind === "ok" && <StatusDot tone="ok" label="Running" />}
          {state.kind === "failed" && <StatusDot tone="bad" label="Not responding" />}
        </dd>

        {state.kind === "ok" && (
          <>
            <dt className="font-medium text-haze">Python</dt>
            <dd className="tabular">{state.health.python}</dd>
            <dt className="font-medium text-haze">OR-Tools</dt>
            <dd className="tabular">{state.health.ortools}</dd>
            <dt className="font-medium text-haze">Solver test</dt>
            <dd className="tabular">
              {state.health.cpsat_smoke === "OPTIMAL" ? "Passed" : state.health.cpsat_smoke} in{" "}
              {state.health.cpsat_solve_ms} ms
            </dd>
            <dt className="font-medium text-haze">Round trip</dt>
            <dd className="tabular">{state.roundTripMs} ms</dd>
          </>
        )}
      </dl>

      {state.kind === "failed" && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-coral/40 bg-coral/10 px-3 py-2 font-medium text-starlight"
        >
          {state.message}
        </p>
      )}

      <button
        type="button"
        onClick={() => void runCheck()}
        disabled={state.kind === "checking"}
        className="mt-6 min-h-11 cursor-pointer rounded-full bg-moon px-6 py-2.5 font-semibold text-[#14182b] shadow-[0_0_28px_-6px_rgb(243_223_165/0.6)] transition hover:brightness-105 active:scale-[0.98] disabled:cursor-default disabled:opacity-60"
      >
        Check again
      </button>
    </div>
  );
}
