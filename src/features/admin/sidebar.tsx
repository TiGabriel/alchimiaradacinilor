"use client";

import {
  BadgeCheck,
  Compass,
  Flower2,
  Folder,
  Layers,
  LayoutDashboard,
  Menu,
  Package,
  Receipt,
  Tag,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { activeNavHref, type AdminNavGroup } from "./nav";

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  layout: LayoutDashboard,
  receipt: Receipt,
  users: Users,
  package: Package,
  folder: Folder,
  badge: BadgeCheck,
  layers: Layers,
  tag: Tag,
  compass: Compass,
  flower: Flower2,
};

function NavList({ groups, onNavigate }: { groups: AdminNavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = activeNavHref(pathname, groups);
  return (
    <nav aria-label="Administrare" className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.title} className="flex flex-col gap-1">
          <p className="px-3 text-xs font-bold tracking-[0.12em] text-ink-muted uppercase">
            {group.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const Icon = icons[item.icon] ?? LayoutDashboard;
              const current = item.href === active;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                      current ? "bg-forest-soft text-forest-deep" : "text-ink hover:bg-paper-deep",
                    )}
                  >
                    <Icon aria-hidden className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar({ groups }: { groups: AdminNavGroup[] }) {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-line bg-surface px-3 py-6 lg:block">
      <div className="sticky top-6">
        <NavList groups={groups} />
      </div>
    </aside>
  );
}

export function AdminMobileNav({ groups }: { groups: AdminNavGroup[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="admin-mobile-nav"
        className="inline-flex size-10 items-center justify-center rounded-md border border-line"
      >
        {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        <span className="sr-only">Meniu administrare</span>
      </button>
      {open ? (
        <div
          id="admin-mobile-nav"
          className="absolute inset-x-0 top-16 z-40 border-b border-line bg-surface p-4 shadow-lifted"
        >
          <NavList groups={groups} onNavigate={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
