"use client";

import { Check, RotateCcw, Trash2, TriangleAlert, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState, useTransition } from "react";

import { Leaf, Sprig } from "@/components/botanical";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RatingStars } from "@/components/ui/rating-stars";
import { toast } from "@/components/ui/toast";
import {
  BUILTIN_PRESETS,
  checkContrast,
  DEFAULT_PALETTE,
  formatRatio,
  HEX_COLOR,
  PALETTE_GROUPS,
  PALETTE_KEYS,
  PALETTE_TOKENS,
  paletteVariables,
  productPhotoMatrix,
  type Palette,
  type PaletteKey,
  type PalettePreset,
} from "@/lib/palette";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";
import type { SettingValue } from "@/validation/settings";

import { AdminCard } from "../ui";

import { saveSettingAction } from "./actions";

type Theme = SettingValue<"theme">;

const fieldId = (key: PaletteKey) => `culoare-${PALETTE_TOKENS[key].css}`;

function samePalette(a: Palette, b: Palette) {
  return PALETTE_KEYS.every((key) => a[key] === b[key]);
}

function Swatches({ colors, className }: { colors: Palette; className?: string }) {
  const keys: PaletteKey[] = ["paper", "surface", "ink", "forest", "forestSoft", "clay", "ochre"];
  return (
    <span
      aria-hidden
      className={cn("flex overflow-hidden rounded-md border border-line", className)}
    >
      {keys.map((key) => (
        <span key={key} className="h-6 flex-1" style={{ backgroundColor: colors[key] }} />
      ))}
    </span>
  );
}

function ColorField({
  token,
  value,
  onChange,
}: {
  token: PaletteKey;
  value: string;
  onChange: (value: string) => void;
}) {
  const def = PALETTE_TOKENS[token];
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);
  const shown = editing ? draft : value;
  const invalid = editing && !HEX_COLOR.test(draft.trim());
  const changed = value !== DEFAULT_PALETTE[token];
  return (
    <div className="flex items-start gap-3 py-3">
      <input
        type="color"
        id={fieldId(token)}
        value={value}
        onChange={(e) => onChange(e.target.value.toLowerCase())}
        className="size-11 shrink-0 cursor-pointer rounded-lg border border-line-strong bg-surface p-1"
        aria-describedby={`${fieldId(token)}-hint`}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <label htmlFor={fieldId(token)} className="text-sm font-semibold">
          {def.label}
        </label>
        <p id={`${fieldId(token)}-hint`} className="text-xs text-ink-muted">
          {def.hint}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Input
          value={shown}
          aria-label={`Cod hex pentru ${def.label}`}
          aria-invalid={invalid || undefined}
          spellCheck={false}
          maxLength={7}
          className="h-9 w-24 px-2 font-mono text-sm"
          onFocus={() => (setDraft(value), setEditing(true))}
          onBlur={() => setEditing(false)}
          onChange={(e) => {
            const next = e.target.value.trim();
            setDraft(next);
            const withHash = next.startsWith("#") ? next : `#${next}`;
            if (HEX_COLOR.test(withHash)) onChange(withHash.toLowerCase());
          }}
        />
        {changed ? (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_PALETTE[token])}
            className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:underline"
            aria-label={`Culoarea originală pentru ${def.label}`}
          >
            <RotateCcw aria-hidden className="size-3" /> Original
          </button>
        ) : null}
      </div>
    </div>
  );
}

const PREVIEW_PHOTO_FILTER = "fundal-produse-previzualizare";

