import { SiteChrome } from "@/components/layout/site-chrome";

// Site pages read live content (prices from doTERRA, ratings, links) on every request.
// Caching (Cache Components / tags) is revisited in the performance phase — see DECISIONS D-016.
export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
