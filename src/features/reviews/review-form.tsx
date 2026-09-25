"use client";

import { ImagePlus, Star, X } from "lucide-react";
import { useActionState, useEffect, useId, useRef, useState } from "react";

import { Field, Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { REVIEW_IMAGE_MAX_BYTES } from "@/validation/review";

import { FormMessage, SubmitButton } from "../auth/components/form-bits";
import { idleState } from "../auth/form-state";

import { submitReviewAction } from "./actions";

const ratingWords = ["", "Nu mi-a plăcut", "Așa și așa", "Bun", "Foarte bun", "Excelent"];

export function ReviewForm({
  productId,
  productSlug,
  productName,
}: {
  productId: string;
  productSlug: string;
  productName: string;
}) {
  const id = useId();
  const [state, action] = useActionState(submitReviewAction, idleState);
  const [rating, setRating] = useState(Number(state.values?.rating) || 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(state.values?.body ?? "");
  const [preview, setPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  if (state.status === "success")
    return (
      <p role="status" className="rounded-xl border border-forest/25 bg-forest-soft/50 p-5">
        {state.message}
      </p>
    );

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (!file) return;
    if (file.size > REVIEW_IMAGE_MAX_BYTES) {
      setImageError("Imaginea poate avea cel mult 5 MB.");
      e.target.value = "";
      return;
    }
    setPreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    if (fileRef.current) fileRef.current.value = "";
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const shown = hover || rating;

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="productSlug" value={productSlug} />
      <FormMessage state={state.status === "error" ? state : idleState} />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">
          Nota ta pentru {productName}
          <span aria-hidden className="ml-0.5 text-clay">
            *
          </span>
        </legend>
        <div className="flex items-center gap-3" onMouseLeave={() => setHover(0)}>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <label
                key={value}
                onMouseEnter={() => setHover(value)}
                className="cursor-pointer rounded-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forest"
              >
                <input
                  type="radio"
                  name="rating"
                  value={value}
                  checked={rating === value}
                  onChange={() => setRating(value)}
                  className="sr-only"
                  aria-describedby={state.errors?.rating ? `${id}-rating-error` : undefined}
                />
                <span className="sr-only">
                  {value} {value === 1 ? "stea" : "stele"}
                </span>
                <Star
                  aria-hidden
                  className={cn(
                    "size-8 transition-colors",
                    value <= shown ? "fill-ochre text-ochre" : "fill-transparent text-line-strong",
                  )}
                  strokeWidth={1.5}
                />
              </label>
            ))}
          </div>
          <span className="text-sm text-ink-muted" aria-hidden>
            {ratingWords[shown]}
          </span>
        </div>
        {state.errors?.rating ? (
          <p id={`${id}-rating-error`} className="text-sm font-medium text-danger">
            {state.errors.rating}
          </p>
        ) : null}
      </fieldset>

      <Field id={`${id}-title`} label="Titlu (opțional)" error={state.errors?.title}>
        {(p) => (
          <Input {...p} name="title" maxLength={80} defaultValue={state.values?.title ?? ""} />
        )}
      </Field>

      <Field
        id={`${id}-body`}
        label="Recenzia ta"
        required
        error={state.errors?.body}
        hint={`${body.trim().length}/2000 caractere — spune-ne cum ți se pare aroma, când o folosești și ce ți-a plăcut.`}
      >
        {(p) => (
          <Textarea
            {...p}
            name="body"
            maxLength={2000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-32"
          />
        )}
      </Field>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Fotografie (opțional)</span>
        {preview ? (
          <div className="relative w-32 overflow-hidden rounded-lg border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
            <img
              src={preview}
              alt="Previzualizarea fotografiei alese"
              className="aspect-square w-full object-cover"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-surface/95 shadow-soft"
              aria-label="Elimină fotografia"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        ) : null}
        <label
          htmlFor={`${id}-image`}
          className={cn(
            "inline-flex h-11 cursor-pointer items-center gap-2 self-start rounded-full border border-line-strong px-5 text-sm font-semibold hover:border-forest hover:text-forest has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forest",
            preview && "sr-only",
          )}
        >
          <ImagePlus aria-hidden className="size-4" /> Adaugă o fotografie
          <input
            ref={fileRef}
            id={`${id}-image`}
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFile}
            className="sr-only"
            aria-describedby={`${id}-image-hint`}
          />
        </label>
        <p id={`${id}-image-hint`} className="text-xs text-ink-muted">
          JPG, PNG sau WebP, cel mult 5 MB. Eliminăm automat datele ascunse din fișier (ex.
          locația).
        </p>
        {imageError || state.errors?.image ? (
          <p className="text-sm font-medium text-danger">{imageError ?? state.errors?.image}</p>
        ) : null}
      </div>

      <SubmitButton className="self-start">Trimite recenzia</SubmitButton>
      <p className="text-xs text-ink-muted">
        Recenziile sunt verificate înainte de publicare. Publicăm prenumele și inițiala numelui.
      </p>
    </form>
  );
}
