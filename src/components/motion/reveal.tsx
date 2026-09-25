"use client";

import { motion } from "motion/react";

import { durations, easeBotanical, revealViewport } from "@/lib/motion";

import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Vertical offset in px to travel from. */
  y?: number;
  delay?: number;
  as?: "div" | "section" | "li" | "article" | "span";
};

/**
 * Fades + lifts its children into place the first time they scroll into view.
 * With reduced motion the content simply appears (no travel, no duration).
 */
export function Reveal({ children, className, y = 18, delay = 0, as = "div" }: RevealProps) {
  const reduce = usePrefersReducedMotion();
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      // Reduced motion: show the content at once instead of waiting for the viewport.
      {...(reduce
        ? { animate: { opacity: 1, y: 0 } }
        : { whileInView: { opacity: 1, y: 0 }, viewport: revealViewport })}
      transition={
        reduce ? { duration: 0 } : { duration: durations.slow, ease: easeBotanical, delay }
      }
    >
      {children}
    </Component>
  );
}
