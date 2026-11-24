import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-3xl px-5 pb-10 pt-12 lg:max-w-6xl lg:px-10 text-sm leading-relaxed text-haze">
      <p className="max-w-[62ch]">
        Sleep Smart MRU gives educational estimates, not medical advice. It doesn&apos;t diagnose
        sleep problems. For health concerns, talk to MRU Health Services or Wellness Services.
      </p>
      <p className="mt-3">
        A UGST 1002 class project at Mount Royal University.{" "}
        <Link
          href="/about"
          className="underline decoration-haze/50 underline-offset-4 hover:text-starlight"
        >
          About this project
        </Link>
        <span aria-hidden="true" className="mx-2 text-haze/40">
          |
        </span>
        <Link
          href="/dashboard"
          className="underline decoration-haze/50 underline-offset-4 hover:text-starlight"
        >
          Poll results
        </Link>
        <span aria-hidden="true" className="mx-2 text-haze/40">
          |
        </span>
        <Link
          href="/learn"
          className="underline decoration-haze/50 underline-offset-4 hover:text-starlight"
        >
          Sleep guide
        </Link>
        <span aria-hidden="true" className="mx-2 text-haze/40">
          |
        </span>
        <Link
          href="/status"
          className="underline decoration-haze/50 underline-offset-4 hover:text-starlight"
        >
          System check
        </Link>
      </p>
    </footer>
  );
}
