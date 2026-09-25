/** Shared motion vocabulary so every animation feels like the same brand. */

export const easeBotanical = [0.22, 1, 0.36, 1] as const;
export const easeSoft = [0.4, 0, 0.2, 1] as const;

export const durations = {
  fast: 0.2,
  base: 0.45,
  slow: 0.8,
  ambient: 9,
} as const;

/** Viewport options for scroll-triggered reveals: animate once, slightly before fully visible. */
export const revealViewport = { once: true, margin: "0px 0px -10% 0px" } as const;
