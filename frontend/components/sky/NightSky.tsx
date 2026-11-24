import { BrightStars } from "./BrightStars";
import { Mountains } from "./Mountains";
import { RisingMoon } from "./RisingMoon";
import { StarCanvas } from "./StarCanvas";

/**
 * Full-bleed night scene over the Rockies: deep-space gradient, Milky Way and faint stars
 * (canvas), a few glowing bright stars (DOM), the moon, and layered mountains.
 * Purely decorative: hidden from assistive tech.
 */
export function NightSky({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`relative isolate overflow-hidden bg-[linear-gradient(180deg,var(--color-space)_0%,#060a17_38%,#0d1430_70%,#1d2748_100%)] ${className}`}
    >
      {/* Faint airglow along the horizon (box runs to the bottom, so no visible edge). */}
      <div className="absolute inset-x-0 bottom-0 h-3/4 bg-[radial-gradient(95%_38%_at_50%_62%,rgb(70_92_165/0.26),transparent_72%)]" />
      <StarCanvas />
      <BrightStars />
      <RisingMoon />
      <Mountains />
    </div>
  );
}
