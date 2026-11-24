import Link from "next/link";
import type { ReactNode } from "react";

/**
 * One tool as a full-width row: name, one plain sentence and one action on the left, a flat
 * miniature of its real screen on the right. The whole row is the link (stretched from the
 * button); the screen lifts 2px on hover.
 */
export function ToolRow({
  title,
  description,
  action,
  href,
  screen,
}: {
  title: string;
  description: string;
  action: string;
  href: string;
  screen: ReactNode;
}) {
  return (
    <article className="group relative grid gap-8 border-t border-white/10 py-12 sm:py-14 lg:grid-cols-12 lg:items-center lg:gap-16 lg:py-20">
      <div className="lg:col-span-5">
        <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.02em] text-starlight sm:text-[2.5rem]">
          {title}
        </h2>
        <p className="mt-3 max-w-[40ch] text-lg leading-relaxed text-haze">{description}</p>
        <Link
          href={href}
          className="mt-7 inline-flex min-h-11 items-center rounded-full bg-moon px-5 text-[15px] font-semibold text-[#14182b] transition after:absolute after:inset-0 after:content-[''] hover:brightness-105 active:scale-[0.98]"
        >
          {action}
        </Link>
      </div>
      <div className="transition-transform duration-300 group-hover:-translate-y-0.5 lg:col-span-7">
        {screen}
      </div>
    </article>
  );
}
