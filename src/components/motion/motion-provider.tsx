"use client";

import { MotionConfig } from "motion/react";

/**
 * reducedMotion="user": when the OS asks for reduced motion, Motion skips
 * transform/layout animations globally. Individual components additionally
 * render their final state immediately (see useReducedMotion usages).
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
