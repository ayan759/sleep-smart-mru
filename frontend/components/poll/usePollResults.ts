"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dataset, PollResults } from "@/lib/poll/aggregate";
import { POLL_ID } from "@/lib/poll/options";

export type ResultsState =
  | { status: "loading" }
  | { status: "ready"; results: PollResults; live: boolean; storage: "supabase" | "memory" }
  | { status: "not_connected" }
  | { status: "error" };

type Realtime = { url: string; anonKey: string } | null;

/**
 * Fetches aggregate results and keeps them fresh: Supabase realtime on the count-only
 * poll_tick table when available, plus a polling fallback.
 */
export function usePollResults(
  dataset: Dataset,
  fallbackMs = 5000,
): { state: ResultsState; reload: () => void } {
  const [state, setState] = useState<ResultsState>({ status: "loading" });
  const realtimeRef = useRef<Realtime | undefined>(undefined);
  const [realtime, setRealtime] = useState<Realtime | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/poll/results?dataset=${dataset}`, { cache: "no-store" });
      if (res.status === 503) return setState({ status: "not_connected" });
      if (!res.ok) return setState((s) => (s.status === "ready" ? s : { status: "error" }));
      const body = (await res.json()) as {
        results: PollResults;
        realtime: Realtime;
        storage: "supabase" | "memory";
      };
      if (realtimeRef.current === undefined) {
        realtimeRef.current = body.realtime;
        setRealtime(body.realtime);
      }
      setState({
        status: "ready",
        results: body.results,
        live: !!body.realtime,
        storage: body.storage,
      });
    } catch {
      setState((s) => (s.status === "ready" ? s : { status: "error" }));
    }
  }, [dataset]);

  // Initial load + polling fallback.
  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(load, realtime ? Math.max(fallbackMs, 15000) : fallbackMs);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load, realtime, fallbackMs]);

  // Realtime: refetch whenever the count for this poll/dataset changes.
  useEffect(() => {
    if (!realtime) return;
    let cancelled = false;
    let cleanup = () => {};
    void import("@supabase/supabase-js").then(({ createClient }) => {
      if (cancelled) return;
      const client = createClient(realtime.url, realtime.anonKey, {
        auth: { persistSession: false },
      });
      const channel = client
        .channel(`poll-tick-${dataset}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "poll_tick", filter: `poll_id=eq.${POLL_ID}` },
          (payload) => {
            const row = (payload.new ?? payload.old) as { dataset?: string };
            if (!row?.dataset || row.dataset === dataset) void load();
          },
        )
        .subscribe();
      cleanup = () => void client.removeChannel(channel);
    });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [realtime, dataset, load]);

  return { state, reload: () => void load() };
}
