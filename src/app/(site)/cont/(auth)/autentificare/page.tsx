import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentUser } from "@/features/auth/session";
import { safeNextPath } from "@/validation/auth";

export const metadata: Metadata = {
  title: "Autentificare",
  robots: { index: false, follow: true },
};

export default async function LoginPage(props: PageProps<"/cont/autentificare">) {
  const { next } = await props.searchParams;
  const nextPath = safeNextPath(next, "/cont");
  if (await getCurrentUser()) redirect(nextPath);
  return (
    <AuthShell
      eyebrow="Contul meu"
      title="Bine ai revenit"
      intro="Autentifică-te pentru a-ți vedea comenzile, favoritele și rutinele salvate."
    >
      <LoginForm next={nextPath} />
    </AuthShell>
  );
}
