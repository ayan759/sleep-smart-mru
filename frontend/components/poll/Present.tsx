"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import type { Dataset } from "@/lib/poll/aggregate";
import { useHydrated } from "@/lib/useHydrated";
import { StarCanvas } from "@/components/sky/StarCanvas";
import { ResultBars } from "./ResultBars";
import { usePollResults } from "./usePollResults";

export function PresentScreen() {
  const hydrated = useHydrated();
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[linear-gradient(180deg,var(--color-space)_0%,#070b19_55%,#0d1430_100%)]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 opacity-70">
        <StarCanvas />
      </div>
      {hydrated && <Present />}
    </div>
  );
}

function Present() {
  const [dataset] = useState<Dataset>(() =>
    new URLSearchParams(window.location.search).get("dataset") === "demo" ? "demo" : "live",
  );
  const pollUrl = `${window.location.origin}/poll`;
  const { state } = usePollResults(dataset, 3000);
  const total = state.status === "ready" ? state.results.total : null;

  return (
    <main className="relative mx-auto grid min-h-full max-w-7xl items-center gap-10 px-6 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:px-12">
      <section className="text-center lg:text-left">
        <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-[0.95] tracking-[-0.035em] text-starlight">
          What keeps you up at night?
        </h1>
        <p className="mt-4 text-xl text-haze">Scan to answer. Anonymous, under a minute.</p>
        <div className="mx-auto mt-8 w-fit rounded-[28px] bg-starlight p-5 shadow-[0_0_80px_-10px_rgb(243_223_165/0.45)] lg:mx-0">
          <QRCodeSVG
            value={pollUrl}
            size={320}
            level="M"
            bgColor="#f7f5ff"
            fgColor="#0a0e1c"
            className="h-auto w-[min(70vw,320px)]"
            title="QR code linking to the Sleep Smart MRU poll"
          />
        </div>
        <p className="mt-4 text-lg font-medium text-starlight">
          {pollUrl.replace(/^https?:\/\//, "")}
        </p>
      </section>

      <section aria-live="polite">
        {dataset === "demo" && (
          <p className="mb-4 inline-block rounded-full border border-moon/40 bg-moon/10 px-4 py-1 text-sm font-semibold text-moon">
            Demo data
          </p>
        )}
        <p className="text-haze">
          <span className="text-[clamp(3.5rem,8vw,6.5rem)] font-black leading-none text-starlight tabular">
            {total ?? "–"}
          </span>{" "}
          <span className="text-2xl">{total === 1 ? "response" : "responses"}</span>
        </p>
        <h2 className="mt-8 text-2xl font-bold text-starlight">What cuts into our sleep</h2>
        <div className="mt-5">
          {state.status === "ready" ? (
            <ResultBars
              shares={state.results.barriers}
              limit={6}
              large
              emptyText="Be the first to answer!"
            />
          ) : state.status === "not_connected" ? (
            <p className="text-xl text-haze">The poll database isn&apos;t connected yet.</p>
          ) : (
            <p className="text-xl text-haze">Loading results…</p>
          )}
        </div>
      </section>

      <Link
        href="/dashboard"
        className="fixed top-4 right-4 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm text-haze hover:text-starlight"
      >
        Exit
      </Link>
    </main>
  );
}
