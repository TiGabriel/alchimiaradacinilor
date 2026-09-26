"use client";

import * as m from "framer-motion/m";

import { easeBotanical } from "@/lib/motion";

import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

/** Gentle scale on hover (e.g. images inside cards). Disabled with reduced motion. */
export function HoverScale({
  children,
  className,
  scale = 1.04,
}: {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}) {
  const reduce = usePrefersReducedMotion();
  return (
    <m.div
      className={className}
      whileHover={reduce ? undefined : { scale }}
      transition={{ duration: 0.6, ease: easeBotanical }}
    >
      {children}
    </m.div>
  );
}
