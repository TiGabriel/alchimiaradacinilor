"use client";

import {
  Bold,
  Eye,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Package,
  Pencil,
  Quote,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { toast } from "@/components/ui/toast";
import { findMedicalClaims } from "@/lib/claims";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { parseArticleContent, readingTimeMinutes } from "@/services/journal/content";

import { AdminCard, adminSelect } from "../ui";

import { saveArticleAction } from "./actions";
import { CoverPicker } from "./cover-picker";

export type ArticleDraft = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  authorName: string;
  categoryId: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedOn: string;
  featured: boolean;
  cover: { id: string; url: string } | null;
  productIds: string[];
  routineIds: string[];
  tagIds: string[];
  seo: { seoTitle: string; metaDescription: string; noIndex: boolean };
};

type Options = {
  products: Array<{ id: string; name: string; slug: string }>;
  routines: Array<{ id: string; title: string; slug: string }>;
  tags: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
};

type ToolId = "h2" | "bold" | "italic" | "ul" | "ol" | "quote" | "link";
const TOOLS: Array<{ id: ToolId; label: string; icon: typeof Bold }> = [
  { id: "h2", label: "Subtitlu", icon: Heading2 },
  { id: "bold", label: "Îngroșat", icon: Bold },
  { id: "italic", label: "Cursiv", icon: Italic },
  { id: "ul", label: "Listă", icon: List },
  { id: "ol", label: "Listă numerotată", icon: ListOrdered },
  { id: "quote", label: "Citat", icon: Quote },
  { id: "link", label: "Link", icon: Link2 },
];

