import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { navFor } from "@/features/admin/nav";
import { AdminMobileNav, AdminSidebar } from "@/features/admin/sidebar";
import { logoutAction } from "@/features/auth/actions";
import { requirePermission } from "@/features/auth/session";
import { getSetting } from "@/services/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { default: "Administrare", template: "%s · Administrare" },
  robots: { index: false, follow: false },
};

/**
 * Admin area: a server-side permission check on every request (non-staff get a 404).
 * Each page and every action checks its own, more specific permission too.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [{ user }, brand] = await Promise.all([
    requirePermission("admin:access"),
    getSetting("brand"),
  ]);
  const groups = navFor(user.roles);
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <a
        href="#admin-continut"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
      >
        Sari la conținut
      </a>
      <header className="relative border-b border-line bg-surface">
        <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <AdminMobileNav groups={groups} />
            <Logo brand={brand} size="sm" href="/admin" />
            <span className="rounded-full bg-forest-soft px-2.5 py-0.5 text-xs font-bold text-forest-deep">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-ink-muted hover:text-ink max-sm:hidden">
              Vezi magazinul
            </Link>
            <span className="text-ink-muted max-md:hidden">{user.email}</span>
            <form action={logoutAction}>
              <button type="submit" className="font-semibold text-danger hover:underline">
                Ieșire
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <AdminSidebar groups={groups} />
        <main
          id="admin-continut"
          tabIndex={-1}
          className="min-w-0 flex-1 px-4 py-8 focus:outline-none md:px-8"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
