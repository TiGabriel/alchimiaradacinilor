"use client";

import { motion } from "motion/react";

import { easeSoft, revealViewport } from "@/lib/motion";

import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

type DrawLineProps = {
  /** SVG path data, in the coordinate space defined by viewBox. */
  d: string | string[];
  viewBox: string;
  className?: string;
  strokeWidth?: number;
  duration?: number;
};

/** A botanical line drawing that "draws itself" when it scrolls into view. */
export function DrawLine({
  d,
  viewBox,
  className,
  strokeWidth = 1.25,
  duration = 2.2,
}: DrawLineProps) {
  const reduce = usePrefersReducedMotion();
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg viewBox={viewBox} fill="none" aria-hidden className={className}>
      {paths.map((path, i) => (
        <motion.path
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
    </svg>
  );
}
