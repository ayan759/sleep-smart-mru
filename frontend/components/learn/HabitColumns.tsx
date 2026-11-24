import { BAD_HABITS, GOOD_HABITS, type Habit } from "@/lib/learn/habits";
import { SourceLinks } from "./SourceLinks";

function Mark({ good }: { good: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[13px] font-bold ${
        good ? "bg-sage/15 text-sage" : "bg-coral/15 text-coral"
      }`}
    >
      {good ? "✓" : "✕"}
    </span>
  );
}

function Column({ title, habits, good }: { title: string; habits: Habit[]; good: boolean }) {
  return (
    <div>
      <h3 className={`text-sm font-semibold ${good ? "text-sage" : "text-coral"}`}>{title}</h3>
      <ul className="mt-2 divide-y divide-white/[0.07] border-t border-white/[0.07]">
        {habits.map((h) => (
          <li key={h.title} className="flex gap-4 py-5">
            <Mark good={good} />
            <div className="min-w-0">
              <p className="font-semibold text-starlight">{h.title}</p>
              <p className="mt-1 leading-relaxed text-haze">{h.why}</p>
              <p className="mt-2">
                <SourceLinks ids={h.sources} />
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HabitColumns() {
  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <Column title="Do this" habits={GOOD_HABITS} good />
      <Column title="Skip this" habits={BAD_HABITS} good={false} />
    </div>
  );
}
