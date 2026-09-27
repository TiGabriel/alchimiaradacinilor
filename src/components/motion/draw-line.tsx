"use client";

import * as m from "framer-motion/m";

import { easeSoft, revealViewport } from "@/lib/motion";

import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

type DrawLineProps = {
  /** SVG path data, in the coordinate space defined by viewBox. */
  d: string | string[];
  viewBox: string;
  className?: string;
  strokeWidth?: number;
  duration?: number;
  /** SVG transform for the paths, to place them inside a viewBox shared with other drawings. */
  transform?: string;
};

/** A botanical line drawing that "draws itself" when it scrolls into view. */
export function DrawLine({
  d,
  viewBox,
  className,
  strokeWidth = 1.25,
  duration = 2.2,
  transform,
}: DrawLineProps) {
  const reduce = usePrefersReducedMotion();
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg viewBox={viewBox} fill="none" aria-hidden className={className}>
      <g transform={transform}>
        {paths.map((path, i) => (
          <m.path
            key={i}
            d={path}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={revealViewport}
            transition={reduce ? { duration: 0 } : { duration, ease: easeSoft, delay: i * 0.25 }}
          />
        ))}
      </g>
    </svg>
  );
}