/** Key components drawn with the palette being edited (CSS variables on a wrapper). */
function Preview({ colors, samplePhoto }: { colors: Palette; samplePhoto: string | null }) {
  const photoMatrix = productPhotoMatrix(colors.productBackdrop);
  return (
    <div
      style={paletteVariables(colors) as React.CSSProperties}
      className="flex flex-col overflow-hidden rounded-xl border border-line bg-paper text-ink"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <span className="font-display text-lg text-forest">Alchimia</span>
        <span className="hidden gap-3 text-sm font-semibold sm:flex">
          <span className="text-forest">Jurnal</span>
          <span>Recenzii</span>
          <span>Ritualuri</span>
        </span>
        <span className="rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-ink-inverse">
          Abonează-te
        </span>
      </div>

      {/* Hero */}
      <div className="flex flex-col gap-2 px-4 py-5">
        <p className="text-eyebrow text-clay">Jurnal botanic</p>
        <p className="font-display text-2xl leading-tight">Ritualuri simple pentru seară</p>
        <p className="text-sm text-ink-muted">
          Text secundar: o descriere scurtă, ca sub titlurile de pe site.
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          <Button size="sm" tabIndex={-1}>
            Citește jurnalul
          </Button>
          <Button size="sm" variant="outline" tabIndex={-1}>
            Produse
          </Button>
          <Button size="sm" variant="accent" tabIndex={-1}>
            Accent
          </Button>
        </div>
      </div>

      {/* Product card + article */}
      <div className="grid gap-3 bg-paper-deep px-4 py-4 sm:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
          <div className="relative grid aspect-[4/3] place-items-center bg-product-backdrop">
            {samplePhoto ? (
              <>
                {photoMatrix ? (
                  <svg aria-hidden width="0" height="0" className="absolute">
                    <filter id={PREVIEW_PHOTO_FILTER} colorInterpolationFilters="sRGB">
                      <feColorMatrix type="matrix" values={photoMatrix} />
                    </filter>
                  </svg>
                ) : null}
                <Image
                  src={samplePhoto}
                  alt=""
                  fill
                  sizes="320px"
                  className="object-cover"
                  style={{ filter: photoMatrix ? `url(#${PREVIEW_PHOTO_FILTER})` : undefined }}
                />
              </>
            ) : (
              <Sprig className="h-16 text-sage" />
            )}
            <span className="absolute top-2 left-2 rounded-full bg-forest-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-forest-deep">
              Pe doTERRA
            </span>
          </div>
          <div className="flex flex-col gap-1.5 p-3">
            <p className="font-display text-base">Lavandă</p>
            <RatingStars value={4.5} size="sm" />
            <p className="text-xs text-ink-muted">Preț pe doTERRA: 129 lei</p>
            <span className="mt-1 rounded-full bg-forest py-1.5 text-center text-xs font-semibold text-ink-inverse">
              Cumpără de pe doTERRA
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-3">
          <p className="text-eyebrow text-clay">Articol</p>
          <p className="font-display text-base leading-snug">Cum alegi primul difuzor</p>
          <p className="text-xs text-ink-muted">
            Câteva idei pentru un colț liniștit al casei, fără grabă.
          </p>
          <span className="text-xs font-semibold text-forest underline underline-offset-2">
            Citește articolul
          </span>
          <span className="mt-auto inline-flex self-start rounded-full bg-clay-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-clay">
            Etichetă
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-2 px-4 py-4 text-xs font-semibold">
        <p className="rounded-md bg-success-soft px-3 py-2 text-success">
          Setările au fost salvate.
        </p>
        <p className="rounded-md bg-warning-soft px-3 py-2 text-warning">Document în lucru.</p>
        <p className="rounded-md bg-danger-soft px-3 py-2 text-danger">Verifică câmpurile.</p>
      </div>

      {/* Footer */}
      <div className="relative overflow-hidden bg-forest-deep px-4 py-4 text-sm text-ink-inverse">
        <Leaf className="absolute -right-3 -bottom-3 size-16 text-ink-inverse/10" />
        <p className="font-display text-base">Scrisori botanice</p>
        <p className="text-ink-inverse/70">Text discret în subsol.</p>
      </div>

      {/* Email */}
      <div className="flex flex-col gap-2 border-t border-line bg-paper px-4 py-4">
        <p className="text-xs font-semibold text-ink-muted">Email</p>
        <p className="font-display text-base text-forest">Alchimia Rădăcinilor</p>
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-3">
          <p className="font-display text-lg">Bine ai venit!</p>
          <p className="text-xs">Contul tău este gata.</p>
          <span className="self-start rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-ink-inverse">
            Citește jurnalul
          </span>
        </div>
      </div>
    </div>
  );
}

