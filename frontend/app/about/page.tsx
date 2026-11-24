import type { Metadata } from "next";
import Link from "next/link";
import { PosterQr } from "@/components/about/PosterQr";
import { ReferenceList } from "@/components/ReferenceList";
import { SectionHead } from "@/components/SectionHead";
import { REFERENCES } from "@/lib/references";

export const metadata: Metadata = {
  title: "About this project",
  description:
    "Sleep Smart MRU is a UGST 1002 class project at Mount Royal University: our research question, the gap between knowing and doing, our pitch to MRU, and every source we used.",
};

const JUMPS = [
  { href: "#question", label: "Our question" },
  { href: "#knowing-doing", label: "Knowing vs doing" },
  { href: "#pitch", label: "Our pitch" },
  { href: "#data", label: "Your data" },
  { href: "#references", label: "References" },
];

const section = "mt-16 border-t border-white/10 pt-12 lg:mt-20 lg:pt-16";
const panel = "rounded-2xl border border-white/[0.09] bg-[#0f1429] p-5 sm:p-7";
const link =
  "font-medium text-starlight underline decoration-starlight/40 underline-offset-4 hover:decoration-starlight";

/** A labelled horizontal bar on a 0–100% scale. The number is always written out. */
function Bar({ label, value, colour }: { label: string; value: number; colour: string }) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-starlight">{label}</span>
        <span className="text-lg font-semibold text-starlight tabular">{value}%</span>
      </div>
      <div aria-hidden="true" className="mt-2 h-3 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: colour }} />
      </div>
    </li>
  );
}

const CHAIN = [
  { title: "Knowing about sleep", body: "What helps, what hurts, and why." },
  { title: "Better habits", body: "Steady wake times, enough hours, earlier caffeine." },
  { title: "Better sleep", body: "Sleep quality follows the habits." },
];

const TOOLS = [
  {
    href: "/forecast" as const,
    title: "Sleep Weather",
    body: "Shows what last week's sleep means for tomorrow's classes, hour by hour.",
  },
  {
    href: "/plan" as const,
    title: "Exam-crunch planner",
    body: "Turns “I should sleep more” into a study plan that never drops below 7 hours of sleep.",
  },
  {
    href: "/poll" as const,
    title: "Sleep barrier poll",
    body: "Asks what gets in the way, so MRU can fix the right things.",
  },
  {
    href: "/learn" as const,
    title: "Sleep guide",
    body: "Habits, a caffeine calculator and 20 studies, each tip linked to its source.",
  },
];

const PITCH_STEPS = [
  {
    title: "Posters and table tents",
    body: "Placed around campus, each with a QR code that opens this app.",
  },
  {
    title: "Scan and try a tool",
    body: "On your phone, in the moment, with no account and no download.",
  },
  {
    title: "Reminders in the MRU app",
    body: "A nudge at the right time brings students back.",
  },
];

