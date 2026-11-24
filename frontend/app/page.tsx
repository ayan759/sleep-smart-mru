import { ToolRow } from "@/components/home/ToolRow";
import { ForecastScreen, PlannerScreen, PollScreen } from "@/components/home/ToolScreens";
import { NightSky } from "@/components/sky/NightSky";

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
        <section aria-label="Tools" className="mt-16 lg:mt-24">
          <ToolRow
            title="Sleep Weather"
            description="Forecast tomorrow's alertness from your sleep and class schedule, and see which classes land in a slump."
            action="Check tomorrow's forecast"
            href="/forecast"
            screen={<ForecastScreen />}
          />
          <ToolRow
            title="Exam-crunch planner"
            description="Get a study plan for exam season that works around your classes and never drops your sleep below 7 hours."
            action="Build a study plan"
            href="/plan"
            screen={<PlannerScreen />}
          />
          <ToolRow
            title="Sleep barrier poll"
            description="Tell MRU what cuts into your sleep. Three questions, anonymous, under a minute."
            action="Answer the poll"
            href="/poll"
            screen={<PollScreen />}
          />
        </section>

        <section
          aria-labelledby="wellness-title"
          className="grid gap-3 border-t border-white/10 py-12 lg:grid-cols-12 lg:gap-16 lg:py-16"
        >
          <h2
            id="wellness-title"
            className="text-2xl font-semibold tracking-[-0.01em] text-starlight lg:col-span-5"
          >
            MRU Wellness Services
          </h2>
          <p className="max-w-[60ch] text-lg leading-relaxed text-haze lg:col-span-7">
            Free support for students at the Wellness Centre, room U216. Email{" "}
            <a
              href="mailto:wellness@mtroyal.ca"
              className="font-medium text-starlight underline decoration-starlight/40 underline-offset-4 hover:decoration-starlight"
            >
              wellness@mtroyal.ca
            </a>{" "}
            or{" "}
            <a
              href="https://www.mtroyal.ca/CampusServices/WellnessServices/index.htm"
              className="font-medium text-starlight underline decoration-starlight/40 underline-offset-4 hover:decoration-starlight"
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
