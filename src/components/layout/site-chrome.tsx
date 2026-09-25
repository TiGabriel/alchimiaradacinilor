import { SiteFooter } from "./footer/site-footer";
import { SiteHeader } from "./header/site-header";
import { MobileBottomNav } from "./mobile-bottom-nav";

/** Header + main + footer + mobile bottom nav. Shared by the (site) layout and the root 404. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="continut" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
