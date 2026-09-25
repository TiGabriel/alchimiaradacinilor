import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/features/admin/delete-button";
import { deleteProductAction } from "@/features/admin/products/actions";
import { productToForm } from "@/features/admin/products/defaults";
import { ImageManager } from "@/features/admin/products/image-manager";
import { ProductForm } from "@/features/admin/products/product-form";
import { AdminCard, AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { getAdminProduct, getProductFormOptions } from "@/services/admin/products";

export const metadata: Metadata = { title: "Editează produsul" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requirePermission("catalog:edit");
  const actor = { id: user.id, roles: user.roles };
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [product, options] = await Promise.all([
    getAdminProduct(actor, id),
    getProductFormOptions(actor),
  ]);
  if (!product) notFound();
  const deletable = product._count.orderItems === 0 && product._count.partOfKits === 0;

  return (
    <>
      <AdminPageHeader
        title={product.name}
        description={product.isDemo ? "Produs demonstrativ" : `SKU ${product.sku}`}
        back={{ href: "/admin/produse", label: "Produse" }}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/produs/${product.slug}`} target="_blank">
              Vezi în magazin <ExternalLink aria-hidden />
            </Link>
          </Button>
        }
      />
      <AdminCard title="Imagini">
        <ImageManager
          productId={product.id}
          images={product.images.map((i) => ({
            id: i.id,
            url: i.media.url,
            alt: i.alt,
            width: i.media.width,
            height: i.media.height,
          }))}
        />
      </AdminCard>
      <ProductForm productId={product.id} initial={productToForm(product)} options={options} />
      <AdminCard title="Zonă periculoasă" className="border-danger/30">
        <p className="text-sm text-ink-muted">
          {deletable
            ? "Ștergerea este definitivă. Dacă vrei doar să ascunzi produsul, debifează „Activ”."
            : "Produsul apare în comenzi sau într-un kit, așa că nu poate fi șters. Debifează „Activ” ca să-l ascunzi din magazin."}
        </p>
        {deletable ? (
          <div>
            <DeleteButton
              action={deleteProductAction.bind(null, product.id)}
              confirmText={`Ștergi definitiv „${product.name}”?`}
              redirectTo="/admin/produse"
              label="Șterge produsul"
            />
          </div>
        ) : null}
      </AdminCard>
    </>
  );
}
