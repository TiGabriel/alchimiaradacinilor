import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { RequestResetForm, SetNewPasswordForm } from "@/features/auth/components/reset-forms";

export const metadata: Metadata = {
  title: "Resetare parolă",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage(props: PageProps<"/cont/resetare-parola">) {
  const { token } = await props.searchParams;
  const value = typeof token === "string" ? token : null;
  return value ? (
    <AuthShell
      eyebrow="Securitate"
      title="Alege o parolă nouă"
      intro="După salvare vei fi deconectat de pe toate dispozitivele."
    >
      <SetNewPasswordForm token={value} />
    </AuthShell>
  ) : (
    <AuthShell
      eyebrow="Securitate"
      title="Ai uitat parola?"
      intro="Scrie adresa contului și îți trimitem un link pentru a alege o parolă nouă."
    >
      <RequestResetForm />
    </AuthShell>
  );
}
