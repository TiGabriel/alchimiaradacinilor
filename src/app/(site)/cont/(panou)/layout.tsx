import { MailWarning } from "lucide-react";

import { AccountNav } from "@/features/account/account-nav";
import { ResendVerificationForm } from "@/features/auth/components/resend-verification";
import { requireUser } from "@/features/auth/session";

/** Every /cont page below requires a signed-in user (checked on the server). */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser("/cont");

  return (
    <div className="container-page grid gap-8 py-8 md:py-12 lg:grid-cols-[15rem_1fr] lg:gap-14">
      <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
        <div className="hidden flex-col gap-0.5 lg:flex">
          <p className="text-eyebrow text-clay">Contul meu</p>
          <p className="truncate font-display text-xl">
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate text-sm text-ink-muted">{user.email}</p>
        </div>
        <AccountNav />
      </aside>
      <div className="flex min-w-0 flex-col gap-6">
        {!user.emailVerified ? (
          <div
            role="status"
            className="flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning-soft p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="flex items-start gap-2 text-sm text-warning">
              <MailWarning aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>
                Confirmă adresa <strong>{user.email}</strong> pentru a putea plasa comenzi. Verifică
                emailul primit la înregistrare.
              </span>
            </p>
            <div className="shrink-0">
              <ResendVerificationForm compact />
            </div>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
