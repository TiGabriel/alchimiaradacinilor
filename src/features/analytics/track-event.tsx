"use client";

import { useEffect, useRef } from "react";

import { track } from "@/lib/analytics/client";
import type { AnalyticsEventName } from "@/lib/analytics/events";

/** Fires one analytics event when rendered (sent only with analytics consent). */
export function TrackEvent({
  name,
  props,
}: {
  name: AnalyticsEventName;
  props?: Record<string, string | number | boolean | null>;
}) {
  const sent = useRef(false);
  const key = JSON.stringify(props ?? {});
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    track(name, JSON.parse(key) as Record<string, unknown>);
  }, [name, key]);
  return null;
}
