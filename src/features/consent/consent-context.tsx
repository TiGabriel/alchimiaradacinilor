"use client";

import { Cookie } from "lucide-react";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { setAnalyticsConsent } from "@/lib/analytics/client";
import {
  allows,
  CONSENT_COOKIE,
  needsChoice,
  parseChoice,
  type CookieChoice,
} from "@/lib/consent/cookie-choice";

import { saveCookieChoiceAction } from "./actions";

type ConsentContextValue = {
  choice: CookieChoice | null;
  openSettings: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function useCookieConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useCookieConsent must be used inside <ConsentProvider>");
  return ctx;
}

// The choice lives in a cookie; components re-read it after it changes.
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}
function cookieChanged() {
  listeners.forEach((l) => l());
}
/** Raw cookie value ("" when absent) in the browser; null during SSR/hydration. */
function readRaw(): string {
  return (
    document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
      ?.slice(CONSENT_COOKIE.length + 1) ?? ""
  );
}

const categories = [
  {
    key: "necessary",
    title: "Necesare",
    text: "Păstrează coșul, sesiunea de autentificare și alegerea ta despre cookie-uri. Fără ele site-ul nu funcționează, așa că sunt mereu active.",
  },
  {
    key: "analytics",
    title: "Analiză",
    text: "Ne arată, anonim, ce pagini și produse sunt vizitate, ca să îmbunătățim magazinul. Datele rămân la noi și nu sunt legate de contul tău.",
  },
  {
    key: "marketing",
    title: "Marketing",
    text: "Ar permite măsurarea campaniilor și reclame relevante pe alte site-uri. Momentan nu folosim astfel de servicii; opțiunea există pentru transparență.",
  },
] as const;

/**
 * Cookie banner + settings. Until the visitor chooses, only necessary cookies
 * exist and no analytics event leaves the browser.
 */
export function ConsentProvider({
  policyVersion,
  children,
}: {
  policyVersion: string;
  children: React.ReactNode;
}) {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  const mounted = raw !== null;
  const choice = useMemo(() => (raw ? parseChoice(raw) : null), [raw]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState({ analytics: false, marketing: false });
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!mounted) return;
    const allowed = allows(choice, "analytics", policyVersion);
    setAnalyticsConsent(allowed, allowed ? (choice?.aid ?? null) : null);
  }, [choice, mounted, policyVersion]);

  const save = useCallback(
    (input: { analytics: boolean; marketing: boolean }) =>
      start(async () => {
        await saveCookieChoiceAction(input);
        cookieChanged();
        setSettingsOpen(false);
      }),
    [],
  );

  const openSettings = useCallback(() => {
    const current = choice && !needsChoice(choice, policyVersion) ? choice : null;
    setDraft({ analytics: current?.analytics ?? false, marketing: current?.marketing ?? false });
    setSettingsOpen(true);
  }, [choice, policyVersion]);

  const value = useMemo(() => ({ choice, openSettings }), [choice, openSettings]);
  const showBanner = mounted && needsChoice(choice, policyVersion) && !settingsOpen;

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {showBanner ? (
        <section
          aria-labelledby="cookie-banner-title"
          className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-3xl animate-slide-in-bottom rounded-2xl border border-line bg-surface p-5 shadow-lifted motion-reduce:animate-none md:bottom-6 md:p-6"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
            <div className="flex flex-1 flex-col gap-2">
              <h2 id="cookie-banner-title" className="flex items-center gap-2 font-display text-xl">
                <Cookie aria-hidden className="size-5 text-clay" /> Cookie-uri, cu măsură
              </h2>
              <p className="text-sm text-ink-muted">
                Folosim cookie-uri necesare pentru coș și cont. Cu acordul tău, folosim și
                cookie-uri de analiză ca să înțelegem ce funcționează. Poți schimba oricând alegerea
                din subsolul paginii.{" "}
                <Link
                  href="/politica-cookies"
                  className="font-semibold text-forest underline underline-offset-2"
                >
                  Politica de cookies
                </Link>
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
              <Button variant="ghost" size="sm" onClick={openSettings} disabled={pending}>
                Setări
              </Button>
              {/* Refusing is exactly as easy and as visible as accepting. */}
              <Button
                size="sm"
                onClick={() => save({ analytics: false, marketing: false })}
                loading={pending}
              >
                Doar necesare
              </Button>
              <Button
                size="sm"
                onClick={() => save({ analytics: true, marketing: true })}
                loading={pending}
              >
                Accept toate
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Setări cookie-uri</DialogTitle>
            <DialogDescription>
              Alege ce cookie-uri opționale accepți. Poți reveni oricând din linkul „Setări cookie”
              din subsolul paginii.
            </DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col divide-y divide-line">
            {categories.map((c) => {
              const id = `cookie-${c.key}`;
              const checked = c.key === "necessary" ? true : draft[c.key];
              return (
                <li key={c.key} className="flex items-start justify-between gap-4 py-4">
                  <div className="flex flex-col gap-1">
                    <label htmlFor={id} className="font-semibold">
                      {c.title}
                      {c.key === "necessary" ? (
                        <span className="ml-2 text-xs font-medium text-ink-muted">
                          mereu active
                        </span>
                      ) : null}
                    </label>
                    <p id={`${id}-desc`} className="text-sm text-ink-muted">
                      {c.text}
                    </p>
                  </div>
                  <Switch
                    id={id}
                    checked={checked}
                    disabled={c.key === "necessary"}
                    aria-describedby={`${id}-desc`}
                    onCheckedChange={(v) =>
                      c.key !== "necessary" && setDraft((d) => ({ ...d, [c.key]: v }))
                    }
                  />
                </li>
              );
            })}
          </ul>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => save({ analytics: false, marketing: false })}
              loading={pending}
            >
              Doar necesare
            </Button>
            <Button onClick={() => save(draft)} loading={pending}>
              Salvează preferințele
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConsentContext.Provider>
  );
}

/** Footer link that reopens the settings. */
export function CookieSettingsButton({ className }: { className?: string }) {
  const { openSettings } = useCookieConsent();
  return (
    <button type="button" onClick={openSettings} className={className}>
      Setări cookie
    </button>
  );
}
