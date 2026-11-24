import type { Metadata } from "next";
import Link from "next/link";
import { HealthCheck } from "./HealthCheck";

export const metadata: Metadata = { title: "System check" };

export default function StatusPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-10 lg:max-w-6xl lg:px-10">
      <Link href="/" className="text-haze underline underline-offset-4 hover:text-starlight">
        Back to home
      </Link>
      <h1 className="mt-6 text-4xl font-black tracking-[-0.03em]">System check</h1>
      <p className="mt-3 max-w-[56ch] text-lg leading-relaxed text-haze">
        Checks that both parts of the app are running: this website and the Python study planner.
      </p>
      <HealthCheck />
    </main>
  );
}
