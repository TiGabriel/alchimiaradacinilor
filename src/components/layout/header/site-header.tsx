import { Logo } from "@/components/brand/logo";
import { getCategoryTree } from "@/services/catalog/categories";
import { getSettings } from "@/services/settings";

import { DesktopNav } from "./desktop-nav";
import { CartButton, HeaderActions } from "./header-actions";
import { HeaderShell } from "./header-shell";
import { MobileMenu } from "./mobile-menu";

export async function SiteHeader() {
  const [settings, categories] = await Promise.all([
    getSettings(),
    getCategoryTree().catch((error: unknown) => {
      console.error("[header] Could not load categories:", error);
      return [];
    }),
  ]);

  return (
    <HeaderShell>
      <a
        href="#continut"
        className="sr-only z-50 rounded-full bg-forest px-4 py-2 font-semibold text-ink-inverse focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Sari la conținut
      </a>
      <div className="container-page flex h-16 items-center gap-3 lg:h-20">
        {/* Mobile: menu · logo (centred) · cart */}
        <div className="flex flex-1 items-center lg:hidden">
          <MobileMenu categories={categories} contact={settings.contact} social={settings.social} />
        </div>
        <Logo brand={settings.brand} size="sm" className="lg:hidden" />
        <div className="flex flex-1 items-center justify-end lg:hidden">
          <CartButton />
        </div>

        {/* Desktop */}
        <Logo brand={settings.brand} className="hidden lg:inline-flex" />
        <div className="hidden flex-1 justify-center lg:flex">
          <DesktopNav categories={categories} />
        </div>
        <div className="hidden lg:block">
          <HeaderActions />
        </div>
      </div>
    </HeaderShell>
  );
}
