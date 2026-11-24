import type { ReactNode } from "react";

export type Accent = "moon" | "sage" | "lilac";

// Slide palette used as light, not paint: a soft glow from the corner + a tinted status pill.
const ACCENTS: Record<Accent, { glow: string; pill: string }> = {
  moon: {
    glow: "bg-[radial-gradient(closest-side,rgb(243_223_165/0.2),transparent)]",
    pill: "bg-moon/10 text-moon ring-moon/25",
  },
  sage: {
    glow: "bg-[radial-gradient(closest-side,rgb(210_222_156/0.16),transparent)]",
    pill: "bg-sage/10 text-sage ring-sage/25",
  },
  lilac: {
    glow: "bg-[radial-gradient(closest-side,rgb(230_194_222/0.16),transparent)]",
    pill: "bg-lilac/10 text-lilac ring-lilac/25",
  },
};

type ToolCardProps = {
  title: string;
  description: string;
  accent: Accent;
  preview: ReactNode;
  status: string;
  featured?: boolean;
};

export function ToolCard({ title, description, accent, preview, status, featured }: ToolCardProps) {
  const a = ACCENTS[accent];
  return (
    <article
      className={`surface-night relative isolate overflow-hidden ${
        featured ? "rounded-[28px] p-6 sm:col-span-2 sm:p-8" : "rounded-3xl p-5 sm:p-6"
      }`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-28 -right-28 -z-10 size-80 ${a.glow}`}
      />
      {/* Featured card: text and preview side by side on wider screens. */}
      <div
        className={
          featured
            ? "sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-end sm:gap-10"
            : undefined
        }
      >
        <div>
          <div className="flex items-start justify-between gap-4">
            <h2
              className={`font-bold tracking-tight text-starlight ${featured ? "text-2xl sm:text-[1.75rem]" : "text-xl"}`}
            >
              {title}
            </h2>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${a.pill} ${featured ? "sm:absolute sm:top-8 sm:right-8" : ""}`}
            >
              {status}
            </span>
          </div>
          <p className="mt-2 max-w-[48ch] leading-relaxed text-haze">{description}</p>
        </div>
        <div className={featured ? "mt-6 sm:mt-0" : "mt-6"}>{preview}</div>
      </div>
    </article>
  );
}
