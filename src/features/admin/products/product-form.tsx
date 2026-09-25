"use client";

import { Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import type { ProductType } from "@/generated/prisma/enums";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { productTypeLabels } from "@/validation/product";
import type { ProductFormInput } from "@/validation/admin/product";

import { AdminCard, adminSelect } from "../ui";

import { saveProductAction } from "./actions";

type Option = { id: string; name: string };
export type ProductFormOptions = {
  categories: Array<Option & { parentId: string | null }>;
  brands: Option[];
  needs: Option[];
  aromas: Option[];
  tags: Option[];
  collections: Option[];
};

export type ProductFormState = Omit<ProductFormInput, "stock" | "attributes"> & {
  stock: string;
  attributes: Record<string, string>;
};

const ATTRIBUTE_FIELDS: Record<
  ProductType,
  Array<{ key: string; label: string; numeric?: boolean }>
> = {
  INDIVIDUAL_OIL: [
    { key: "volumeMl", label: "Volum (ml)", numeric: true },
    { key: "botanicalName", label: "Denumire botanică" },
    { key: "plantPart", label: "Partea plantei" },
    { key: "extractionMethod", label: "Metoda de extracție" },
  ],
  BLEND: [{ key: "volumeMl", label: "Volum (ml)", numeric: true }],
  KIT: [],
  DIFFUSER: [
    { key: "tankCapacityMl", label: "Capacitate rezervor (ml)", numeric: true },
    { key: "runtimeHours", label: "Autonomie (ore)", numeric: true },
    { key: "material", label: "Material" },
  ],
  ACCESSORY: [{ key: "material", label: "Material" }],
  OTHER: [],
};

/** Categories in tree order, indented by depth. */
function categoryOptions(categories: ProductFormOptions["categories"]) {
  const children = new Map<string | null, ProductFormOptions["categories"]>();
  for (const c of categories) children.set(c.parentId, [...(children.get(c.parentId) ?? []), c]);
  const out: Array<{ id: string; label: string }> = [];
  const walk = (parent: string | null, depth: number) => {
    for (const c of children.get(parent) ?? []) {
      out.push({ id: c.id, label: `${"— ".repeat(depth)}${c.name}` });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

function Counter({ value, max }: { value: string | null | undefined; max: number }) {
  const n = value?.length ?? 0;
  return (
    <span className={cn(n > max && "text-danger")}>
      {n}/{max}
    </span>
  );
}

export function ProductForm({
  productId,
  initial,
  options,
}: {
  productId?: string;
  initial: ProductFormState;
  options: ProductFormOptions;
}) {
  const uid = useId();
  const router = useRouter();
  const [values, setValues] = useState<ProductFormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(productId));
  const [pending, start] = useTransition();

  const set = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const text =
    (key: keyof ProductFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      set(key, e.target.value as never);
  const fid = (name: string) => `${uid}-${name}`;
  const typeFields = ATTRIBUTE_FIELDS[values.productType as ProductType] ?? [];

  const toggleIn = (list: string[] | undefined, id: string) =>
    (list ?? []).includes(id) ? (list ?? []).filter((x) => x !== id) : [...(list ?? []), id];

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    start(async () => {
      const result = await saveProductAction(values, productId);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
        requestAnimationFrame(() =>
          document
            .querySelector<HTMLElement>(`#${CSS.escape(uid)}-form [aria-invalid="true"]`)
            ?.focus(),
        );
        return;
      }
      setErrors({});
      toast({ title: result.message ?? "Salvat", variant: "success" });
      if (!productId) router.push(`/admin/produse/${result.data.id}`);
      else router.refresh();
    });
  };

  return (
    <form id={`${uid}-form`} onSubmit={submit} noValidate className="flex flex-col gap-6">
      {formError ? (
        <p
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm font-semibold"
        >
          {formError}
        </p>
      ) : null}

      <AdminCard title="Informații de bază">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id={fid("name")} label="Nume" required error={errors.name}>
            {(p) => (
              <Input
                {...p}
                value={values.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setValues((v) => ({ ...v, name, slug: slugTouched ? v.slug : slugify(name) }));
                }}
              />
            )}
          </Field>
          <Field
            id={fid("slug")}
            label="Slug (adresa paginii)"
            required
            error={errors.slug}
            hint={`/produs/${values.slug || "…"}`}
          >
            {(p) => (
              <div className="flex gap-2">
                <Input
                  {...p}
                  value={values.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-11"
                  onClick={() => set("slug", slugify(values.name))}
                  aria-label="Generează slug-ul din nume"
                  title="Generează din nume"
                >
                  <Wand2 aria-hidden />
                </Button>
              </div>
            )}
          </Field>
          <Field id={fid("sku")} label="SKU" required error={errors.sku}>
            {(p) => (
              <Input {...p} value={values.sku} onChange={text("sku")} className="uppercase" />
            )}
          </Field>
          <Field id={fid("type")} label="Tip produs" required error={errors.productType}>
            {(p) => (
              <select
                {...p}
                value={values.productType}
                onChange={text("productType")}
                className={cn(adminSelect, "h-11 w-full")}
              >
                {Object.entries(productTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field id={fid("category")} label="Categorie" required error={errors.categoryId}>
            {(p) => (
              <select
                {...p}
                value={values.categoryId}
                onChange={text("categoryId")}
                className={cn(adminSelect, "h-11 w-full")}
              >
                <option value="">Alege categoria</option>
                {categoryOptions(options.categories).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field id={fid("brand")} label="Marcă" error={errors.brandId}>
            {(p) => (
              <select
                {...p}
                value={values.brandId ?? ""}
                onChange={text("brandId")}
                className={cn(adminSelect, "h-11 w-full")}
              >
                <option value="">Fără marcă</option>
                {options.brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
      </AdminCard>

      <AdminCard title="Descriere">
        <p className="-mt-2 text-sm text-ink-muted">
          Descrie aroma, atmosfera și momentele potrivite. Fără afirmații medicale sau terapeutice
          (nu „tratează”, „vindecă”, „previne”, „ameliorează”).
        </p>
        <Field
          id={fid("short")}
          label="Descriere scurtă"
          required
          error={errors.shortDescription}
          hint={<Counter value={values.shortDescription} max={300} />}
        >
          {(p) => (
            <Textarea
              {...p}
              value={values.shortDescription}
              onChange={text("shortDescription")}
              className="min-h-20"
            />
          )}
        </Field>
        <Field id={fid("desc")} label="Descriere (Markdown)" required error={errors.description}>
          {(p) => (
            <Textarea
              {...p}
              value={values.description}
              onChange={text("description")}
              className="min-h-48 font-mono text-sm"
            />
          )}
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field id={fid("usage")} label="Mod de folosire (Markdown)" error={errors.usageInfo}>
            {(p) => (
              <Textarea
                {...p}
                value={values.usageInfo ?? ""}
                onChange={text("usageInfo")}
                className="min-h-32 font-mono text-sm"
              />
            )}
          </Field>
          <Field id={fid("safety")} label="Siguranță (Markdown)" error={errors.safetyInfo}>
            {(p) => (
              <Textarea
                {...p}
                value={values.safetyInfo ?? ""}
                onChange={text("safetyInfo")}
                className="min-h-32 font-mono text-sm"
              />
            )}
          </Field>
        </div>
      </AdminCard>

      <AdminCard title="Preț și stoc">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            id={fid("price")}
            label="Preț (lei)"
            required
            error={errors.price}
            hint="Ex.: 59,90"
          >
            {(p) => (
              <Input {...p} inputMode="decimal" value={values.price} onChange={text("price")} />
            )}
          </Field>
          <Field
            id={fid("compare")}
            label="Preț vechi (lei)"
            error={errors.compareAtPrice}
            hint="Doar pentru o reducere reală."
          >
            {(p) => (
              <Input
                {...p}
                inputMode="decimal"
                value={values.compareAtPrice ?? ""}
                onChange={text("compareAtPrice")}
              />
            )}
          </Field>
          <Field id={fid("stock")} label="Stoc (bucăți)" required error={errors.stock}>
            {(p) => (
              <Input {...p} inputMode="numeric" value={values.stock} onChange={text("stock")} />
            )}
          </Field>
        </div>
      </AdminCard>

      {typeFields.length ? (
        <AdminCard title="Specificații">
          <p className="-mt-2 text-sm text-ink-muted">
            Completează doar ce este confirmat de producător. Nu inventa specificații.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {typeFields.map((f) => (
              <Field
                key={f.key}
                id={fid(`attr-${f.key}`)}
                label={f.label}
                error={errors[`attributes.${f.key}`]}
              >
                {(p) => (
                  <Input
                    {...p}
                    inputMode={f.numeric ? "decimal" : undefined}
                    value={values.attributes[f.key] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        attributes: { ...v.attributes, [f.key]: e.target.value },
                      }))
                    }
                  />
                )}
              </Field>
            ))}
          </div>
          {errors.attributes ? <p className="text-sm text-danger">{errors.attributes}</p> : null}
        </AdminCard>
      ) : null}

      <AdminCard title="Clasificare">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold">
            Nevoi (și cât de potrivit este produsul)
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {options.needs.map((need) => {
              const current = values.needs?.find((n) => n.id === need.id);
              return (
                <div
                  key={need.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2"
                >
                  <Checkbox
                    id={fid(`need-${need.id}`)}
                    checked={Boolean(current)}
                    onCheckedChange={(v) =>
                      set(
                        "needs",
                        v === true
                          ? [...(values.needs ?? []), { id: need.id, relevance: 2 }]
                          : (values.needs ?? []).filter((n) => n.id !== need.id),
                      )
                    }
                    label={need.name}
                  />
                  {current ? (
                    <select
                      aria-label={`Relevanță pentru ${need.name}`}
                      value={current.relevance}
                      onChange={(e) =>
                        set(
                          "needs",
                          (values.needs ?? []).map((n) =>
                            n.id === need.id ? { ...n, relevance: Number(e.target.value) } : n,
                          ),
                        )
                      }
                      className={cn(adminSelect, "h-8 text-xs")}
                    >
                      <option value={1}>puțin</option>
                      <option value={2}>potrivit</option>
                      <option value={3}>foarte potrivit</option>
                    </select>
                  ) : null}
                </div>
              );
            })}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-3 border-t border-line pt-4">
          <legend className="mb-2 text-sm font-semibold">
            Profiluri aromatice (intensitate 1–5)
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {options.aromas.map((aroma) => {
              const current = values.aromas?.find((a) => a.id === aroma.id);
              return (
                <div
                  key={aroma.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2"
                >
                  <Checkbox
                    id={fid(`aroma-${aroma.id}`)}
                    checked={Boolean(current)}
                    onCheckedChange={(v) =>
                      set(
                        "aromas",
                        v === true
                          ? [...(values.aromas ?? []), { id: aroma.id, intensity: 3 }]
                          : (values.aromas ?? []).filter((a) => a.id !== aroma.id),
                      )
                    }
                    label={aroma.name}
                  />
                  {current ? (
                    <select
                      aria-label={`Intensitate ${aroma.name}`}
                      value={current.intensity}
                      onChange={(e) =>
                        set(
                          "aromas",
                          (values.aromas ?? []).map((a) =>
                            a.id === aroma.id ? { ...a, intensity: Number(e.target.value) } : a,
                          ),
                        )
                      }
                      className={cn(adminSelect, "h-8 text-xs")}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              );
            })}
          </div>
        </fieldset>
        <div className="grid gap-6 border-t border-line pt-4 md:grid-cols-2">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold">Etichete</legend>
            {options.tags.map((tag) => (
              <Checkbox
                key={tag.id}
                id={fid(`tag-${tag.id}`)}
                checked={(values.tagIds ?? []).includes(tag.id)}
                onCheckedChange={() => set("tagIds", toggleIn(values.tagIds, tag.id))}
                label={tag.name}
              />
            ))}
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold">Colecții</legend>
            {options.collections.length ? (
              options.collections.map((c) => (
                <Checkbox
                  key={c.id}
                  id={fid(`col-${c.id}`)}
                  checked={(values.collectionIds ?? []).includes(c.id)}
                  onCheckedChange={() => set("collectionIds", toggleIn(values.collectionIds, c.id))}
                  label={c.name}
                />
              ))
            ) : (
              <p className="text-sm text-ink-muted">Nu există colecții încă.</p>
            )}
          </fieldset>
        </div>
      </AdminCard>

      <AdminCard title="Vizibilitate">
        <div className="flex flex-col gap-3">
          <Checkbox
            id={fid("active")}
            checked={values.active ?? true}
            onCheckedChange={(v) => set("active", v === true)}
            label="Activ — vizibil în magazin"
          />
          <Checkbox
            id={fid("featured")}
            checked={values.featured ?? false}
            onCheckedChange={(v) => set("featured", v === true)}
            label="Recomandat — apare pe prima pagină"
          />
        </div>
      </AdminCard>

      <AdminCard title="SEO">
        <Field
          id={fid("seo-title")}
          label="Titlu SEO"
          error={errors["seo.seoTitle"]}
          hint={
            <>
              <Counter value={values.seo?.seoTitle} max={70} /> — gol: se folosește numele
              produsului.
            </>
          }
        >
          {(p) => (
            <Input
              {...p}
              value={values.seo?.seoTitle ?? ""}
              onChange={(e) =>
                set("seo", {
                  ...values.seo,
                  noIndex: values.seo?.noIndex ?? false,
                  seoTitle: e.target.value,
                })
              }
            />
          )}
        </Field>
        <Field
          id={fid("seo-desc")}
          label="Meta descriere"
          error={errors["seo.metaDescription"]}
          hint={
            <>
              <Counter value={values.seo?.metaDescription} max={160} /> — gol: se folosește
              descrierea scurtă.
            </>
          }
        >
          {(p) => (
            <Textarea
              {...p}
              value={values.seo?.metaDescription ?? ""}
              onChange={(e) =>
                set("seo", {
                  ...values.seo,
                  noIndex: values.seo?.noIndex ?? false,
                  metaDescription: e.target.value,
                })
              }
              className="min-h-20"
            />
          )}
        </Field>
        <Checkbox
          id={fid("noindex")}
          checked={values.seo?.noIndex ?? false}
          onCheckedChange={(v) => set("seo", { ...values.seo, noIndex: v === true })}
          label="Nu indexa această pagină în motoarele de căutare"
        />
      </AdminCard>

      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-3 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <Button type="submit" loading={pending}>
          {productId ? "Salvează modificările" : "Creează produsul"}
        </Button>
      </div>
    </form>
  );
}
