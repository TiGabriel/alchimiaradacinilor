"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

import { uploadCoverAction } from "./actions";

export function CoverPicker({
  folder,
  value,
  onChange,
}: {
  folder: "routines" | "articles";
  value: { id: string; url: string } | null;
  onChange: (value: { id: string; url: string } | null) => void;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">Imagine de copertă</span>
      {value ? (
        <div className="flex items-end gap-3">
          <Image
            src={value.url}
            alt=""
            width={240}
            height={150}
            className="aspect-[16/10] w-60 rounded-lg border border-line object-cover"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-danger"
            onClick={() => onChange(null)}
          >
            <Trash2 aria-hidden /> Elimină
          </Button>
        </div>
      ) : (
        <p className="text-sm text-ink-muted">Fără imagine se afișează o ilustrație botanică.</p>
      )}
      <label className="inline-flex h-10 cursor-pointer items-center gap-2 self-start rounded-full border border-line-strong px-4 text-sm font-semibold hover:border-forest has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-forest">
        <ImagePlus aria-hidden className="size-4" /> {pending ? "Se încarcă…" : "Încarcă imaginea"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          disabled={pending}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            start(async () => {
              const data = new FormData();
              data.set("folder", folder);
              data.set("file", file);
              const result = await uploadCoverAction(data);
              if (!result.ok) toast({ title: result.error, variant: "error" });
              else onChange(result.data);
              e.target.value = "";
            });
          }}
        />
      </label>
    </div>
  );
}
