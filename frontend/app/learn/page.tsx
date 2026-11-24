import type { Metadata } from "next";
import Link from "next/link";
import { CaffeineCalculator } from "@/components/learn/CaffeineCalculator";
import { HabitColumns } from "@/components/learn/HabitColumns";
import { HabitQuiz } from "@/components/learn/HabitQuiz";
import { NightOfSleep } from "@/components/learn/NightOfSleep";
import { ResearchLibrary } from "@/components/learn/ResearchLibrary";
import { SourceLinks } from "@/components/learn/SourceLinks";
import { SectionHead } from "@/components/SectionHead";
import { STUDIES } from "@/lib/learn/studies";

export const metadata: Metadata = {
  title: "Sleep guide",
  description:
    "Sleep habits that help and hurt, how a night of sleep works, how long caffeine lasts, and the research behind it, for Mount Royal students.",
};

const JUMPS = [
  { href: "#habits", label: "Habits" },
  { href: "#how-sleep-works", label: "How sleep works" },
  { href: "#caffeine", label: "Caffeine" },
  { href: "#research", label: "Research" },
];

export default function LearnPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-8 lg:max-w-6xl lg:px-10">
      <Link
        href="/"
        className="text-sm text-haze underline underline-offset-4 hover:text-starlight"
      >
        Home
      </Link>
      <h1 className="mt-4 text-4xl font-black tracking-[-0.03em] sm:text-5xl">Sleep guide</h1>
      <p className="mt-3 max-w-[60ch] text-lg leading-relaxed text-haze">
        What research says about sleep for students, and what to do about it tonight. At MRU, 33% of
        students said sleep hurt their academic performance (NCHA 2019, reported by MRU Wellness
        Services, 2021). Every tip below links to the study behind it.
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

      {/* Habits */}
      <section
        aria-labelledby="habits"
        className="mt-16 border-t border-white/10 pt-12 lg:mt-20 lg:pt-16"
      >
        <SectionHead
          id="habits"
          title="Habits that help, and habits that hurt"
          intro="Small, specific changes, each backed by a study you can read."
        />
        <div className="mt-10">
          <HabitColumns />
        </div>
        <div className="mt-12">
          <HabitQuiz />
        </div>
      </section>

      {/* How sleep works */}
      <section
        aria-labelledby="how-sleep-works"
        className="mt-16 border-t border-white/10 pt-12 lg:mt-20 lg:pt-16"
      >
        <SectionHead
          id="how-sleep-works"
          title="How a night of sleep works"
          intro="Sleep isn't one long switch-off. You cycle through stages that do different jobs, and when you wake up changes which ones you get."
        />
        <div className="mt-10">
          <NightOfSleep />
        </div>
        <ul className="mt-10 grid gap-8 lg:grid-cols-3 lg:gap-10">
          {[
            {
              title: "Sleep debt adds up quietly",
              body: "Two weeks of 6-hour nights steadily wore down attention and memory, while people rated themselves only a little sleepy.",
              sources: ["van-dongen-2003"],
            },
            {
              title: "Tired brains feel stress harder",
              body: "After a night without sleep, the brain's emotional centre reacted more strongly to upsetting images.",
              sources: ["yoo-2007"],
            },
            {
              title: "Sleep is when learning sets",
              body: "Sleep after learning improved performance on a task, and steady, sufficient sleep went with better grades.",
              sources: ["mednick-2003", "okano-2019"],
            },
          ].map((f) => (
            <li key={f.title} className="border-t border-white/10 pt-5">
              <p className="font-semibold text-starlight">{f.title}</p>
              <p className="mt-1 leading-relaxed text-haze">{f.body}</p>
              <p className="mt-2">
                <SourceLinks ids={f.sources} />
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Caffeine */}
      <section
        aria-labelledby="caffeine"
        className="mt-16 border-t border-white/10 pt-12 lg:mt-20 lg:pt-16"
      >
        <SectionHead
          id="caffeine"
          title="How long caffeine stays with you"
          intro="Add what you drink today and your bedtime. See how much caffeine is still in your body when you try to sleep."
        />
        <div className="mt-10">
          <CaffeineCalculator />
        </div>
      </section>

      {/* Research */}
      <section
        aria-labelledby="research"
        className="mt-16 border-t border-white/10 pt-12 lg:mt-20 lg:pt-16"
      >
        <SectionHead
          id="research"
          title="Read the research"
          intro={`${STUDIES.length} studies and guidelines behind this guide, in plain words. Each links to the paper or its official record.`}
        />
        <div className="mt-10">
          <ResearchLibrary />
        </div>
      </section>

      <section
        aria-labelledby="help"
        className="mt-16 grid gap-3 border-t border-white/10 py-12 lg:mt-20 lg:grid-cols-12 lg:gap-16"
      >
        <h2
          id="help"
          className="text-2xl font-semibold tracking-[-0.01em] text-starlight lg:col-span-5"
        >
          Struggling with sleep?
        </h2>
        <p className="max-w-[60ch] text-lg leading-relaxed text-haze lg:col-span-7">
          This guide is for learning, not diagnosis. MRU Health Services and{" "}
          <a
            className="font-medium text-starlight underline decoration-starlight/40 underline-offset-4 hover:decoration-starlight"
            href="https://www.mtroyal.ca/CampusServices/WellnessServices/index.htm"
          >
            Wellness Services
          </a>{" "}
          (Wellness Centre, U216) offer free support.
        </p>
      </section>
    </main>
  );
}
