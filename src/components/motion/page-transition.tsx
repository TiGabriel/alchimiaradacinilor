"use client";

import * as m from "framer-motion/m";

import { easeBotanical } from "@/lib/motion";

import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

/**
 * Enter transition for route changes. Used from app/template.tsx, which
 * re-mounts on every navigation (the App Router does not support exit
 * animations, so only the entering page animates).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduce = usePrefersReducedMotion();
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.5, ease: easeBotanical }}
    >
      {children}
    </m.div>
  );
}
