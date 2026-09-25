"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

type ParallaxProps = {
  children: React.ReactNode;
  className?: string;
  /** Total travel in px across the element's pass through the viewport. Keep it light (≤ 60). */
  offset?: number;
};

/** Light parallax: children drift vertically as the section scrolls past. */
export function Parallax({ children, className, offset = 40 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [offset / 2, -offset / 2]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y }} className="h-full will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}
