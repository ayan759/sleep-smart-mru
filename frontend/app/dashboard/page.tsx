import type { Metadata } from "next";
import Link from "next/link";
import { DashboardScreen } from "@/components/poll/Dashboard";

export const metadata: Metadata = {
  title: "Committee dashboard",
  description: "What MRU students say cuts into their sleep, and what support they want.",
};

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-8 lg:max-w-6xl lg:px-10">
      <Link
        href="/"
        className="text-sm text-haze underline underline-offset-4 hover:text-starlight"
      >
        Home
      </Link>
      <h1 className="mt-4 text-4xl font-black tracking-[-0.03em] sm:text-5xl">
        What keeps MRU up at night
      </h1>
      <p className="mt-3 max-w-[60ch] text-lg leading-relaxed text-haze">
        Anonymous answers from the Sleep Smart MRU poll: the barriers students face, and what they
        want MRU to do about them.
      </p>
      <DashboardScreen />
    </main>
  );
}