const DATA_POINTS = [
  {
    title: "No accounts",
    body: "There's nothing to sign up for, so we never have your name or email.",
  },
  {
    title: "Your sleep stays on your phone",
    body: "Sleep logs, class schedules and study plans are saved in your browser. They're never sent to us.",
  },
  {
    title: "The poll is anonymous",
    body: "No names, emails or free-text answers. Results only break down groups of 10 or more people.",
  },
  {
    title: "No IP addresses",
    body: "To stop spam we keep a scrambled code that changes daily and is deleted after a day.",
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-8 lg:max-w-6xl lg:px-10">
      <Link
        href="/"
        className="text-sm text-haze underline underline-offset-4 hover:text-starlight"
      >
        Home
      </Link>
      <h1 className="mt-4 text-4xl font-black tracking-[-0.03em] sm:text-5xl">
        About this project
      </h1>
      <p className="mt-3 max-w-[60ch] text-lg leading-relaxed text-haze">
        Sleep Smart MRU is our class project for UGST 1002, Advocating for Change, at Mount Royal
        University in Calgary. It turns what students know about sleep into something they can do
        tonight. Made by Avalin, Ayan, Liv and Ozzy; Ayan built the app.
      </p>
      <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-2">
        {JUMPS.map((j) => (
          <a
            key={j.href}
            href={j.href}
            className="inline-flex min-h-10 items-center rounded-full border border-white/[0.12] px-4 text-sm text-starlight hover:border-white/30"
          >
            {j.label}
          </a>
        ))}
      </nav>

      {/* Research question */}
      <section aria-labelledby="question" className={section}>
        <SectionHead
          id="question"
          title="Our research question"
          intro="Our wellness dimension is physical wellness, through sleep. Sleep also links to emotional, social and environmental wellness."
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <blockquote className="self-start border-l-2 border-moon/70 pl-5 text-2xl font-medium leading-snug tracking-[-0.01em] text-starlight sm:text-[1.75rem] lg:col-span-7">
            To what extent does a lack of knowledge about healthy sleep habits contribute to poor
            sleep quality among Mount Royal University students?
          </blockquote>
          <div className={`${panel} lg:col-span-5`}>
            <h3 className="font-semibold text-starlight">
              What MRU students said hurt their academic performance
            </h3>
            <ul className="mt-5 grid gap-5">
              <Bar label="Stress" value={46} colour="rgb(201 204 227 / 0.45)" />
              <Bar label="Anxiety" value={38} colour="rgb(201 204 227 / 0.45)" />
              <Bar label="Sleep" value={33} colour="var(--color-moon)" />
            </ul>
            <p className="mt-5 text-sm leading-relaxed text-haze">
              National College Health Assessment (NCHA) 2019 at MRU, reported by MRU Wellness
              Services (2021).
            </p>
          </div>
        </div>
        <p className="mt-10 max-w-[62ch] text-lg leading-relaxed text-haze">
          Adults 18 to 64 need 7 to 9 hours of good-quality sleep, with consistent bed and wake
          times (Ross et al., 2020). One in three MRU students said sleep hurt their academic performance.
        </p>
      </section>

      {/* Knowing vs doing */}
      <section aria-labelledby="knowing-doing" className={section}>
        <SectionHead
          id="knowing-doing"
          title="Knowing isn't the same as doing"
          intro="Research links sleep knowledge to sleep habits, and habits to sleep quality. But handing out information isn't enough on its own."
        />

        <ol className="mt-10 grid gap-3 lg:grid-cols-3 lg:gap-4">
          {CHAIN.map((c, i) => (
            <li key={c.title} className={`${panel} relative`}>
              <p className="text-sm text-haze tabular">Step {i + 1}</p>
              <p className="mt-1 text-lg font-semibold text-starlight">{c.title}</p>
              <p className="mt-1 leading-relaxed text-haze">{c.body}</p>
              {i < CHAIN.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-3 left-8 z-10 h-3 w-px bg-moon/60 lg:-right-4 lg:bottom-auto lg:left-auto lg:top-1/2 lg:h-px lg:w-4"
                />
              )}
            </li>
          ))}
        </ol>
        <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-haze">
          Brown et al. (2002); in 1,566 Canadian university students, sleep habits and attitudes
          were linked to sleep quality (Kuhn et al., 2024).
        </p>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="max-w-[62ch] lg:col-span-6">
            <h3 className="text-2xl font-semibold tracking-[-0.01em] text-starlight">
              The gap is between step 1 and step 2
            </h3>
            <p className="mt-3 text-lg leading-relaxed text-haze">
              Sleep education programs usually raise what people know, but that often doesn&apos;t
              change how they sleep (Blunden et al., 2012). What worked better for college
              students was a short, personalized online program (Hershner &amp; O&apos;Brien,
              2018).
            </p>
          </div>
          <div className={`${panel} lg:col-span-6`}>
            <h3 className="font-semibold text-starlight">
              Students who improved their sleep behaviours
            </h3>
            <ul className="mt-5 grid gap-5">
              <Bar label="Short online sleep program" value={50.3} colour="var(--color-sage)" />
              <Bar label="Comparison group" value={39.5} colour="rgb(201 204 227 / 0.45)" />
            </ul>
            <p className="mt-5 text-sm leading-relaxed text-haze">
              Hershner &amp; O&apos;Brien (2018), randomized trial with university students.
            </p>
          </div>
        </div>

        <h3 className="mt-16 text-2xl font-semibold tracking-[-0.01em] text-starlight">
          So we built tools, not pamphlets
        </h3>
        <ul className="mt-6 grid border-t border-white/10 lg:grid-cols-2 lg:gap-x-16">
          {TOOLS.map((t) => (
            <li key={t.href} className="border-b border-white/10">
              <Link
                href={t.href}
                className="group flex min-h-11 flex-col gap-1 py-5 hover:text-starlight"
              >
                <span className="font-semibold text-moon underline decoration-moon/0 underline-offset-4 transition-colors group-hover:decoration-moon/60">
                  {t.title}
                </span>
                <span className="leading-relaxed text-haze">{t.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Pitch */}
      <section aria-labelledby="pitch" className={section}>
        <SectionHead
          id="pitch"
          title="Our pitch to MRU"
          intro="Put the tools where students already are, then remind them at the right moment."
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <ol className="grid gap-6 lg:col-span-7">
            {PITCH_STEPS.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[2.5rem_1fr] gap-4">
                <span
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-full border border-moon/50 text-moon tabular"
                >
                  {i + 1}
                </span>
                <div>
                  <p className="text-lg font-semibold text-starlight">{s.title}</p>
                  <p className="mt-1 leading-relaxed text-haze">{s.body}</p>
                </div>
              </li>
            ))}
            <li className="mt-2 border-t border-white/10 pt-6">
              <p className="text-sm text-haze">Estimated cost</p>
              <p className="mt-1 text-4xl font-black tracking-[-0.03em] text-starlight tabular">
                About $1,000 a term
              </p>
            </li>
          </ol>
          <figure className={`${panel} flex flex-col items-center text-center lg:col-span-5`}>
            <PosterQr />
            <figcaption className="mt-4">
              <span className="block text-lg font-semibold text-starlight">Sleep Smart MRU</span>
              <span className="mt-1 block text-haze">
                The QR code on our posters. Scan it with your phone camera.
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Data */}
      <section aria-labelledby="data" className={section}>
        <SectionHead
          id="data"
          title="What happens to your data"
          intro="Very little, on purpose. Only anonymous poll answers ever leave your phone."
        />
        <ul className="mt-10 grid gap-x-16 gap-y-8 sm:grid-cols-2">
          {DATA_POINTS.map((d) => (
            <li key={d.title} className="border-t border-white/10 pt-5">
              <p className="font-semibold text-starlight">{d.title}</p>
              <p className="mt-1 leading-relaxed text-haze">{d.body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 max-w-[62ch] text-lg leading-relaxed text-haze">
          Sleep Smart MRU gives educational estimates, not medical advice, and can&apos;t diagnose
          anything. If sleep is a struggle,{" "}
          <a className={link} href="https://www.mtroyal.ca/CampusServices/WellnessServices/index.htm">
            MRU Wellness Services
          </a>{" "}
          (Wellness Centre, U216) can help.
        </p>
      </section>

      {/* References */}
      <section aria-labelledby="references" className={`${section} pb-4`}>
        <SectionHead
          id="references"
          title="References"
          intro={`The ${REFERENCES.length} sources behind this app, in APA 7th edition style. Links go to each paper's DOI or official record.`}
        />
        <ReferenceList refs={REFERENCES} className="mt-10 max-w-[80ch]" />
        <p className="mt-8 max-w-[62ch] text-sm leading-relaxed text-haze">
          The MRU figures come from the 2019 National College Health Assessment at Mount Royal,
          as reported by MRU Wellness Services (2021). We couldn&apos;t find a public copy of that
          report to link to.
        </p>
      </section>
    </main>
  );
}
