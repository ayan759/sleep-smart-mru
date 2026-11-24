import type { Share } from "@/lib/poll/aggregate";

type Tone = "lilac" | "moon" | "sage";
const FILL: Record<Tone, string> = {
  lilac: "bg-lilac shadow-[0_0_14px_rgb(230_194_222/0.45)]",
  moon: "bg-moon shadow-[0_0_14px_rgb(243_223_165/0.45)]",
  sage: "bg-sage shadow-[0_0_14px_rgb(210_222_156/0.45)]",
};

/** Ranked horizontal bars as an accessible list (% of respondents). */
export function ResultBars({
  shares,
  tone = "lilac",
  limit,
  large = false,
  emptyText = "No responses yet.",
}: {
  shares: Share[];
  tone?: Tone;
  limit?: number;
  large?: boolean;
  emptyText?: string;
}) {
  const shown = limit ? shares.slice(0, limit) : shares;
  if (shown.length === 0) return <p className="text-haze">{emptyText}</p>;
  const max = Math.max(...shown.map((s) => s.pct), 1);
  return (
    <ol className={`grid ${large ? "gap-5" : "gap-3.5"}`}>
      {shown.map((s, i) => (
        <li key={s.id}>
          <div
            className={`flex items-baseline justify-between gap-3 ${large ? "text-2xl" : "text-sm"}`}
          >
            <span className={`text-starlight ${i === 0 ? "font-semibold" : ""}`}>{s.label}</span>
            <span className="shrink-0 font-semibold text-starlight tabular">
              {Math.round(s.pct)}%<span className="sr-only"> of respondents ({s.count})</span>
            </span>
          </div>
          <div
            aria-hidden="true"
            className={`mt-1.5 overflow-hidden rounded-full bg-white/[0.06] ${large ? "h-4" : "h-2.5"}`}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none ${FILL[tone]}`}
              style={{ width: `${(s.pct / max) * 100}%`, opacity: 1 - Math.min(i, 6) * 0.08 }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
