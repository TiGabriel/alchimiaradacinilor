"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { CouponFormInput } from "@/validation/admin/coupon";

import { AdminCard, adminSelect } from "../ui";

import { saveCouponAction } from "./actions";

export type CouponFormState = Required<
  Pick<CouponFormInput, "code" | "type" | "value" | "active" | "productIds" | "categoryIds">
> & {
  description: string;
  minSubtotal: string;
  maxDiscount: string;
  startsOn: string;
  endsOn: string;
  usageLimit: string;
  perCustomerLimit: string;
};

export function CouponForm({
  couponId,
  initial,
  products,
  categories,
}: {
  couponId?: string;
  initial: CouponFormState;
  products: Array<{ id: string; name: string; sku: string }>;
  categories: Array<{ id: string; name: string; parentId: string | null }>;
}) {
  const uid = useId();
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("");
  const [pending, start] = useTransition();
  const set = <K extends keyof CouponFormState>(k: K, value: CouponFormState[K]) =>
    setV((s) => ({ ...s, [k]: value }));
  const text =
    (k: keyof CouponFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      set(k, e.target.value as never);
  const fid = (n: string) => `${uid}-${n}`;
  const toggle = (k: "productIds" | "categoryIds", id: string) =>
    set(k, v[k].includes(id) ? v[k].filter((x) => x !== id) : [...v[k], id]);
  const shownProducts = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? products.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(q)) : products;
  }, [filter, products]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const result = await saveCouponAction(v, couponId);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast({ title: result.error, variant: "error" });
        return;
      }
      setErrors({});
      toast({ title: result.message ?? "Salvat", variant: "success" });
      if (!couponId) router.push(`/admin/cupoane/${result.data.id}`);
      else router.refresh();
    });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <AdminCard title="Cod și reducere">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id={fid("code")}
            label="Cod"
            required
            error={errors.code}
            hint="Clienții îl pot scrie cu litere mici sau spații."
          >
            {(p) => <Input {...p} value={v.code} onChange={text("code")} className="uppercase" />}
          </Field>
          <Field id={fid("description")} label="Descriere internă" error={errors.description}>
            {(p) => <Input {...p} value={v.description} onChange={text("description")} />}
          </Field>
          <Field id={fid("type")} label="Tip" required error={errors.type}>
            {(p) => (
              <select
                {...p}
                value={v.type}
                onChange={text("type")}
                className={cn(adminSelect, "h-11 w-full")}
              >
                <option value="PERCENTAGE">Procent din valoare</option>
                <option value="FIXED_AMOUNT">Sumă fixă (lei)</option>
                <option value="FREE_SHIPPING">Livrare gratuită</option>
              </select>
            )}
          </Field>
          {v.type !== "FREE_SHIPPING" ? (
            <Field
              id={fid("value")}
              label={v.type === "PERCENTAGE" ? "Procent (%)" : "Sumă (lei)"}
              required
              error={errors.value}
            >
              {(p) => <Input {...p} inputMode="decimal" value={v.value} onChange={text("value")} />}
            </Field>
          ) : (
            <p className="self-end pb-3 text-sm text-ink-muted">
              Se aplică metodelor de livrare eligibile.
            </p>
          )}
          <Field id={fid("min")} label="Comandă minimă (lei)" error={errors.minSubtotal}>
            {(p) => (
              <Input
                {...p}
                inputMode="decimal"
                value={v.minSubtotal}
                onChange={text("minSubtotal")}
              />
            )}
          </Field>
          {v.type === "PERCENTAGE" ? (
            <Field id={fid("max")} label="Reducere maximă (lei)" error={errors.maxDiscount}>
              {(p) => (
                <Input
                  {...p}
                  inputMode="decimal"
                  value={v.maxDiscount}
                  onChange={text("maxDiscount")}
                />
              )}
            </Field>
          ) : null}
        </div>
      </AdminCard>

      <AdminCard title="Valabilitate și limite">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id={fid("starts")}
            label="Începe pe"
            error={errors.startsOn}
            hint="Inclusiv, ora României."
          >
            {(p) => <Input {...p} type="date" value={v.startsOn} onChange={text("startsOn")} />}
          </Field>
          <Field
            id={fid("ends")}
            label="Se termină pe"
            error={errors.endsOn}
            hint="Inclusiv, până la 23:59."
          >
            {(p) => <Input {...p} type="date" value={v.endsOn} onChange={text("endsOn")} />}
          </Field>
          <Field
            id={fid("limit")}
            label="Limită totală de utilizări"
            error={errors.usageLimit}
            hint="Gol = nelimitat."
          >
            {(p) => (
              <Input
                {...p}
                inputMode="numeric"
                value={v.usageLimit}
                onChange={text("usageLimit")}
              />
            )}
          </Field>
          <Field
            id={fid("per")}
            label="Limită per client"
            error={errors.perCustomerLimit}
            hint="Gol = nelimitat."
          >
            {(p) => (
              <Input
                {...p}
                inputMode="numeric"
                value={v.perCustomerLimit}
                onChange={text("perCustomerLimit")}
              />
            )}
          </Field>
        </div>
        <Checkbox
          id={fid("active")}
          checked={v.active}
          onCheckedChange={(c) => set("active", c === true)}
          label="Activ"
        />
      </AdminCard>

      <AdminCard title="Restricții (opțional)">
        <p className="-mt-2 text-sm text-ink-muted">
          Fără restricții, codul se aplică întregului coș. Cu restricții, reducerea se calculează
          doar pentru produsele eligibile (o categorie include subcategoriile ei).
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold">Categorii</legend>
            {categories.map((c) => (
              <Checkbox
                key={c.id}
                id={fid(`cat-${c.id}`)}
                checked={v.categoryIds.includes(c.id)}
                onCheckedChange={() => toggle("categoryIds", c.id)}
                label={c.parentId ? `— ${c.name}` : c.name}
              />
            ))}
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold">
              Produse ({v.productIds.length} alese)
            </legend>
            <Input
              aria-label="Filtrează produsele"
              placeholder="Filtrează după nume sau SKU"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-10"
            />
            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-2">
              {shownProducts.map((p) => (
                <Checkbox
                  key={p.id}
                  id={fid(`prod-${p.id}`)}
                  checked={v.productIds.includes(p.id)}
                  onCheckedChange={() => toggle("productIds", p.id)}
                  label={`${p.name} (${p.sku})`}
                />
              ))}
            </div>
          </fieldset>
        </div>
      </AdminCard>

      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-3 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <Button type="submit" loading={pending}>
          {couponId ? "Salvează cuponul" : "Creează cuponul"}
        </Button>
      </div>
    </form>
  );
}
