import Image from "next/image";
import moon from "@/public/moon.webp";

/**
 * Photo-style moon (rendered by scripts/render-moon.mts) with its light scattering into the
 * sky. Rises from behind the mountains once on load; static under reduced motion.
 * Its centre matches MOON_CENTER in StarCanvas (74% across, 24% down).
 */
export function RisingMoon() {
  return (
    <div
      aria-hidden="true"
      className="moon-rise pointer-events-none absolute left-[74%] top-[24%] w-[clamp(120px,36vw,230px)] -translate-x-1/2 -translate-y-1/2"
    >
      {/* Wide, faint scattering halo, then a tighter bright glow. */}
      <div className="moon-halo absolute left-1/2 top-1/2 aspect-square w-[420%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(190_205_255/0.09)_0%,rgb(150_170_240/0.035)_28%,transparent_62%)]" />
      <div className="absolute left-1/2 top-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(235_238_255/0.26)_0%,rgb(220_228_255/0.08)_40%,transparent_70%)]" />
      <Image
        src={moon}
        alt=""
        preload
        sizes="(min-width: 640px) 230px, 36vw"
        className="relative h-auto w-full drop-shadow-[0_0_18px_rgb(220_228_255/0.35)]"
      />
    </div>
  );
}
