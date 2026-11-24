"use client";

import { useEffect, useState } from "react";
import { STUDIES, TOPICS, type Topic } from "@/lib/learn/studies";

const topicLabel = (t: Topic) => TOPICS.find((x) => x.id === t)?.label ?? t;

/** Filterable list of real, checked studies. Citation links elsewhere jump to #study-<id>. */
export function ResearchLibrary() {
  const [topic, setTopic] = useState<Topic | "all">("all");
  const [flash, setFlash] = useState<string | null>(null);

  // A citation link elsewhere on the page shows every study and highlights the one linked.
  useEffect(() => {
    const onHash = () => {
      const id = window.location.hash.replace("#study-", "");
      if (!STUDIES.some((s) => s.id === id)) return;
      setTopic("all");
      setFlash(id);
      requestAnimationFrame(() =>
        document.getElementById(`study-${id}`)?.scrollIntoView({ block: "center" }),
      );
      setTimeout(() => setFlash(null), 2200);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const shown = topic === "all" ? STUDIES : STUDIES.filter((s) => s.topics.includes(topic));
  const chip = (active: boolean) =>
    `min-h-10 cursor-pointer rounded-full border px-3.5 text-sm transition-colors ${
      active
        ? "border-moon/60 bg-moon/[0.12] text-starlight"
        : "border-white/[0.12] text-haze hover:text-starlight"
    }`;

  return (
    <div>
      <div role="group" aria-label="Filter studies by topic" className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={topic === "all"}
          onClick={() => setTopic("all")}
          className={chip(topic === "all")}
        >
          All
        </button>
        {TOPICS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={topic === t.id}
            onClick={() => setTopic(t.id)}
            className={chip(topic === t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-haze" aria-live="polite">
        Showing {shown.length} of {STUDIES.length} studies
      </p>

      <ul className="mt-4 grid gap-4 lg:grid-cols-2">
        {shown.map((s) => (
          <li
            key={s.id}
            id={`study-${s.id}`}
            className={`scroll-mt-24 rounded-2xl border bg-[#0f1429] p-5 transition-colors duration-500 sm:p-6 ${
              flash === s.id ? "border-moon/70" : "border-white/[0.09]"
            }`}
          >
            <p className="text-xs text-haze tabular">
              {s.authors} ({s.year}), <span className="italic">{s.journal}</span>
            </p>
            <h3 className="mt-2 text-lg font-semibold leading-snug text-starlight">{s.headline}</h3>
            <dl className="mt-3 grid gap-2 text-[15px] leading-relaxed">
              <div>
                <dt className="sr-only">Who was studied</dt>
                <dd className="text-haze">{s.sample}</dd>
              </div>
              <div>
                <dt className="sr-only">What they found</dt>
                <dd className="text-starlight">{s.found}</dd>
              </div>
              <div className="border-l-2 border-moon/70 pl-3">
                <dt className="sr-only">What it means for you</dt>
                <dd className="text-starlight">{s.forYou}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-haze/80">{s.topics.map(topicLabel).join(", ")}</p>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-moon underline decoration-moon/40 underline-offset-4 hover:decoration-moon"
              >
                {s.linkLabel ?? "Read the study"}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
