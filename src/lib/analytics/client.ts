/**
 * Browser analytics layer. Nothing is sent — and no third-party script is
 * loaded — unless the visitor allowed analytics cookies. Events raised before
 * the consent state is known are queued, then sent or dropped.
 * Providers are pluggable (first-party endpoint by default; GA/Plausible could
 * register here, loading their scripts only after consent).
 */
import { cleanPath, sanitizeProps, type AnalyticsEventName, type AnalyticsPayload } from "./events";

export type AnalyticsProvider = { name: string; send(event: AnalyticsPayload): void };

const firstPartyProvider: AnalyticsProvider = {
  name: "first-party",
  send(event) {
    const body = JSON.stringify(event);
    if (navigator.sendBeacon?.("/api/analytics", new Blob([body], { type: "application/json" })))
      return;
    void fetch("/api/analytics", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  },
};

const providers: AnalyticsProvider[] = [firstPartyProvider];
let state: { resolved: boolean; allowed: boolean; anonymousId: string | null } = {
  resolved: false,
  allowed: false,
  anonymousId: null,
};
let queue: Array<Omit<AnalyticsPayload, "anonymousId">> = [];

export function registerAnalyticsProvider(provider: AnalyticsProvider) {
  if (!providers.some((p) => p.name === provider.name)) providers.push(provider);
}

function dispatch(event: Omit<AnalyticsPayload, "anonymousId">) {
  if (!state.allowed || !state.anonymousId) return;
  const payload = { ...event, anonymousId: state.anonymousId };
  if (process.env.NODE_ENV === "development") console.debug("[analytics]", payload);
  for (const provider of providers) {
    try {
      provider.send(payload);
    } catch {
      // Analytics must never break the page.
    }
  }
}

/** Called by the consent provider whenever the visitor's choice is known or changes. */
export function setAnalyticsConsent(allowed: boolean, anonymousId: string | null) {
  state = { resolved: true, allowed: allowed && Boolean(anonymousId), anonymousId };
  const pending = queue;
  queue = [];
  if (state.allowed) pending.forEach(dispatch);
}

export function track(name: AnalyticsEventName, props: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const event = { name, path: cleanPath(window.location.pathname), props: sanitizeProps(props) };
  if (!state.resolved) {
    if (queue.length < 50) queue.push(event);
    return;
  }
  dispatch(event);
}

/** Test helper. */
export function resetAnalyticsForTests() {
  state = { resolved: false, allowed: false, anonymousId: null };
  queue = [];
  providers.splice(1);
}
