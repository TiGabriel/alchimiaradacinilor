"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useId, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import { uploadSeoImageAction } from "./seo-actions";
import type { SeoDraft } from "./seo-draft";

function count(value: string, max: number) {
  return (
    <span className={cn("tabular-nums", value.length > max && "font-semibold text-danger")}>
      {value.length}/{max}
    </span>
  );
}

/**
 * SEO title, meta description, canonical URL, social image and noindex for one page.
 * `errors` are keyed like the schema paths; `prefix` is "seo." for nested forms, "" for flat ones.
 */
export function SeoFields({
  value,
  onChange,
  errors,
  prefix = "seo.",
  fallbacks,
}: {
  value: SeoDraft;
  onChange: (value: SeoDraft) => void;
  errors: Record<string, string | undefined>;
  prefix?: string;
  /** What is used when a field is left empty (shown as hints). */
  fallbacks: { title: string; description: string; image: string };
}) {
  const uid = useId();
  const [pending, start] = useTransition();
  const set = (patch: Partial<SeoDraft>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-4">
      <Field
        id={`${uid}-title`}
        label="Titlu SEO"
        error={errors[`${prefix}seoTitle`]}
        hint={
          <>
            {count(value.seoTitle, 70)} — gol: {fallbacks.title}.
          </>
        }
      >
        {(p) => (
          <Input
            {...p}
            value={value.seoTitle}
            onChange={(e) => set({ seoTitle: e.target.value })}
          />
        )}
      </Field>
      <Field
        id={`${uid}-desc`}
        label="Meta descriere"
        error={errors[`${prefix}metaDescription`]}
        hint={
          <>
            {count(value.metaDescription, 160)} — gol: {fallbacks.description}.
          </>
        }
      >
        {(p) => (
          <Textarea
            {...p}
            value={value.metaDescription}
            onChange={(e) => set({ metaDescription: e.target.value })}
            className="min-h-20"
          />
        )}
      </Field>
      <Field
        id={`${uid}-canonical`}
        label="URL canonic"
        error={errors[`${prefix}canonicalUrl`]}
        hint="Gol: adresa paginii. Completează doar dacă același conținut are o pagină principală în altă parte."
      >
        {(p) => (
          <Input
            {...p}
            value={value.canonicalUrl}
            placeholder="/produs/… sau https://…"
            onChange={(e) => set({ canonicalUrl: e.target.value })}
          />
        )}
      </Field>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Imagine pentru rețele sociale</span>
        {value.ogImage ? (
          <div className="flex items-end gap-3">
            <Image
              src={value.ogImage.url}
              alt=""
              width={240}
              height={126}
              className="aspect-[1200/630] w-60 rounded-lg border border-line object-cover"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-danger"
              onClick={() => set({ ogImage: null })}
            >
              <Trash2 aria-hidden /> Elimină
            </Button>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">Gol: {fallbacks.image}. Ideal 1200 × 630 px.</p>
        )}
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 self-start rounded-full border border-line-strong px-4 text-sm font-semibold hover:border-forest has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-forest">
          <ImagePlus aria-hidden className="size-4" />
          {pending ? "Se încarcă…" : value.ogImage ? "Înlocuiește imaginea" : "Încarcă imaginea"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={pending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const input = e.target;
              start(async () => {
                const data = new FormData();
                data.set("file", file);
                const result = await uploadSeoImageAction(data);
                if (!result.ok) toast({ title: result.error, variant: "error" });
                else set({ ogImage: result.data });
                input.value = "";
              });
            }}
          />
        </label>
        {errors[`${prefix}ogImageId`] ? (
          <p className="text-sm text-danger">{errors[`${prefix}ogImageId`]}</p>
        ) : null}
      </div>

      <Checkbox
        id={`${uid}-noindex`}
        checked={value.noIndex}
        onCheckedChange={(v) => set({ noIndex: v === true })}
        label="Nu indexa această pagină în motoarele de căutare (o scoate și din sitemap)"
      />
    </div>
  );
}
