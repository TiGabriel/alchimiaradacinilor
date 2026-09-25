"use client";

import { motion, type Variants } from "motion/react";
import { createContext, useContext } from "react";

import { durations, easeBotanical, revealViewport } from "@/lib/motion";

import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

const ReducedContext = createContext(false);

type StaggerProps = {
  children: React.ReactNode;
  className?: string;
  /** Seconds between children. */
  stagger?: number;
  as?: "div" | "ul" | "ol";
};

/** Reveals <StaggerItem> children one after another when the group scrolls into view. */
export function Stagger({ children, className, stagger = 0.08, as = "div" }: StaggerProps) {
  const reduce = usePrefersReducedMotion();
  const Component = motion[as];
  const variants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduce ? 0 : stagger } },
  };
  return (
    <ReducedContext.Provider value={reduce}>
      <Component
        className={className}
        variants={variants}
        initial="hidden"
        whileInView="visible"
        viewport={revealViewport}
      >
        {children}
      </Component>
    </ReducedContext.Provider>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const reduce = useContext(ReducedContext);
  const Component = motion[as];
  const variants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: reduce ? { duration: 0 } : { duration: durations.slow, ease: easeBotanical },
    },
  };
  return (
    <Component className={className} variants={variants}>
      {children}
    </Component>
  );
}
