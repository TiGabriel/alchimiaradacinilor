"use client";

import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";

/**
 * Dialogs opened from code (after "add to cart", Ctrl+K) have no Radix trigger,
 * so on close Radix would drop focus on <body>. Render `<FocusOrigin>` inside
 * the dialog content and pass `restoreFocus` as `onCloseAutoFocus`: focus goes
 * back to whatever had it when the dialog opened.
 */
export function useReturnFocus() {
  const originRef = useRef<HTMLElement | null>(null);
  const restoreFocus = useCallback((event: Event) => {
    const el = originRef.current;
    originRef.current = null;
    if (el?.isConnected) {
      event.preventDefault();
      el.focus();
    }
  }, []);
  return { originRef, restoreFocus };
}

/** Records the focused element when the dialog content mounts (before Radix moves focus in). */
export function FocusOrigin({ originRef }: { originRef: RefObject<HTMLElement | null> }) {
  useLayoutEffect(() => {
    const el = document.activeElement;
    originRef.current = el instanceof HTMLElement && el !== document.body ? el : null;
  }, [originRef]);
  return null;
}
