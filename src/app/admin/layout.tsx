import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { logoutAction } from "@/features/auth/actions";
import { requirePermission } from "@/features/auth/session";
import { getSetting } from "@/services/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Administrare",
  robots: { index: false, follow: false },
};

/** Admin area: server-side permission check on every request (non-staff get a 404). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [{ user }, brand] = await Promise.all([
    requirePermission("admin:access"),
    getSetting("brand"),
  ]);
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-surface">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo brand={brand} size="sm" href="/admin" />
            <span className="rounded-full bg-forest-soft px-2.5 py-0.5 text-xs font-bold text-forest-deep">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-ink-muted hover:text-ink">
              Vezi magazinul
            </Link>
            <span className="text-ink-muted">{user.email}</span>
            <form action={logoutAction}>
              <button type="submit" className="font-semibold text-danger hover:underline">
                Ieșire
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="container-page flex-1 py-10">{children}</main>
    </div>
  );
}
