import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  AdminPageHeader,
  AdminPagination,
  AdminSearchForm,
  AdminTable,
  adminSelect,
  StatusDot,
  td,
  th,
} from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { ProductType } from "@/generated/prisma/enums";
import { formatMoney } from "@/lib/money";
import { listAdminProducts, type ProductListFilter } from "@/services/admin/products";
import { productTypeLabels } from "@/validation/product";

export const metadata: Metadata = { title: "Produse" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
const statuses = ["active", "inactive"] as const;
const linkFilters = ["fara", "nefunctional"] as const;

function LinkStatus({
  url,
  status,
}: {
  url: string | null;
  status: "UNCHECKED" | "OK" | "BROKEN";
}) {
  if (!url) return <StatusDot tone="warn">Fără link</StatusDot>;
  if (status === "BROKEN") return <StatusDot tone="danger">Nefuncțional</StatusDot>;
  if (status === "OK") return <StatusDot tone="ok">Verificat</StatusDot>;
  return <StatusDot tone="off">Netestat</StatusDot>;
}

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { user } = await requirePermission("catalog:edit");
  const sp = await searchParams;
  const status = statuses.find((s) => s === one(sp.status));
  const type = Object.values(ProductType).find((t) => t === one(sp.type));
  const link = linkFilters.find((l) => l === one(sp.link));
  const filter: ProductListFilter = {
    q: one(sp.q)?.trim().slice(0, 80) || undefined,
    status,
    type,
    link,
    page: Number(one(sp.page)) || 1,
  };
  const { products, total, page, pageCount } = await listAdminProducts(
    { id: user.id, roles: user.roles },
    filter,
  );
  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (filter.q) params.set("q", filter.q);
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    if (link) params.set("link", link);
    params.set("page", String(p));
    return `/admin/produse?${params}`;
  };

  return (
    <>
      <AdminPageHeader
        title="Produse"
        description={`${total} ${total === 1 ? "produs" : "produse"}`}
        actions={
          <Button asChild>
            <Link href="/admin/produse/nou">
              <Plus aria-hidden /> Produs nou
            </Link>
          </Button>
        }
      />
      <AdminSearchForm action="/admin/produse" query={filter.q} placeholder="Nume, SKU sau slug">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Stare
          <select name="status" defaultValue={status ?? ""} className={adminSelect}>
            <option value="">Toate</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Tip
          <select name="type" defaultValue={type ?? ""} className={adminSelect}>
            <option value="">Toate</option>
            {Object.entries(productTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Link doTERRA
          <select name="link" defaultValue={link ?? ""} className={adminSelect}>
            <option value="">Toate</option>
            <option value="fara">Fără link</option>
            <option value="nefunctional">Nefuncțional</option>
          </select>
        </label>
      </AdminSearchForm>
      <AdminTable caption="Lista produselor">
        <thead className="border-b border-line bg-paper-deep/50">
          <tr>
            <th className={th}>Produs</th>
            <th className={th}>SKU</th>
            <th className={th}>Categorie</th>
            <th className={`${th} text-right`}>Preț doTERRA</th>
            <th className={th}>Link doTERRA</th>
            <th className={th}>Stare</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-paper-deep/40">
              <td className={td}>
                <Link
                  href={`/admin/produse/${p.id}`}
                  className="flex items-center gap-3 font-semibold hover:text-forest"
                >
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-paper-deep">
                    {p.images[0] ? (
                      <Image
                        src={p.images[0].media.url}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="flex flex-col">
                    {p.name}
                    <span className="text-xs font-normal text-ink-muted">
                      {productTypeLabels[p.productType]}
                      {p.isDemo ? " · demo" : ""}
                      {p.featured ? " · recomandat" : ""}
                    </span>
                  </span>
                </Link>
              </td>
              <td className={`${td} font-mono text-xs`}>{p.sku}</td>
              <td className={td}>{p.category.name}</td>
              <td className={`${td} text-right tabular-nums`}>{formatMoney(p.price)}</td>
              <td className={td}>
                <LinkStatus url={p.referralUrl} status={p.linkStatus} />
              </td>
              <td className={td}>
                <StatusDot tone={p.active ? "ok" : "off"}>
                  {p.active ? "Activ" : "Inactiv"}
                </StatusDot>
              </td>
            </tr>
          ))}
          {products.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-ink-muted">
                Niciun produs pentru filtrele alese.
              </td>
            </tr>
          ) : null}
        </tbody>
      </AdminTable>
      <AdminPagination page={page} pageCount={pageCount} href={pageHref} />
    </>
  );
}
