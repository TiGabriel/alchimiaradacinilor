"use client";

import { motion } from "motion/react";

import { durations } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

type BotanicalFloatProps = {
  children: React.ReactNode;
  className?: string;
  /** Vertical drift in px. */
  drift?: number;
  /** Rotation swing in degrees. */
  sway?: number;
  /** Seconds for one full cycle. */
  duration?: number;
  delay?: number;
};

/** Slow ambient floating for decorative botanical elements (always aria-hidden). Static with reduced motion. */
export function BotanicalFloat({
  children,
  className,
  drift = 10,
  sway = 3,
  duration = durations.ambient,
  delay = 0,
}: BotanicalFloatProps) {
  const reduce = usePrefersReducedMotion();
  return (
    <motion.div
      aria-hidden
      className={cn("pointer-events-none", className)}
      animate={reduce ? { y: 0, rotate: 0 } : { y: [0, -drift, 0], rotate: [0, sway, 0] }}
      transition={
        reduce ? { duration: 0 } : { duration, delay, ease: "easeInOut", repeat: Infinity }
      }
    >
      {children}
    </motion.div>
  );
}
