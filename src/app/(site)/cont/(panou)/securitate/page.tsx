import { Monitor } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { ChangePasswordForm, SignOutOthersForm } from "@/features/account/profile-forms";
import { AccountCard, AccountHeader } from "@/features/account/section";
import { logoutAction } from "@/features/auth/actions";
import { requireUser } from "@/features/auth/session";
import { listSessions } from "@/services/account/profile";

export const metadata: Metadata = { title: "Securitate", robots: { index: false, follow: false } };

const dateTime = new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium", timeStyle: "short" });

function describeAgent(ua: string | null) {
  if (!ua) return "Dispozitiv necunoscut";
  const browser = /Firefox/.test(ua)
    ? "Firefox"
    : /Edg\//.test(ua)
      ? "Edge"
      : /Chrome/.test(ua)
        ? "Chrome"
        : /Safari/.test(ua)
          ? "Safari"
          : "Browser";
  const os = /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad/.test(ua)
      ? "iOS"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return os ? `${browser} pe ${os}` : browser;
}

export default async function SecurityPage() {
  const session = await requireUser("/cont/securitate");
  const sessions = await listSessions(session.user.id);
  return (
    <div className="flex flex-col gap-6">
      <AccountHeader
        title="Securitate"
        description="Parola și dispozitivele conectate la contul tău."
      />
      <AccountCard title="Schimbă parola">
        <ChangePasswordForm />
      </AccountCard>
      <AccountCard title="Dispozitive conectate">
        <ul className="flex flex-col divide-y divide-line">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-3">
              <Monitor aria-hidden className="size-5 text-ink-muted" />
              <div className="flex flex-1 flex-col">
                <span className="font-semibold">{describeAgent(s.userAgent)}</span>
                <span className="text-sm text-ink-muted">
                  Activ ultima dată: {dateTime.format(s.updatedAt)}
                </span>
              </div>
              {s.id === session.sessionId ? (
                <Badge variant="sage" size="sm">
                  Acest dispozitiv
                </Badge>
              ) : null}
            </li>
          ))}
        </ul>
        {sessions.length > 1 ? <SignOutOthersForm /> : null}
      </AccountCard>
      <form action={logoutAction}>
        <button
          type="submit"
          className="text-sm font-semibold text-danger underline-offset-4 hover:underline"
        >
          Deconectează-te de pe acest dispozitiv
        </button>
      </form>
    </div>
  );
}
