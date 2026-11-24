"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { SKY_DRIFT, SKY_HEIGHT, SKY_LAG, SKY_WIDTH } from "@/lib/sky";

/**
 * Scroll-linked drift: as the page scrolls through the hero, the sky layer (moon, Milky Way and
 * stars together) slides left and scrolls up more slowly than the page, so the moon lingers while it
 * crosses the sky. Mountains and everything outside `sky` stay put, which reads as
 * depth. Uses one CSS variable on the scene root, so scrolling stays smooth; skipped entirely
 * for people who prefer reduced motion.
 */
export function SkyParallax({
  className,
  sky,
  children,
}: {
  className: string;
  sky: ReactNode;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const update = () => {
      const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, el.offsetHeight)));
      el.style.setProperty("--sky-p", progress.toFixed(4));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div ref={root} aria-hidden="true" className={className}>
      <div
        className="absolute left-0 will-change-transform"
        style={{
          top: `${-(SKY_HEIGHT - 1) * 100}%`,
          width: `${SKY_WIDTH * 100}%`,
          height: `${SKY_HEIGHT * 100}%`,
          transform: `translate3d(calc(var(--sky-p, 0) * -${SKY_DRIFT * 100}%), calc(var(--sky-p, 0) * ${(SKY_LAG * 100).toFixed(3)}%), 0)`,
        }}
      >
        {sky}
      </div>
      {children}
    </div>
  );
}
