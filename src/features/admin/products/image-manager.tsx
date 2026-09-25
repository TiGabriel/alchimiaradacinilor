"use client";

import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import {
  removeProductImageAction,
  reorderProductImagesAction,
  setProductThumbnailAction,
  updateProductImageAltAction,
  uploadProductImageAction,
} from "./actions";

export type ManagedImage = {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
};

const MAX_BYTES = 5 * 1024 * 1024;

/** Upload, order, alt text and thumbnail choice. Position 1 is the product's thumbnail. */
export function ImageManager({ productId, images }: { productId: string; images: ManagedImage[] }) {
  const uid = useId();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success?: string) =>
    start(async () => {
      const result = await fn();
      if (!result.ok) toast({ title: result.error ?? "Eroare", variant: "error" });
      else if (success) toast({ title: success, variant: "success" });
      router.refresh();
    });

  const upload = (files: FileList | null) => {
    if (!files?.length) return;
    const list = [...files];
    start(async () => {
      let done = 0;
      for (const file of list) {
        setProgress(`Se încarcă ${done + 1} din ${list.length}…`);
        if (file.size > MAX_BYTES) {
          toast({ title: `${file.name}: imaginea poate avea cel mult 5 MB.`, variant: "error" });
          continue;
        }
        const data = new FormData();
        data.set("productId", productId);
        data.set("file", file);
        data.set("alt", "");
        const result = await uploadProductImageAction(data);
        if (!result.ok) toast({ title: `${file.name}: ${result.error}`, variant: "error" });
        else done += 1;
      }
      setProgress(null);
      if (input.current) input.current.value = "";
      if (done)
        toast({
          title: `${done} ${done === 1 ? "imagine încărcată" : "imagini încărcate"}`,
          variant: "success",
        });
      router.refresh();
    });
  };

  const move = (index: number, delta: number) => {
    const ids = images.map((i) => i.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    run(() => reorderProductImagesAction(productId, ids));
  };

  return (
    <div className="flex flex-col gap-4" aria-busy={pending}>
      {images.length ? (
        <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <li
              key={image.id}
              className={cn(
                "flex flex-col gap-2 rounded-lg border p-2",
                index === 0 ? "border-forest" : "border-line",
              )}
            >
              <div className="relative aspect-square overflow-hidden rounded-md bg-paper-deep">
                <Image
                  src={image.url}
                  alt={image.alt ?? ""}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                {index === 0 ? (
                  <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-forest px-2 py-0.5 text-xs font-semibold text-ink-inverse">
                    <Star aria-hidden className="size-3" /> Principală
                  </span>
                ) : null}
              </div>
              <label htmlFor={`${uid}-alt-${image.id}`} className="sr-only">
                Text alternativ pentru imaginea {index + 1}
              </label>
              <input
                id={`${uid}-alt-${image.id}`}
                defaultValue={image.alt ?? ""}
                placeholder="Text alternativ"
                maxLength={160}
                onBlur={(e) => {
                  if (e.target.value !== (image.alt ?? ""))
                    run(
                      () => updateProductImageAltAction(productId, image.id, e.target.value),
                      "Text alternativ salvat",
                    );
                }}
                className="h-9 rounded-md border border-line-strong bg-surface px-2 text-sm"
              />
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={index === 0 || pending}
                  onClick={() => move(index, -1)}
                  aria-label={`Mută imaginea ${index + 1} mai în față`}
                >
                  <ArrowLeft aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={index === images.length - 1 || pending}
                  onClick={() => move(index, 1)}
                  aria-label={`Mută imaginea ${index + 1} mai în spate`}
                >
                  <ArrowRight aria-hidden />
                </Button>
                {index !== 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () => setProductThumbnailAction(productId, image.id),
                        "Imagine principală setată",
                      )
                    }
                    aria-label={`Setează imaginea ${index + 1} ca principală`}
                  >
                    <Star aria-hidden />
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  className="ml-auto text-danger"
                  onClick={() => {
                    if (confirm("Ștergi această imagine?"))
                      run(() => removeProductImageAction(productId, image.id), "Imagine ștearsă");
                  }}
                  aria-label={`Șterge imaginea ${index + 1}`}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-ink-muted">
          Produsul nu are încă imagini. Magazinul afișează o ilustrație până atunci.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-semibold hover:border-forest has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forest">
          <ImagePlus aria-hidden className="size-4" /> Adaugă imagini
          <input
            ref={input}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            onChange={(e) => upload(e.target.files)}
            disabled={pending}
          />
        </label>
        <p className="text-xs text-ink-muted" aria-live="polite">
          {progress ??
            "JPG, PNG, WebP sau AVIF, max. 5 MB fiecare, până la 12 imagini. Convertim automat în WebP."}
        </p>
      </div>
    </div>
  );
}
