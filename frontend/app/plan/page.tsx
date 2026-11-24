import type { Metadata } from "next";
import Link from "next/link";
import { PlanScreen } from "@/components/plan/PlanApp";

export const metadata: Metadata = {
  title: "Exam-crunch planner",
  description: "A study plan for exam season that never drops your sleep below 7 hours.",
};

export default function PlanPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-8 lg:max-w-6xl lg:px-10">
      <Link
        href="/"
        className="text-sm text-haze underline underline-offset-4 hover:text-starlight"
      >
        Home
      </Link>
      <h1 className="mt-4 text-4xl font-black tracking-[-0.03em] sm:text-5xl">
        Exam-crunch planner
      </h1>
      <p className="mt-3 max-w-[62ch] text-lg leading-relaxed text-haze">
        Tell it your exams and how much studying each needs. It builds a plan around your classes
        and shifts that never cuts your sleep below 7 hours and keeps your wake-up time steady.
      </p>
      <PlanScreen />
    </main>
  );
}
