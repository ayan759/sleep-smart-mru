import Link from "next/link";
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
  /** When set, the whole card links here. */
  href?: string;
};

export function ToolCard({
  title,
  description,
  accent,
  preview,
  status,
  featured,
  href,
}: ToolCardProps) {
  const a = ACCENTS[accent];
  return (
    <article
      className={`surface-night relative isolate overflow-hidden transition-colors ${href ? "hover:border-white/20 focus-within:border-white/25" : ""} ${
        featured
          ? "rounded-[28px] p-6 sm:col-span-2 sm:p-8 lg:col-span-7 lg:row-span-2 lg:flex lg:flex-col lg:p-10"
          : "rounded-3xl p-5 sm:p-6 lg:col-span-5 lg:flex lg:flex-col"
      }`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-28 -right-28 -z-10 size-80 ${a.glow}`}
      />
      {/* Featured card: side by side on tablets; tall with a large preview in the laptop grid. */}
      <div
        className={
          featured
            ? "sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-end sm:gap-10 lg:flex lg:flex-1 lg:flex-col lg:items-stretch lg:gap-0"
            : "lg:flex lg:flex-1 lg:flex-col"
        }
      >
        <div>
          <div className="flex items-start justify-between gap-4">
            <h2
              className={`font-bold tracking-tight text-starlight ${featured ? "text-2xl sm:text-[1.75rem] lg:text-4xl" : "text-xl"}`}
            >
              {href ? (
                <Link href={href} className="after:absolute after:inset-0 after:content-['']">
                  {title}
                </Link>
              ) : (
                title
              )}
            </h2>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${a.pill} ${featured ? "sm:absolute sm:top-8 sm:right-8 lg:top-10 lg:right-10" : ""}`}
            >
              {status}
            </span>
          </div>
          <p
            className={`mt-2 max-w-[48ch] leading-relaxed text-haze ${featured ? "lg:mt-3 lg:text-lg" : ""}`}
          >
            {description}
          </p>
        </div>
        <div className={featured ? "mt-6 sm:mt-0 lg:mt-auto lg:pt-10" : "mt-6 lg:mt-auto lg:pt-6"}>
          {preview}
        </div>
      </div>
    </article>
  );
}
