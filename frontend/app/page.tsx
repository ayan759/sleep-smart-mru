import { MoonriseHero } from "@/components/sky/MoonriseHero";
import { Starfield } from "@/components/sky/Starfield";

type Tool = {
  name: string;
  description: string;
  colour: string;
};

const SECONDARY_TOOLS: Tool[] = [
  {
    name: "Exam-crunch planner",
    description: "Get a study plan for exam season that never drops your sleep below 7 hours.",
    colour: "bg-sage",
  },
  {
    name: "Sleep barrier poll",
    description: "Tell MRU what cuts into your sleep. Anonymous, and it takes under a minute.",
    colour: "bg-lilac",
  },
];

function OpeningSoon() {
  return (
    <span className="inline-block shrink-0 whitespace-nowrap rounded-full border-2 border-ink bg-starlight px-3 py-0.5 text-xs font-semibold text-ink">
      Opening soon
    </span>
  );
}

/** Decorative alertness curve on the Sleep Weather card (not data). */
function ForecastSketch() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 280 72" className="h-16 w-full">
      <path
        d="M0 60 C 30 60, 40 26, 80 22 S 130 40, 160 44 S 210 12, 240 16 S 270 40, 280 52"
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="140" y="0" width="44" height="72" rx="6" fill="var(--color-coral)" opacity="0.35" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5">
      <section aria-labelledby="hero-title" className="pt-6">
        <div className="relative">
          <Starfield />
          <MoonriseHero />
        </div>
        <h1
          id="hero-title"
          className="mt-6 text-[clamp(2.75rem,11vw,4.5rem)] font-black leading-[0.95] tracking-[-0.035em]"
        >
          Sleep Smart MRU
        </h1>
        <p className="mt-5 max-w-[34ch] text-xl font-medium leading-snug text-starlight">
          Free sleep tools for Mount Royal students.
        </p>
        <p className="mt-2 max-w-[52ch] text-lg leading-relaxed text-haze">
          See how alert you&apos;ll be tomorrow, plan exam study without losing sleep, and tell MRU
          what keeps you up.
        </p>
      </section>

      <section aria-label="Tools" className="mt-12 grid gap-6 sm:grid-cols-2">
        <article className="rounded-[2rem] border-[2.5px] border-ink bg-moon p-6 text-ink shadow-sticker sm:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl font-extrabold tracking-tight">Sleep Weather</h2>
            <OpeningSoon />
          </div>
          <p className="mt-2 max-w-[48ch] text-base leading-relaxed">
            Forecast tomorrow&apos;s alertness from your sleep and class schedule, and spot the
            classes that land in a slump.
          </p>
          <div className="mt-4">
            <ForecastSketch />
          </div>
        </article>

        {SECONDARY_TOOLS.map((tool) => (
          <article
            key={tool.name}
            className={`rounded-3xl border-[2.5px] border-ink ${tool.colour} p-5 text-ink shadow-sticker-sm`}
          >
            <h2 className="text-xl font-extrabold tracking-tight">{tool.name}</h2>
            <p className="mt-2 leading-relaxed">{tool.description}</p>
            <div className="mt-4">
              <OpeningSoon />
            </div>
          </article>
        ))}
      </section>

      <section
        aria-labelledby="wellness-title"
        className="mt-12 rounded-2xl border border-starlight/20 bg-night-deep/60 p-5"
      >
        <h2 id="wellness-title" className="text-lg font-bold">
          MRU Wellness Services
        </h2>
        <p className="mt-1 leading-relaxed text-haze">
          Free support for students at the Wellness Centre, room U216. Email{" "}
          <a
            href="mailto:wellness@mtroyal.ca"
            className="font-semibold text-starlight underline underline-offset-4"
          >
            wellness@mtroyal.ca
          </a>{" "}
          or{" "}
          <a
            href="https://www.mtroyal.ca/CampusServices/WellnessServices/index.htm"
            className="font-semibold text-starlight underline underline-offset-4"
          >
            visit Wellness Services online
          </a>
          .
        </p>
      </section>
    </main>
  );
}
