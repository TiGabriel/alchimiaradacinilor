import type { Metadata } from "next";

import { emptyProductForm } from "@/features/admin/products/defaults";
import { ProductForm } from "@/features/admin/products/product-form";
import { AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { getProductFormOptions } from "@/services/admin/products";

export const metadata: Metadata = { title: "Produs nou" };

export default async function NewProductPage() {
  const { user } = await requirePermission("catalog:edit");
  const options = await getProductFormOptions({ id: user.id, roles: user.roles });
  return (
    <>
      <AdminPageHeader
        title="Produs nou"
        description="După creare vei putea adăuga imaginile."
        back={{ href: "/admin/produse", label: "Produse" }}
      />
      <ProductForm initial={emptyProductForm()} options={options} />
    </>
  );
}