export function PaletteEditor({
  initial,
  samplePhoto,
}: {
  initial: Theme;
  /** A product photo for the preview, to judge the photo backdrop. */
  samplePhoto: string | null;
}) {
  const uid = useId();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState<Theme>(initial);
  const [colors, setColors] = useState<Palette>(initial.colors);
  const [presetName, setPresetName] = useState("");
  // Re-mounts the hex inputs when a whole palette is loaded at once.
  const [generation, setGeneration] = useState(0);

  const results = useMemo(() => checkContrast(colors), [colors]);
  const failing = results.filter((r) => !r.passes);
  const dirty = !samePalette(colors, saved.colors);

  const load = (palette: Palette) => {
    setColors(palette);
    setGeneration((g) => g + 1);
  };

  const persist = (theme: Theme, message: string) =>
    start(async () => {
      const result = await saveSettingAction("theme", theme);
      if (!result.ok) {
        const details = Object.values(result.fieldErrors ?? {});
        toast({
          title: result.error,
          description: details.length ? details.slice(0, 2).join(" ") : undefined,
          variant: "error",
        });
        return;
      }
      setSaved(theme);
      toast({ title: message, variant: "success" });
      router.refresh();
    });

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    const id = `${slugify(name).slice(0, 30) || "tema"}-${Date.now().toString(36)}`.slice(0, 40);
    persist(
      { colors: saved.colors, presets: [...saved.presets, { id, name, colors }] },
      `Tema „${name}” a fost salvată.`,
    );
    setPresetName("");
  };

  const presetRow = (preset: PalettePreset, removable: boolean) => (
    <li key={preset.id} className="flex items-center gap-3 py-2.5">
      <Swatches colors={preset.colors} className="w-28 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{preset.name}</span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => load(preset.colors)}
        disabled={samePalette(preset.colors, colors)}
      >
        Aplică
      </Button>
      {removable ? (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={`Șterge tema ${preset.name}`}
          onClick={() =>
            persist(
              { colors: saved.colors, presets: saved.presets.filter((p) => p.id !== preset.id) },
              `Tema „${preset.name}” a fost ștearsă.`,
            )
          }
        >
          <Trash2 aria-hidden />
        </Button>
      ) : null}
    </li>
  );

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <AdminCard title="Teme">
          <p className="text-sm text-ink-muted">
            „Aplică” încarcă tema în editor; site-ul se schimbă abia după „Salvează culorile”.
          </p>
          <ul className="divide-y divide-line">
            {BUILTIN_PRESETS.map((p) => presetRow(p, false))}
            {saved.presets.map((p) => presetRow(p, true))}
          </ul>
          <form
            className="flex flex-wrap items-end gap-2 border-t border-line pt-4"
            onSubmit={(e) => (e.preventDefault(), savePreset())}
          >
            <div className="flex min-w-48 flex-1 flex-col gap-1">
              <label htmlFor={`${uid}-preset`} className="text-sm font-semibold">
                Salvează culorile din editor ca temă
              </label>
              <Input
                id={`${uid}-preset`}
                value={presetName}
                maxLength={60}
                placeholder="ex. Toamnă"
                onChange={(e) => setPresetName(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              loading={pending}
              disabled={!presetName.trim() || failing.length > 0 || saved.presets.length >= 12}
            >
              Salvează tema
            </Button>
          </form>
        </AdminCard>

        {PALETTE_GROUPS.map((group) => (
          <AdminCard key={group.id} title={group.label}>
            <div className="divide-y divide-line">
              {PALETTE_KEYS.filter((key) => PALETTE_TOKENS[key].group === group.id).map((key) => (
                <ColorField
                  key={`${key}-${generation}`}
                  token={key}
                  value={colors[key]}
                  onChange={(value) => setColors((c) => ({ ...c, [key]: value }))}
                />
              ))}
            </div>
          </AdminCard>
        ))}
      </div>

      <div className="flex flex-col gap-6 xl:sticky xl:top-6">
        <AdminCard title="Previzualizare">
          <Preview colors={colors} samplePhoto={samplePhoto} />
        </AdminCard>

        <AdminCard title="Contrast (WCAG AA)">
          {failing.length > 0 ? (
            <p
              role="status"
              className="flex items-start gap-2 rounded-lg bg-danger-soft p-3 text-sm font-semibold text-danger"
            >
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              {failing.length === 1
                ? "O pereche de culori nu se citește destul de bine. Schimb-o ca să poți salva."
                : `${failing.length} perechi de culori nu se citesc destul de bine. Schimbă-le ca să poți salva.`}
            </p>
          ) : (
            <p role="status" className="text-sm text-ink-muted">
              Toate perechile text/fundal se citesc bine (minim 4,5:1 pentru text, 3:1 pentru
              stele).
            </p>
          )}
          <ul className="flex max-h-[26rem] flex-col gap-1 overflow-y-auto pr-1">
            {[...results]
              .sort((a, b) => Number(a.passes) - Number(b.passes))
              .map((r) => (
                <li key={r.id} className="flex items-center gap-3 rounded-md py-1.5 text-sm">
                  <span
                    aria-hidden
                    className="grid h-8 w-11 shrink-0 place-items-center rounded-md border border-line font-display font-semibold"
                    style={{ backgroundColor: r.bgColor, color: r.fgColor }}
                  >
                    Aa
                  </span>
                  <a
                    href={`#${fieldId(typeof r.fg === "string" ? r.fg : r.bg)}`}
                    className="min-w-0 flex-1 leading-snug hover:underline"
                  >
                    {r.label}
                  </a>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 font-semibold tabular-nums",
                      r.passes ? "text-success" : "text-danger",
                    )}
                  >
                    {r.passes ? (
                      <Check aria-hidden className="size-4" />
                    ) : (
                      <X aria-hidden className="size-4" />
                    )}
                    {formatRatio(r.ratio)}
                    <span className="sr-only">
                      {r.passes ? "suficient" : `insuficient, minim ${r.min}:1`}
                    </span>
                  </span>
                </li>
              ))}
          </ul>
        </AdminCard>

        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
          <Button
            type="button"
            loading={pending}
            disabled={!dirty || failing.length > 0}
            onClick={() =>
              persist({ colors, presets: saved.presets }, "Culorile au fost salvate pe site.")
            }
          >
            Salvează culorile
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!dirty}
              onClick={() => load(saved.colors)}
            >
              Renunță la modificări
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={samePalette(colors, DEFAULT_PALETTE)}
              onClick={() => load(DEFAULT_PALETTE)}
            >
              <RotateCcw aria-hidden /> Culorile originale
            </Button>
          </div>
          {dirty ? <p className="text-xs text-ink-muted">Ai modificări nesalvate.</p> : null}
        </div>
      </div>
    </div>
  );
}
