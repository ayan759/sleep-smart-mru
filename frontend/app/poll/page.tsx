import type { Metadata } from "next";
import Link from "next/link";
import { PollScreen } from "@/components/poll/PollForm";

export const metadata: Metadata = {
  title: "Sleep barrier poll",
  description: "Tell MRU what cuts into your sleep. Anonymous, under a minute.",
};

export default function PollPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-8 lg:px-10">
      <Link
        href="/"
        className="text-sm text-haze underline underline-offset-4 hover:text-starlight"
      >
        Home
      </Link>
      <h1 className="mt-4 text-4xl font-black tracking-[-0.03em] sm:text-5xl">
        What keeps you up?
      </h1>
      <p className="mt-3 max-w-[56ch] text-lg leading-relaxed text-haze">
        Three quick questions, under a minute. No names, no accounts.
      </p>
      <PollScreen />
    </main>
  );
}
