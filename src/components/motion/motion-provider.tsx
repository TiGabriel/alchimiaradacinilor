"use client";

import { domAnimation, LazyMotion, MotionConfig } from "framer-motion";

/**
 * reducedMotion="user": when the OS asks for reduced motion, Motion skips
 * transform/layout animations globally. Individual components additionally
 * render their final state immediately (see useReducedMotion usages).
 *
 * LazyMotion + `m.*` components load only the DOM animation features
 * (animate, variants, exit, in-view, hover/tap/focus), not drag or layout.
 * `strict` makes a stray `motion.*` component fail loudly in development.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
