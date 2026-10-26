import type { Metadata } from "next";

import { PaletteEditor } from "@/features/admin/settings/palette-editor";
import { AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { getFeaturedProducts } from "@/services/catalog/products";
import { getSetting } from "@/services/settings";

export const metadata: Metadata = { title: "Culori site" };

export default async function PalettePage() {
  await requirePermission("settings:manage");
  const [theme, [sample]] = await Promise.all([getSetting("theme"), getFeaturedProducts(1)]);
  return (
    <>
      <AdminPageHeader
        title="Culori site"
        description="Paleta se aplică pe tot site-ul, în panoul de administrare și în emailurile trimise din site. Perechile text/fundal trebuie să treacă verificarea de contrast."
        back={{ href: "/admin/setari", label: "Setări" }}
      />
      <PaletteEditor initial={theme} samplePhoto={sample?.images[0]?.url ?? null} />
    </>
  );
}
