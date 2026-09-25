"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";

import { AdminCard, adminSelect } from "../ui";

import { saveRoutineAction } from "./actions";
import { CoverPicker } from "./cover-picker";

export type StepDraft = {
  title: string;
  instructions: string;
  durationMinutes: string;
  productId: string;
};
export type RoutineDraft = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  timeOfDay: "MORNING" | "DAY" | "EVENING" | "ANYTIME";
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  durationMinutes: string;
  frequency: string;
  featured: boolean;
  active: boolean;
  cover: { id: string; url: string } | null;
  needIds: string[];
  tagIds: string[];
  products: Array<{ id: string; isOptional: boolean; note: string }>;
  steps: StepDraft[];
  seo: { seoTitle: string; metaDescription: string; noIndex: boolean };
};

type Options = {
  products: Array<{ id: string; name: string }>;
  needs: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
};

const emptyStep: StepDraft = { title: "", instructions: "", durationMinutes: "", productId: "" };

export function RoutineForm({
  routineId,
  initial,
  options,
}: {
  routineId?: string;
  initial: RoutineDraft;
  options: Options;
}) {
  const uid = useId();
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const fid = (n: string) => `${uid}-${n}`;
  const setStep = (i: number, patch: Partial<StepDraft>) =>
    setV({ ...v, steps: v.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const moveStep = (i: number, d: number) => {
    const steps = [...v.steps];
    const j = i + d;
    if (j < 0 || j >= steps.length) return;
    [steps[i], steps[j]] = [steps[j]!, steps[i]!];
    setV({ ...v, steps });
  };
  const toggle = (k: "needIds" | "tagIds", id: string) =>
    setV({ ...v, [k]: v[k].includes(id) ? v[k].filter((x) => x !== id) : [...v[k], id] });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const { cover, ...rest } = v;
    start(async () => {
      const result = await saveRoutineAction({ ...rest, imageId: cover?.id ?? "" }, routineId);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast({ title: result.error, variant: "error" });
        return;
      }
      setErrors({});
      toast({ title: result.message ?? "Salvat", variant: "success" });
      if (!routineId) router.push(`/admin/rutine/${result.data.id}`);
      else router.refresh();
    });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <AdminCard title="Despre rutină">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id={fid("title")} label="Titlu" required error={errors.title}>
            {(p) => (
              <Input
                {...p}
                value={v.title}
                onChange={(e) =>
                  setV({
                    ...v,
                    title: e.target.value,
                    slug: routineId ? v.slug : slugify(e.target.value),
                  })
                }
              />
            )}
          </Field>
          <Field
            id={fid("slug")}
            label="Slug"
            required
            error={errors.slug}
            hint={`/rutine/${v.slug || "…"}`}
          >
            {(p) => (
              <Input {...p} value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} />
            )}
          </Field>
        </div>
        <Field
          id={fid("summary")}
          label="Rezumat"
          required
          error={errors.summary}
          hint="Apare pe card. Fără afirmații medicale."
        >
          {(p) => (
            <Textarea
              {...p}
              value={v.summary}
              onChange={(e) => setV({ ...v, summary: e.target.value })}
              className="min-h-20"
            />
          )}
        </Field>
        <Field id={fid("desc")} label="Introducere (Markdown)" error={errors.description}>
          {(p) => (
            <Textarea
              {...p}
              value={v.description}
              onChange={(e) => setV({ ...v, description: e.target.value })}
              className="min-h-32 font-mono text-sm"
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field id={fid("tod")} label="Momentul zilei">
            {(p) => (
              <select
                {...p}
                value={v.timeOfDay}
                onChange={(e) =>
                  setV({ ...v, timeOfDay: e.target.value as RoutineDraft["timeOfDay"] })
                }
                className={cn(adminSelect, "h-11 w-full")}
              >
                <option value="MORNING">Dimineața</option>
                <option value="DAY">În timpul zilei</option>
                <option value="EVENING">Seara</option>
                <option value="ANYTIME">Oricând</option>
              </select>
            )}
          </Field>
          <Field id={fid("diff")} label="Dificultate">
            {(p) => (
              <select
                {...p}
                value={v.difficulty}
                onChange={(e) =>
                  setV({ ...v, difficulty: e.target.value as RoutineDraft["difficulty"] })
                }
                className={cn(adminSelect, "h-11 w-full")}
              >
                <option value="BEGINNER">Pentru începători</option>
                <option value="INTERMEDIATE">Intermediar</option>
                <option value="ADVANCED">Avansat</option>
              </select>
            )}
          </Field>
          <Field id={fid("dur")} label="Durată (minute)" error={errors.durationMinutes}>
            {(p) => (
              <Input
                {...p}
                inputMode="numeric"
                value={v.durationMinutes}
                onChange={(e) => setV({ ...v, durationMinutes: e.target.value })}
              />
            )}
          </Field>
          <Field
            id={fid("freq")}
            label="Frecvență recomandată"
            error={errors.frequency}
            hint="Ex.: Zilnic, seara"
          >
            {(p) => (
              <Input
                {...p}
                value={v.frequency}
                onChange={(e) => setV({ ...v, frequency: e.target.value })}
              />
            )}
          </Field>
        </div>
        <CoverPicker
          folder="routines"
          value={v.cover}
          onChange={(cover) => setV({ ...v, cover })}
        />
        <div className="flex flex-wrap gap-6">
          <Checkbox
            id={fid("active")}
            checked={v.active}
            onCheckedChange={(c) => setV({ ...v, active: c === true })}
            label="Activă (vizibilă)"
          />
          <Checkbox
            id={fid("featured")}
            checked={v.featured}
            onCheckedChange={(c) => setV({ ...v, featured: c === true })}
            label="Recomandată pe prima pagină"
          />
        </div>
      </AdminCard>

      <AdminCard title="Pași">
        {errors.steps ? <p className="text-sm text-danger">{errors.steps}</p> : null}
        <ol className="flex flex-col gap-4">
          {v.steps.map((s, i) => (
            <li key={i} className="flex flex-col gap-3 rounded-lg border border-line p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="grid size-8 place-items-center rounded-full bg-forest text-sm font-semibold text-ink-inverse">
                  {i + 1}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={i === 0}
                    onClick={() => moveStep(i, -1)}
                    aria-label={`Mută pasul ${i + 1} mai sus`}
                  >
                    <ArrowUp aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={i === v.steps.length - 1}
                    onClick={() => moveStep(i, 1)}
                    aria-label={`Mută pasul ${i + 1} mai jos`}
                  >
                    <ArrowDown aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-danger"
                    disabled={v.steps.length === 1}
                    onClick={() => setV({ ...v, steps: v.steps.filter((_, j) => j !== i) })}
                    aria-label={`Șterge pasul ${i + 1}`}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_8rem]">
                <Field id={fid(`s${i}-t`)} label="Titlu" error={errors[`steps.${i}.title`]}>
                  {(p) => (
                    <Input
                      {...p}
                      value={s.title}
                      onChange={(e) => setStep(i, { title: e.target.value })}
                    />
                  )}
                </Field>
                <Field
                  id={fid(`s${i}-d`)}
                  label="Minute"
                  error={errors[`steps.${i}.durationMinutes`]}
                >
                  {(p) => (
                    <Input
                      {...p}
                      inputMode="numeric"
                      value={s.durationMinutes}
                      onChange={(e) => setStep(i, { durationMinutes: e.target.value })}
                    />
                  )}
                </Field>
              </div>
              <Field
                id={fid(`s${i}-i`)}
                label="Instrucțiuni (Markdown)"
                error={errors[`steps.${i}.instructions`]}
              >
                {(p) => (
                  <Textarea
                    {...p}
                    value={s.instructions}
                    onChange={(e) => setStep(i, { instructions: e.target.value })}
                    className="min-h-20"
                  />
                )}
              </Field>
              <Field id={fid(`s${i}-p`)} label="Produs folosit (opțional)">
                {(p) => (
                  <select
                    {...p}
                    value={s.productId}
                    onChange={(e) => setStep(i, { productId: e.target.value })}
                    className={cn(adminSelect, "h-11 w-full")}
                  >
                    <option value="">—</option>
                    {options.products.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </li>
          ))}
        </ol>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setV({ ...v, steps: [...v.steps, { ...emptyStep }] })}
        >
          <Plus aria-hidden /> Adaugă un pas
        </Button>
      </AdminCard>

      <AdminCard title="Produsele rutinei">
        <p className="-mt-2 text-sm text-ink-muted">
          Butonul „Adaugă produsele rutinei în coș” adaugă produsele în această ordine (cele
          opționale sunt marcate).
        </p>
        {errors.products ? <p className="text-sm text-danger">{errors.products}</p> : null}
        <ul className="flex flex-col gap-2">
          {v.products.map((p, i) => (
            <li
              key={i}
              className="grid gap-2 rounded-md border border-line p-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-center"
            >
              <select
                aria-label={`Produsul ${i + 1}`}
                value={p.id}
                onChange={(e) =>
                  setV({
                    ...v,
                    products: v.products.map((x, j) =>
                      j === i ? { ...x, id: e.target.value } : x,
                    ),
                  })
                }
                className={cn(adminSelect, "h-10")}
              >
                <option value="">Alege produsul</option>
                {options.products.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              <Input
                aria-label={`Notă pentru produsul ${i + 1}`}
                placeholder="Notă (opțional)"
                value={p.note}
                onChange={(e) =>
                  setV({
                    ...v,
                    products: v.products.map((x, j) =>
                      j === i ? { ...x, note: e.target.value } : x,
                    ),
                  })
                }
                className="h-10"
              />
              <Checkbox
                id={fid(`p${i}-opt`)}
                checked={p.isOptional}
                onCheckedChange={(c) =>
                  setV({
                    ...v,
                    products: v.products.map((x, j) =>
                      j === i ? { ...x, isOptional: c === true } : x,
                    ),
                  })
                }
                label="Opțional"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-danger"
                onClick={() => setV({ ...v, products: v.products.filter((_, j) => j !== i) })}
                aria-label={`Elimină produsul ${i + 1}`}
              >
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() =>
            setV({ ...v, products: [...v.products, { id: "", isOptional: false, note: "" }] })
          }
        >
          <Plus aria-hidden /> Adaugă un produs
        </Button>
      </AdminCard>

      <AdminCard title="Clasificare și SEO">
        <div className="grid gap-6 md:grid-cols-2">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold">Nevoi</legend>
            {options.needs.map((n) => (
              <Checkbox
                key={n.id}
                id={fid(`n-${n.id}`)}
                checked={v.needIds.includes(n.id)}
                onCheckedChange={() => toggle("needIds", n.id)}
                label={n.name}
              />
            ))}
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold">Etichete</legend>
            {options.tags.map((t) => (
              <Checkbox
                key={t.id}
                id={fid(`t-${t.id}`)}
                checked={v.tagIds.includes(t.id)}
                onCheckedChange={() => toggle("tagIds", t.id)}
                label={t.name}
              />
            ))}
          </fieldset>
        </div>
        <div className="grid gap-4 border-t border-line pt-4 md:grid-cols-2">
          <Field
            id={fid("st")}
            label="Titlu SEO"
            error={errors["seo.seoTitle"]}
            hint={`${v.seo.seoTitle.length}/70`}
          >
            {(p) => (
              <Input
                {...p}
                value={v.seo.seoTitle}
                onChange={(e) => setV({ ...v, seo: { ...v.seo, seoTitle: e.target.value } })}
              />
            )}
          </Field>
          <Field
            id={fid("sd")}
            label="Meta descriere"
            error={errors["seo.metaDescription"]}
            hint={`${v.seo.metaDescription.length}/160`}
          >
            {(p) => (
              <Input
                {...p}
                value={v.seo.metaDescription}
                onChange={(e) => setV({ ...v, seo: { ...v.seo, metaDescription: e.target.value } })}
              />
            )}
          </Field>
        </div>
      </AdminCard>

      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-3 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <Button type="submit" loading={pending}>
          {routineId ? "Salvează rutina" : "Creează rutina"}
        </Button>
      </div>
    </form>
  );
}
