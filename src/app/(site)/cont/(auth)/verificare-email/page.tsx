import { MailCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { ResendVerificationForm } from "@/features/auth/components/resend-verification";
import { VerifyEmailForm } from "@/features/auth/components/reset-forms";
import { getCurrentUser } from "@/features/auth/session";

export const metadata: Metadata = {
  title: "Confirmare email",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage(props: PageProps<"/cont/verificare-email">) {
  const { token } = await props.searchParams;
  if (typeof token === "string" && token) {
    return (
      <AuthShell
        eyebrow="Confirmare"
        title="Confirmă adresa de email"
        intro="Apasă butonul de mai jos pentru a-ți activa contul."
      >
        <VerifyEmailForm token={token} />
      </AuthShell>
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return (
      <AuthShell
        eyebrow="Confirmare"
        title="Confirmă adresa de email"
        intro="Deschide linkul din emailul primit sau autentifică-te pentru a cere unul nou."
      >
        <Button asChild size="lg">
          <Link href="/cont/autentificare?next=/cont/verificare-email">Autentifică-te</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Confirmare"
      title={user.emailVerified ? "Adresa ta este confirmată" : "Verifică-ți emailul"}
      intro={
        user.emailVerified ? undefined : (
          <>
            Ți-am trimis un link de confirmare la <strong className="text-ink">{user.email}</strong>
            . Confirmarea este necesară înainte de a plasa o comandă.
          </>
        )
      }
    >
      {user.emailVerified ? (
        <Button asChild size="lg">
          <Link href="/cont">Mergi la contul tău</Link>
        </Button>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <MailCheck aria-hidden className="size-4 text-forest" /> Nu găsești emailul? Verifică și
            folderul Spam.
          </p>
          <ResendVerificationForm />
        </div>
      )}
    </AuthShell>
  );
}
