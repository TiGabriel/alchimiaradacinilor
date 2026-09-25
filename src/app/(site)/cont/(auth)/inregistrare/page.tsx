import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { RegisterForm } from "@/features/auth/components/register-form";
import { getCurrentUser } from "@/features/auth/session";
import { safeNextPath } from "@/validation/auth";

export const metadata: Metadata = {
  title: "Creează un cont",
  robots: { index: false, follow: true },
};

export default async function RegisterPage(props: PageProps<"/cont/inregistrare">) {
  const { next } = await props.searchParams;
  const nextPath = safeNextPath(next, "/cont");
  if (await getCurrentUser()) redirect(nextPath);
  return (
    <AuthShell
      eyebrow="Cont nou"
      title="Creează-ți contul"
      intro="Salvează favoritele, rezultatele quiz-ului și adresele — și comandă mai repede."
    >
      <RegisterForm next={nextPath} />
    </AuthShell>
  );
}
