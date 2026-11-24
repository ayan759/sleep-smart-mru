import { ToolCard } from "@/components/home/ToolCard";
import { ForecastPreview, PlannerPreview, PollPreview } from "@/components/home/ToolPreviews";
import { NightSky } from "@/components/sky/NightSky";

const STATUS = "Opening soon";

export default function Home() {
  return (
    <main className="w-full">
      <section aria-labelledby="hero-title" className="relative">
        <NightSky className="h-[clamp(540px,82svh,800px)]" />
        {/* Title rests on the dark foreground mountains. */}
        <div className="relative z-10 mx-auto -mt-[clamp(170px,22svh,240px)] w-full max-w-3xl px-5 lg:max-w-6xl lg:px-10">
          <h1
            id="hero-title"
            className="text-[clamp(2.75rem,11vw,4.75rem)] font-black leading-[0.95] tracking-[-0.035em] [text-shadow:0_2px_24px_rgb(3_5_12/0.6)]"
          >
            Sleep Smart MRU
          </h1>
          <p className="mt-5 max-w-[34ch] text-xl font-medium leading-snug text-starlight">
            Free sleep tools for Mount Royal students.
          </p>
          <p className="mt-2 max-w-[52ch] text-lg leading-relaxed text-haze">
            See how alert you&apos;ll be tomorrow, plan exam study without losing sleep, and tell
            MRU what keeps you up.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-3xl px-5 lg:max-w-6xl lg:px-10">
        <section
          aria-label="Tools"
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-12"
        >
          <ToolCard
            featured
            accent="moon"
            title="Sleep Weather"
            href="/forecast"
            description="Forecast tomorrow's alertness from your sleep and class schedule, and spot the classes that land in a slump."
            status="Open now"
            preview={<ForecastPreview />}
          />
          <ToolCard
            accent="sage"
            title="Exam-crunch planner"
            description="Get a study plan for exam season that never drops your sleep below 7 hours."
            status={STATUS}
            preview={<PlannerPreview />}
          />
          <ToolCard
            accent="lilac"
            title="Sleep barrier poll"
            href="/poll"
            description="Tell MRU what cuts into your sleep. Anonymous, and it takes under a minute."
            status="Open now"
            preview={<PollPreview />}
          />
        </section>

        <section
          aria-labelledby="wellness-title"
          className="surface-night mt-5 rounded-[20px] p-5 sm:p-6"
        >
          <h2 id="wellness-title" className="text-lg font-bold text-starlight">
            MRU Wellness Services
          </h2>
          <p className="mt-1 leading-relaxed text-haze">
            Free support for students at the Wellness Centre, room U216. Email{" "}
            <a
              href="mailto:wellness@mtroyal.ca"
              className="font-semibold text-starlight underline decoration-starlight/40 underline-offset-4 hover:decoration-starlight"
            >
              wellness@mtroyal.ca
            </a>{" "}
            or{" "}
            <a
              href="https://www.mtroyal.ca/CampusServices/WellnessServices/index.htm"
              className="font-semibold text-starlight underline decoration-starlight/40 underline-offset-4 hover:decoration-starlight"
            >
              visit Wellness Services online
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
