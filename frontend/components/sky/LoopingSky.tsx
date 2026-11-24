"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { SKY_SPEED_PX_PER_S } from "@/lib/sky";

/**
 * Two identical sky tiles side by side, sliding left by exactly one tile and repeating, so the
 * sky drifts forever with no visible reset. The motion is a CSS transform animation (GPU, no
 * per-frame JavaScript); only its duration is set here so the speed is the same on any screen.
 * Disabled for prefers-reduced-motion in globals.css.
 */
export function LoopingSky({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const setSpeed = () => {
      const tile = el.offsetWidth / 2;
      el.style.animationDuration = `${Math.max(20, tile / SKY_SPEED_PX_PER_S)}s`;
    };
    setSpeed();
    const observer = new ResizeObserver(setSpeed);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="sky-loop absolute inset-y-0 left-0"
      // Each tile is at least 900 px wide so the Milky Way's wave stays gentle on phones.
      style={{ width: "max(200%, 1800px)" }}
    >
      {children}
    </div>
  );
}
