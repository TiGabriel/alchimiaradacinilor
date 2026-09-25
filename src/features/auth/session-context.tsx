"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { getSessionUserAction, type ClientUser } from "./session-actions";

/** undefined = still loading, null = signed out. */
type SessionValue = { user: ClientUser | null | undefined };

const SessionContext = createContext<SessionValue>({ user: undefined });

/**
 * Loads the session client-side (pages stay free of per-user HTML).
 * Sign-in/out do a full navigation, so this only needs to load once.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ClientUser | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    getSessionUserAction()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return <SessionContext.Provider value={{ user }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
