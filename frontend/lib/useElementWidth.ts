"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Width of an element in CSS pixels, so SVG charts can draw at 1 unit = 1 px and keep their
 * labels readable on phones (instead of shrinking a wide viewBox).
 */
export function useElementWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(260, Math.round(el.getBoundingClientRect().width)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}
