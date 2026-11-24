import type { Metadata } from "next";
import Link from "next/link";
import { ForecastScreen } from "@/components/forecast/ForecastApp";

export const metadata: Metadata = {
  title: "Sleep Weather",
  description: "Tomorrow's alertness forecast from your sleep and class schedule.",
};

export default function ForecastPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-8 lg:max-w-6xl lg:px-10">
      <Link
        href="/"
        className="text-sm text-haze underline underline-offset-4 hover:text-starlight"
      >
        Home
      </Link>
      <h1 className="mt-4 text-4xl font-black tracking-[-0.03em] sm:text-5xl">Sleep Weather</h1>
      <p className="mt-3 max-w-[60ch] text-lg leading-relaxed text-haze">
        Your predicted alertness for tomorrow, based on how you&apos;ve slept and when your classes
        are. An educational estimate, not a medical tool.
      </p>
      <ForecastScreen />
    </main>
  );
}
