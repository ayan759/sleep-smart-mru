import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How Sleep Weather works",
  description: "A plain-language explanation of the alertness model behind Sleep Weather.",
};

const PROCESSES = [
  {
    name: "Sleep pressure",
    tone: "border-lilac/30 bg-lilac/[0.06]",
    body: "The longer you're awake, the more sleep pressure builds and the harder it is to stay sharp. Sleep clears it, quickly at first and then more slowly. A short night leaves some of it behind for tomorrow.",
  },
  {
    name: "Body clock",
    tone: "border-moon/30 bg-moon/[0.06]",
    body: "Your circadian rhythm rises and falls over about 24 hours, whether you slept well or not. It's lowest in the early morning and highest in the late afternoon, which is why an 8 a.m. exam can feel harder than a 2 p.m. one.",
  },
  {
    name: "Sleep inertia",
    tone: "border-coral/30 bg-coral/[0.06]",
    body: "Right after waking you're groggy. That fog lifts over roughly the first hour, so anything that starts minutes after your alarm gets a warning.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-8 lg:px-10">
      <Link
        href="/forecast"
        className="text-sm text-haze underline underline-offset-4 hover:text-starlight"
      >
        Back to Sleep Weather
      </Link>
      <h1 className="mt-4 text-4xl font-black tracking-[-0.03em] sm:text-5xl">
        How Sleep Weather works
      </h1>
      <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-haze">
        Sleep Weather uses a published scientific model of alertness to estimate how sharp
        you&apos;ll feel at each point tomorrow. It&apos;s an educational estimate, not a medical
        tool, and it can&apos;t diagnose anything.
      </p>

      <h2 className="mt-12 text-2xl font-bold tracking-tight text-starlight">
        Three things add up
      </h2>
      <div className="mt-5 grid gap-4">
        {PROCESSES.map((p) => (
          <section key={p.name} className={`rounded-3xl border p-5 ${p.tone}`}>
            <h3 className="text-lg font-semibold text-starlight">{p.name}</h3>
            <p className="mt-1 leading-relaxed text-haze">{p.body}</p>
          </section>
        ))}
      </div>
      <p className="mt-5 max-w-[62ch] leading-relaxed text-haze">
        Scientists call these Process S, Process C and Process W. The first two come from the
        two-process model of sleep regulation (Borbély, 1982; Daan et al., 1984); sleep inertia was
        added in the three-process model of alertness (Åkerstedt &amp; Folkard, 1997). We use the
        three-process model&apos;s published equations and values, as restated by Ingre et al.
        (2014).
      </p>

      <h2 className="mt-12 text-2xl font-bold tracking-tight text-starlight">
        What makes it yours
      </h2>
      <ul className="mt-4 grid max-w-[62ch] gap-3 leading-relaxed text-haze">
        <li>
          <strong className="text-starlight">Your last 7 nights</strong> set how much sleep pressure
          you carry into tomorrow, and tonight&apos;s planned bedtime and alarm finish the picture.
        </li>
        <li>
          <strong className="text-starlight">Your body-clock timing</strong> is estimated from the
          middle of your sleep on nights before free days, the method behind the Munich ChronoType
          Questionnaire (Roenneberg et al., 2003, 2004). Night owls get a later peak.
        </li>
        <li>
          <strong className="text-starlight">&ldquo;Low for you&rdquo;</strong> means the bottom
          third of your own waking range over the past week, not a fixed score. The 0–100 number is
          just the model&apos;s scale stretched to fit.
        </li>
        <li>
          <strong className="text-starlight">Warnings</strong> appear when a class, exam or shift
          starts within an hour of waking or inside one of your low windows.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl font-bold tracking-tight text-starlight">Honest limits</h2>
      <ul className="mt-4 grid max-w-[62ch] list-disc gap-2 pl-5 leading-relaxed text-haze">
        <li>Everyone&apos;s different. Caffeine, stress, illness and naps aren&apos;t included.</li>
        <li>
          We leave out a smaller 12-hour rhythm some later versions add, and one detail of how sleep
          recovery slows near the end of the night that we couldn&apos;t confirm from the published
          source. Both are noted in our code.
        </li>
        <li>
          Matching your sleep timing to the model&apos;s default body-clock peak uses an assumption
          (a typical 11 p.m.–7 a.m. sleeper), which we flag in our code.
        </li>
        <li>Your sleep log and schedule stay on your phone. Nothing is sent to us.</li>
      </ul>
      <p className="mt-5 max-w-[62ch] leading-relaxed text-haze">
        Canadian guidelines recommend 7–9 hours of good-quality sleep for adults 18–64, with
        consistent bed and wake times (CSEP, 2020). If you&apos;re regularly sleeping much less,{" "}
        <a
          className="font-semibold text-starlight underline underline-offset-4"
          href="https://www.mtroyal.ca/CampusServices/WellnessServices/index.htm"
        >
          MRU Wellness Services
        </a>{" "}
        can help.
      </p>

      <h2 className="mt-12 text-2xl font-bold tracking-tight text-starlight">References</h2>
      <ol className="mt-4 grid gap-3 text-sm leading-relaxed text-haze [&>li]:pl-8 [&>li]:-indent-8">
        <li>
          Åkerstedt, T., &amp; Folkard, S. (1997). The three-process model of alertness and its
          extension to performance, sleep latency, and sleep length.{" "}
          <em>Chronobiology International, 14</em>(2), 115–123.
        </li>
        <li>
          Åkerstedt, T., Folkard, S., &amp; Portin, C. (2004). Predictions from the three-process
          model of alertness. <em>Aviation, Space, and Environmental Medicine, 75</em>(3, Suppl.),
          A75–A83.
        </li>
        <li>
          Borbély, A. A. (1982). A two process model of sleep regulation.{" "}
          <em>Human Neurobiology, 1</em>
          (3), 195–204.
        </li>
        <li>
          Canadian Society for Exercise Physiology. (2020).{" "}
          <em>Canadian 24-hour movement guidelines for adults aged 18–64 years</em>.
        </li>
        <li>
          Daan, S., Beersma, D. G. M., &amp; Borbély, A. A. (1984). Timing of human sleep: Recovery
          process gated by a circadian pacemaker. <em>American Journal of Physiology, 246</em>(2),
          R161–R183.
        </li>
        <li>
          Ingre, M., Van Leeuwen, W., Klemets, T., Ullvetter, C., Hough, S., Kecklund, G., Karlsson,
          D., &amp; Åkerstedt, T. (2014). Validating and extending the three process model of
          alertness in airline operations. <em>PLoS ONE, 9</em>(10), e108679.{" "}
          <a
            className="underline underline-offset-4"
            href="https://doi.org/10.1371/journal.pone.0108679"
          >
            https://doi.org/10.1371/journal.pone.0108679
          </a>
        </li>
        <li>
          Roenneberg, T., Kuehnle, T., Pramstaller, P. P., Ricken, J., Havel, M., Guth, A., &amp;
          Merrow, M. (2004). A marker for the end of adolescence. <em>Current Biology, 14</em>(24),
          R1038–R1039.
        </li>
        <li>
          Roenneberg, T., Wirz-Justice, A., &amp; Merrow, M. (2003). Life between clocks: Daily
          temporal patterns of human chronotypes. <em>Journal of Biological Rhythms, 18</em>(1),
          80–90.
        </li>
      </ol>
    </main>
  );
}