/** Markdown editor with a formatting toolbar; content stays plain Markdown (safe to render). */
function MarkdownEditor({
  id,
  value,
  onChange,
  options,
  error,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Options;
  error?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [embed, setEmbed] = useState("");

  const apply = (
    fn: (selected: string) => { text: string; select?: [number, number] },
    block = false,
  ) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = value.slice(start, end);
    const { text } = fn(selected);
    const before = value.slice(0, start);
    const prefix =
      block && before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
    const next = `${before}${prefix}${text}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + prefix.length + text.length;
      el.setSelectionRange(pos, pos);
    });
  };
  const wrap = (mark: string, placeholder: string) =>
    apply((s) => ({ text: `${mark}${s || placeholder}${mark}` }));
  const linePrefix = (prefix: string, placeholder: string) =>
    apply(
      (s) => ({
        text: (s || placeholder)
          .split("\n")
          .map((l, i) => `${prefix === "1. " ? `${i + 1}. ` : prefix}${l}`)
          .join("\n"),
      }),
      true,
    );

  const runTool = (tool: ToolId) => {
    switch (tool) {
      case "h2":
        return linePrefix("## ", "Subtitlu");
      case "bold":
        return wrap("**", "text");
      case "italic":
        return wrap("_", "text");
      case "ul":
        return linePrefix("- ", "element");
      case "ol":
        return linePrefix("1. ", "element");
      case "quote":
        return linePrefix("> ", "citat");
      case "link": {
        const url = prompt("Adresa linkului (https://… sau /pagina):");
        if (url) apply((s) => ({ text: `[${s || "text"}](${url})` }));
      }
    }
  };
  const blocks = parseArticleContent(value);
  const productName = new Map(options.products.map((p) => [p.slug, p.name]));
  const routineName = new Map(options.routines.map((r) => [r.slug, r.title]));
  const claims = findMedicalClaims(value);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span id={`${id}-label`} className="text-sm font-semibold">
          Conținut
          <span aria-hidden className="ml-0.5 text-clay">
            *
          </span>
        </span>
        <div
          role="tablist"
          aria-label="Mod editor"
          className="flex rounded-full border border-line p-0.5 text-sm"
        >
          {(["edit", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold",
                tab === t ? "bg-forest text-ink-inverse" : "text-ink-muted",
              )}
            >
              {t === "edit" ? (
                <Pencil aria-hidden className="size-3.5" />
              ) : (
                <Eye aria-hidden className="size-3.5" />
              )}
              {t === "edit" ? "Editare" : "Previzualizare"}
            </button>
          ))}
        </div>
      </div>
      {tab === "edit" ? (
        <>
          <div
            role="toolbar"
            aria-label="Formatare"
            className="flex flex-wrap items-center gap-1 rounded-t-md border border-b-0 border-line-strong bg-paper-deep/60 p-1"
          >
            {TOOLS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => runTool(t.id)}
                title={t.label}
                aria-label={t.label}
                className="grid size-8 place-items-center rounded hover:bg-surface"
              >
                <t.icon aria-hidden className="size-4" />
              </button>
            ))}
            <span aria-hidden className="mx-1 h-5 w-px bg-line" />
            <label htmlFor={`${id}-embed`} className="sr-only">
              Inserează un card
            </label>
            <select
              id={`${id}-embed`}
              value={embed}
              onChange={(e) => setEmbed(e.target.value)}
              className={cn(adminSelect, "h-8 max-w-56 text-xs")}
            >
              <option value="">Card produs / rutină…</option>
              <optgroup label="Produse">
                {options.products.map((p) => (
                  <option key={p.id} value={`produs:${p.slug}`}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Rutine">
                {options.routines.map((r) => (
                  <option key={r.id} value={`rutina:${r.slug}`}>
                    {r.title}
                  </option>
                ))}
              </optgroup>
            </select>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!embed}
              onClick={() => (apply(() => ({ text: `{{${embed}}}\n\n` }), true), setEmbed(""))}
            >
              Inserează
            </Button>
          </div>
          <Textarea
            id={id}
            ref={ref}
            aria-labelledby={`${id}-label`}
            aria-invalid={error ? true : undefined}
            aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="-mt-2 min-h-[28rem] rounded-t-none font-mono text-sm"
          />
        </>
      ) : (
        <div className="min-h-[28rem] rounded-md border border-line bg-surface p-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-5 text-[1.0625rem] [&_h2]:pt-3 [&_h2]:font-display [&_h2]:text-2xl">
            {blocks.map((b, i) =>
              b.type === "markdown" ? (
                <Markdown key={i}>{b.text}</Markdown>
              ) : (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-line-strong bg-paper-deep/40 p-4 text-sm"
                >
                  {b.type === "product" ? (
                    <Package aria-hidden className="size-5 text-forest" />
                  ) : (
                    <Sparkles aria-hidden className="size-5 text-forest" />
                  )}
                  <span>
                    Card {b.type === "product" ? "produs" : "rutină"}:{" "}
                    <strong>
                      {(b.type === "product" ? productName.get(b.slug) : routineName.get(b.slug)) ??
                        `„${b.slug}” (nu există)`}
                    </strong>
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      )}
      <p id={`${id}-hint`} className="text-sm text-ink-muted">
        Markdown · ~{readingTimeMinutes(value)} min de citit. Un card se adaugă pe un rând separat:{" "}
        {"{{produs:slug}}"} sau {"{{rutina:slug}}"}.
      </p>
      {claims.length ? (
        <p className="text-sm text-warning">Atenție la formulări medicale: {claims.join(", ")}.</p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ArticleForm({
  articleId,
  initial,
  options,
}: {
  articleId?: string;
  initial: ArticleDraft;
  options: Options;
}) {
  const uid = useId();
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const fid = (n: string) => `${uid}-${n}`;
  const toggle = (k: "productIds" | "routineIds" | "tagIds", id: string) =>
    setV({ ...v, [k]: v[k].includes(id) ? v[k].filter((x) => x !== id) : [...v[k], id] });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const { cover, ...rest } = v;
    start(async () => {
      const result = await saveArticleAction({ ...rest, coverImageId: cover?.id ?? "" }, articleId);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast({ title: result.error, variant: "error" });
        return;
      }
      setErrors({});
      toast({ title: result.message ?? "Salvat", variant: "success" });
      if (!articleId) router.push(`/admin/jurnal/${result.data.id}`);
      else router.refresh();
    });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <AdminCard title="Articol">
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
                    slug: articleId ? v.slug : slugify(e.target.value),
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
            hint={`/jurnal/${v.slug || "…"}`}
          >
            {(p) => (
              <Input {...p} value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} />
            )}
          </Field>
        </div>
        <Field
          id={fid("excerpt")}
          label="Rezumat"
          error={errors.excerpt}
          hint={`${v.excerpt.length}/300 · apare pe card și în căutare.`}
        >
          {(p) => (
            <Textarea
              {...p}
              value={v.excerpt}
              onChange={(e) => setV({ ...v, excerpt: e.target.value })}
              className="min-h-20"
            />
          )}
        </Field>
        <MarkdownEditor
          id={fid("content")}
          value={v.content}
          onChange={(content) => setV({ ...v, content })}
          options={options}
          error={errors.content}
        />
        <CoverPicker
          folder="articles"
          value={v.cover}
          onChange={(cover) => setV({ ...v, cover })}
        />
      </AdminCard>

      <AdminCard title="Publicare">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field id={fid("status")} label="Stare">
            {(p) => (
              <select
                {...p}
                value={v.status}
                onChange={(e) => setV({ ...v, status: e.target.value as ArticleDraft["status"] })}
                className={cn(adminSelect, "h-11 w-full")}
              >
                <option value="DRAFT">Ciornă</option>
                <option value="PUBLISHED">Publicat</option>
                <option value="ARCHIVED">Arhivat</option>
              </select>
            )}
          </Field>
          <Field
            id={fid("date")}
            label="Data publicării"
            error={errors.publishedOn}
            hint="Gol = acum. O dată viitoare îl programează."
          >
            {(p) => (
              <Input
                {...p}
                type="date"
                value={v.publishedOn}
                onChange={(e) => setV({ ...v, publishedOn: e.target.value })}
              />
            )}
          </Field>
          <Field id={fid("cat")} label="Categorie">
            {(p) => (
              <select
                {...p}
                value={v.categoryId}
                onChange={(e) => setV({ ...v, categoryId: e.target.value })}
                className={cn(adminSelect, "h-11 w-full")}
              >
                <option value="">—</option>
                {options.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field id={fid("author")} label="Semnătură" hint="Gol = numele tău.">
            {(p) => (
              <Input
                {...p}
                value={v.authorName}
                onChange={(e) => setV({ ...v, authorName: e.target.value })}
              />
            )}
          </Field>
        </div>
        <Checkbox
          id={fid("featured")}
          checked={v.featured}
          onCheckedChange={(c) => setV({ ...v, featured: c === true })}
          label="Articol principal în jurnal"
        />
      </AdminCard>

      <AdminCard title="Legături și SEO">
        <div className="grid gap-6 md:grid-cols-3">
          <fieldset className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            <legend className="mb-2 text-sm font-semibold">Produse din articol</legend>
            {options.products.map((p) => (
              <Checkbox
                key={p.id}
                id={fid(`p-${p.id}`)}
                checked={v.productIds.includes(p.id)}
                onCheckedChange={() => toggle("productIds", p.id)}
                label={p.name}
              />
            ))}
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold">Rutine legate</legend>
            {options.routines.map((r) => (
              <Checkbox
                key={r.id}
                id={fid(`r-${r.id}`)}
                checked={v.routineIds.includes(r.id)}
                onCheckedChange={() => toggle("routineIds", r.id)}
                label={r.title}
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
        <Checkbox
          id={fid("noindex")}
          checked={v.seo.noIndex}
          onCheckedChange={(c) => setV({ ...v, seo: { ...v.seo, noIndex: c === true } })}
          label="Nu indexa în motoarele de căutare"
        />
      </AdminCard>

      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-3 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <Button type="submit" loading={pending}>
          {articleId ? "Salvează articolul" : "Creează articolul"}
        </Button>
      </div>
    </form>
  );
}
