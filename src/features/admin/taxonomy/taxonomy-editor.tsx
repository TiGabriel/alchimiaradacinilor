"use client";

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";
import type { TaxonomyRow } from "@/services/admin/taxonomy";
import type { TaxonomyKind } from "@/validation/admin/taxonomy";

import { DeleteButton } from "../delete-button";
import { EMPTY_SEO, seoDraftFrom, seoPayload, type SeoDraft } from "../seo-draft";
import { SeoFields } from "../seo-fields";
import { AdminTable, adminSelect, StatusDot, td, th } from "../ui";

import { deleteTaxonomyAction, saveTaxonomyAction } from "./actions";
import type { FieldSpec } from "./config";

type Draft = Record<string, string | boolean>;

function toDraft(row: TaxonomyRow | null, fields: FieldSpec[]): Draft {
  const draft: Draft = {};
  for (const f of fields) {
    const value = row?.[f.key];
    draft[f.key] =
      f.type === "checkbox" ? (value ?? true) === true : value == null ? "" : String(value);
  }
  return draft;
}

export function TaxonomyEditor({
  kind,
  singular,
  fields,
  rows,
}: {
  kind: TaxonomyKind;
  singular: string;
  fields: FieldSpec[];
  rows: TaxonomyRow[];
}) {
  const uid = useId();
  const router = useRouter();
  const [editing, setEditing] = useState<TaxonomyRow | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [seo, setSeo] = useState<SeoDraft>(EMPTY_SEO);
  // Only categories have a public page of their own (and so SEO fields).
  const withSeo = kind === "categorii";
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const byId = new Map(rows.map((r) => [r.id, r]));
  const hasParent = fields.some((f) => f.type === "parent");

  const open = (row: TaxonomyRow | null) => {
    setDraft(toDraft(row, fields));
    setSeo(seoDraftFrom(row?.seo));
    setErrors({});
    setEditing(row ?? "new");
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { ...draft, ...(withSeo ? seoPayload(seo) : {}) };
    start(async () => {
      const result = await saveTaxonomyAction(
        kind,
        payload,
        editing && editing !== "new" ? editing.id : undefined,
      );
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast({ title: result.error, variant: "error" });
        return;
      }
      toast({ title: "Salvat", variant: "success" });
      setEditing(null);
      router.refresh();
    });
  };

  const depth = (row: TaxonomyRow) => {
    let d = 0;
    let p = row.parentId;
    while (p && d < 5) {
      d += 1;
      p = byId.get(p)?.parentId ?? null;
    }
    return d;
  };
  const ordered = hasParent
    ? (() => {
        const out: TaxonomyRow[] = [];
        const walk = (parent: string | null) =>
          rows.filter((r) => r.parentId === parent).forEach((r) => (out.push(r), walk(r.id)));
        walk(null);
        return out;
      })()
    : rows;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button onClick={() => open(null)}>
          <Plus aria-hidden /> Adaugă {singular}
        </Button>
      </div>
      <AdminTable caption={`Lista: ${singular}`}>
        <thead className="border-b border-line bg-paper-deep/50">
          <tr>
            <th className={th}>Nume</th>
            <th className={th}>Slug</th>
            <th className={th}>Folosire</th>
            <th className={th}>Stare</th>
            <th className={`${th} text-right`}>Acțiuni</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {ordered.map((row) => (
            <tr key={row.id}>
              <td className={td}>
                <span
                  className="flex items-center gap-2 font-semibold"
                  style={{ paddingLeft: `${depth(row) * 1.25}rem` }}
                >
                  {row.colorHex ? (
                    <span
                      aria-hidden
                      className="size-3 rounded-full"
                      style={{ background: row.colorHex }}
                    />
                  ) : null}
                  {row.name}
                  {row.isDemo ? (
                    <span className="text-xs font-normal text-ink-muted">demo</span>
                  ) : null}
                </span>
              </td>
              <td className={`${td} font-mono text-xs`}>{row.slug}</td>
              <td className={`${td} text-ink-muted`}>{row.usage}</td>
              <td className={td}>
                {row.active == null ? (
                  "—"
                ) : (
                  <StatusDot tone={row.active ? "ok" : "off"}>
                    {row.active ? "Activ" : "Inactiv"}
                  </StatusDot>
                )}
              </td>
              <td className={`${td} text-right`}>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => open(row)}>
                    <Pencil aria-hidden /> Editează<span className="sr-only"> {row.name}</span>
                  </Button>
                  <DeleteButton
                    action={deleteTaxonomyAction.bind(null, kind, row.id)}
                    confirmText={`Ștergi „${row.name}”?`}
                  />
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                Nu există încă înregistrări.
              </td>
            </tr>
          ) : null}
        </tbody>
      </AdminTable>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>
              {editing === "new" ? `Adaugă ${singular}` : `Editează: ${editing?.name ?? ""}`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={save} noValidate className="flex flex-col gap-4">
            {fields.map((f) => {
              const id = `${uid}-${f.key}`;
              const value = draft[f.key];
              if (f.type === "checkbox")
                return (
                  <Checkbox
                    key={f.key}
                    id={id}
                    checked={value === true}
                    onCheckedChange={(v) => setDraft((d) => ({ ...d, [f.key]: v === true }))}
                    label={f.label}
                  />
                );
              return (
                <Field
                  key={f.key}
                  id={id}
                  label={f.label}
                  hint={f.hint}
                  error={errors[f.key]}
                  required={f.key === "name" || f.key === "slug"}
                >
                  {(p) =>
                    f.type === "textarea" ? (
                      <Textarea
                        {...p}
                        value={String(value ?? "")}
                        onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                        className="min-h-24"
                      />
                    ) : f.type === "parent" ? (
                      <select
                        {...p}
                        value={String(value ?? "")}
                        onChange={(e) => setDraft((d) => ({ ...d, parentId: e.target.value }))}
                        className={cn(adminSelect, "h-11 w-full")}
                      >
                        <option value="">— Categorie principală —</option>
                        {ordered
                          .filter((r) => editing === "new" || r.id !== editing?.id)
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {"— ".repeat(depth(r))}
                              {r.name}
                            </option>
                          ))}
                      </select>
                    ) : f.type === "color" ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          aria-label={`${f.label} (selector)`}
                          value={/^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : "#a3b18a"}
                          onChange={(e) => setDraft((d) => ({ ...d, colorHex: e.target.value }))}
                          className="h-11 w-14 cursor-pointer rounded-md border border-line-strong bg-surface"
                        />
                        <Input
                          {...p}
                          value={String(value ?? "")}
                          onChange={(e) => setDraft((d) => ({ ...d, colorHex: e.target.value }))}
                          placeholder="#a3b18a"
                        />
                      </div>
                    ) : (
                      <Input
                        {...p}
                        type={f.type === "number" ? "number" : f.type === "url" ? "url" : "text"}
                        value={String(value ?? "")}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            [f.key]: e.target.value,
                            ...(f.key === "name" && editing === "new"
                              ? { slug: slugify(e.target.value) }
                              : {}),
                          }))
                        }
                      />
                    )
                  }
                </Field>
              );
            })}
            {withSeo ? (
              <fieldset className="flex flex-col gap-3 border-t border-line pt-4">
                <legend className="pb-2 text-sm font-semibold">SEO și rețele sociale</legend>
                <SeoFields
                  value={seo}
                  onChange={setSeo}
                  errors={errors}
                  prefix=""
                  fallbacks={{
                    title: "numele categoriei",
                    description: "descrierea categoriei",
                    image: "imaginea implicită a site-ului",
                  }}
                />
              </fieldset>
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Renunță
              </Button>
              <Button type="submit" loading={pending}>
                Salvează
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
