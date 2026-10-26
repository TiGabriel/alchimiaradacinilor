"use client";

import { ImagePlus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { SettingKey, SettingValue } from "@/validation/settings";

import { AdminCard, adminSelect } from "../ui";

import { saveSettingAction, uploadSiteImageAction } from "./actions";

function useSave<K extends SettingKey>(key: K) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const save = (value: SettingValue<K> | Record<string, unknown>) =>
    start(async () => {
      const result = await saveSettingAction(key, value);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast({ title: result.error, variant: "error" });
        return;
      }
      setErrors({});
      toast({ title: result.message ?? "Salvat", variant: "success" });
      router.refresh();
    });
  return { errors, pending, save };
}

function SaveRow({ pending }: { pending: boolean }) {
  return (
    <div className="flex justify-end border-t border-line pt-4">
      <Button type="submit" loading={pending}>
        Salvează
      </Button>
    </div>
  );
}

function ImageUpload({
  purpose,
  label,
  onUploaded,
}: {
  purpose: "logo" | "hero" | "og";
  label: string;
  onUploaded: (image: { url: string; width: number; height: number }) => void;
}) {
  const [pending, start] = useTransition();
  return (
    <label
      className={cn(
        "inline-flex h-10 cursor-pointer items-center gap-2 self-start rounded-full border border-line-strong px-4 text-sm font-semibold hover:border-forest has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-forest",
        pending && "opacity-60",
      )}
    >
      <ImagePlus aria-hidden className="size-4" /> {pending ? "Se încarcă…" : label}
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
            data.set("purpose", purpose);
            data.set("file", file);
            const result = await uploadSiteImageAction(data);
            if (!result.ok) toast({ title: result.error, variant: "error" });
            else onUploaded(result.data);
            e.target.value = "";
          });
        }}
      />
    </label>
  );
}

// ── Brand ─────────────────────────────────────────────────────────────────

export function BrandForm({ initial }: { initial: SettingValue<"brand"> }) {
  const uid = useId();
  const [v, setV] = useState(initial);
  const { errors, pending, save } = useSave("brand");
  const logo = v.logo;
  return (
    <AdminCard title="Brand">
      <form
        onSubmit={(e) => (e.preventDefault(), save(v))}
        className="flex flex-col gap-4"
        noValidate
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field id={`${uid}-name`} label="Numele site-ului" required error={errors.siteName}>
            {(p) => (
              <Input
                {...p}
                value={v.siteName}
                onChange={(e) => setV({ ...v, siteName: e.target.value })}
              />
            )}
          </Field>
          <Field id={`${uid}-tag`} label="Slogan" error={errors.tagline}>
            {(p) => (
              <Input
                {...p}
                value={v.tagline}
                onChange={(e) => setV({ ...v, tagline: e.target.value })}
              />
            )}
          </Field>
        </div>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold">Logo</legend>
          {logo.kind === "image" ? (
            <div className="flex flex-wrap items-center gap-4">
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                className="h-12 w-auto rounded border border-line bg-surface p-1"
              />
              <Field id={`${uid}-alt`} label="Text alternativ" error={errors["logo.alt"]}>
                {(p) => (
                  <Input
                    {...p}
                    value={logo.alt}
                    onChange={(e) => setV({ ...v, logo: { ...logo, alt: e.target.value } })}
                  />
                )}
              </Field>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setV({
                    ...v,
                    logo: {
                      kind: "wordmark",
                      primary: v.siteName.split(" ")[0] ?? v.siteName,
                      secondary: v.siteName.split(" ").slice(1).join(" "),
                    },
                  })
                }
              >
                Folosește logo-ul text
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Field id={`${uid}-p`} label="Rândul principal" error={errors["logo.primary"]}>
                {(p) => (
                  <Input
                    {...p}
                    value={logo.primary}
                    onChange={(e) => setV({ ...v, logo: { ...logo, primary: e.target.value } })}
                  />
                )}
              </Field>
              <Field id={`${uid}-s`} label="Rândul secundar" error={errors["logo.secondary"]}>
                {(p) => (
                  <Input
                    {...p}
                    value={logo.secondary ?? ""}
                    onChange={(e) => setV({ ...v, logo: { ...logo, secondary: e.target.value } })}
                  />
                )}
              </Field>
            </div>
          )}
          <ImageUpload
            purpose="logo"
            label="Încarcă un logo (PNG/WebP)"
            onUploaded={(img) =>
              setV({
                ...v,
                logo: {
                  kind: "image",
                  src: img.url,
                  alt: v.siteName,
                  width: img.width,
                  height: img.height,
                },
              })
            }
          />
        </fieldset>
        <SaveRow pending={pending} />
      </form>
    </AdminCard>
  );
}

// ── Contact & social ───────────────────────────────────────────────────────

export function ContactForm({
  contact,
  social,
}: {
  contact: SettingValue<"contact">;
  social: SettingValue<"social">;
}) {
  const uid = useId();
  const [c, setC] = useState(contact);
  const [s, setS] = useState(social);
  const contactSave = useSave("contact");
  const socialSave = useSave("social");
  return (
    <AdminCard title="Contact și rețele sociale">
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          contactSave.save({
            ...c,
            phone: c.phone || undefined,
            address: c.address || undefined,
            hours: c.hours || undefined,
          });
          socialSave.save({
            facebookUrl: s.facebookUrl || undefined,
            instagramUrl: s.instagramUrl || undefined,
          });
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id={`${uid}-email`}
            label="Email de contact"
            required
            error={contactSave.errors.email}
          >
            {(p) => (
              <Input
                {...p}
                type="email"
                value={c.email}
                onChange={(e) => setC({ ...c, email: e.target.value })}
              />
            )}
          </Field>
          <Field id={`${uid}-phone`} label="Telefon" error={contactSave.errors.phone}>
            {(p) => (
              <Input
                {...p}
                value={c.phone ?? ""}
                onChange={(e) => setC({ ...c, phone: e.target.value })}
              />
            )}
          </Field>
          <Field id={`${uid}-addr`} label="Adresă" error={contactSave.errors.address}>
            {(p) => (
              <Input
                {...p}
                value={c.address ?? ""}
                onChange={(e) => setC({ ...c, address: e.target.value })}
              />
            )}
          </Field>
          <Field id={`${uid}-hours`} label="Program" error={contactSave.errors.hours}>
            {(p) => (
              <Input
                {...p}
                value={c.hours ?? ""}
                onChange={(e) => setC({ ...c, hours: e.target.value })}
              />
            )}
          </Field>
          <Field
            id={`${uid}-fb`}
            label="Pagina de Facebook"
            error={socialSave.errors.facebookUrl}
            hint="Apare pe prima pagină și în subsol."
          >
            {(p) => (
              <Input
                {...p}
                type="url"
                placeholder="https://www.facebook.com/…"
                value={s.facebookUrl ?? ""}
                onChange={(e) => setS({ ...s, facebookUrl: e.target.value })}
              />
            )}
          </Field>
          <Field id={`${uid}-ig`} label="Instagram" error={socialSave.errors.instagramUrl}>
            {(p) => (
              <Input
                {...p}
                type="url"
                placeholder="https://www.instagram.com/…"
                value={s.instagramUrl ?? ""}
                onChange={(e) => setS({ ...s, instagramUrl: e.target.value })}
              />
            )}
          </Field>
        </div>
        <SaveRow pending={contactSave.pending || socialSave.pending} />
      </form>
    </AdminCard>
  );
}

// ── Email & SEO ────────────────────────────────────────────────────────────

export function EmailSeoForm({
  email,
  seo,
}: {
  email: SettingValue<"email">;
  seo: SettingValue<"seo">;
}) {
  const uid = useId();
  const [e1, setE] = useState(email);
  const [s, setS] = useState(seo);
  const emailSave = useSave("email");
  const seoSave = useSave("seo");
  return (
    <AdminCard title="Email și SEO">
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(ev) => {
          ev.preventDefault();
          emailSave.save({ senderName: e1.senderName || null, replyTo: e1.replyTo || null });
          seoSave.save({ ...s, ogImageUrl: s.ogImageUrl || null });
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id={`${uid}-sn`}
            label="Numele expeditorului"
            hint="Adresa vine din EMAIL_FROM (configurare server)."
            error={emailSave.errors.senderName}
          >
            {(p) => (
              <Input
                {...p}
                value={e1.senderName ?? ""}
                onChange={(ev) => setE({ ...e1, senderName: ev.target.value })}
              />
            )}
          </Field>
          <Field
            id={`${uid}-rt`}
            label="Răspunsurile ajung la (reply-to)"
            error={emailSave.errors.replyTo}
          >
            {(p) => (
              <Input
                {...p}
                type="email"
                value={e1.replyTo ?? ""}
                onChange={(ev) => setE({ ...e1, replyTo: ev.target.value })}
              />
            )}
          </Field>
          <Field
            id={`${uid}-dt`}
            label="Titlu implicit (prima pagină)"
            error={seoSave.errors.defaultTitle}
          >
            {(p) => (
              <Input
                {...p}
                value={s.defaultTitle}
                onChange={(ev) => setS({ ...s, defaultTitle: ev.target.value })}
              />
            )}
          </Field>
          <Field
            id={`${uid}-tt`}
            label="Șablon titlu pagini"
            hint="%s = titlul paginii"
            error={seoSave.errors.titleTemplate}
          >
            {(p) => (
              <Input
                {...p}
                value={s.titleTemplate}
                onChange={(ev) => setS({ ...s, titleTemplate: ev.target.value })}
              />
            )}
          </Field>
        </div>
        <Field
          id={`${uid}-dd`}
          label="Descriere implicită"
          hint={`${s.defaultDescription.length}/160`}
          error={seoSave.errors.defaultDescription}
        >
          {(p) => (
            <Textarea
              {...p}
              value={s.defaultDescription}
              onChange={(ev) => setS({ ...s, defaultDescription: ev.target.value })}
              className="min-h-20"
            />
          )}
        </Field>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Imagine pentru rețele sociale (1200×630)</span>
          {s.ogImageUrl ? (
            <div className="flex items-center gap-3">
              <Image
                src={s.ogImageUrl}
                alt=""
                width={240}
                height={126}
                className="rounded border border-line object-cover"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-danger"
                onClick={() => setS({ ...s, ogImageUrl: null })}
              >
                <Trash2 aria-hidden /> Elimină
              </Button>
            </div>
          ) : null}
          <ImageUpload
            purpose="og"
            label="Încarcă imaginea"
            onUploaded={(img) => setS({ ...s, ogImageUrl: img.url })}
          />
        </div>
        <SaveRow pending={emailSave.pending || seoSave.pending} />
      </form>
    </AdminCard>
  );
}

// ── Homepage ───────────────────────────────────────────────────────────────

export function HomepageForm({
  initial,
  products,
}: {
  initial: SettingValue<"homepage">;
  products: Array<{ slug: string; name: string }>;
}) {
  const uid = useId();
  const [v, setV] = useState(initial);
  const { errors, pending, save } = useSave("homepage");
  const setItem = (i: number, patch: Partial<{ slug: string; note: string }>) =>
    setV({ ...v, essentials: v.essentials.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
  return (
    <AdminCard title="Prima pagină">
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(e) => (e.preventDefault(), save(v))}
      >
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Fotografie principală (opțional)</span>
          {v.heroImage ? (
            <div className="flex flex-wrap items-end gap-3">
              <Image
                src={v.heroImage.src}
                alt={v.heroImage.alt}
                width={160}
                height={200}
                className="rounded border border-line object-cover"
              />
              <Field id={`${uid}-halt`} label="Text alternativ" error={errors["heroImage.alt"]}>
                {(p) => (
                  <Input
                    {...p}
                    value={v.heroImage!.alt}
                    onChange={(e) =>
                      setV({ ...v, heroImage: { ...v.heroImage!, alt: e.target.value } })
                    }
                  />
                )}
              </Field>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-danger"
                onClick={() => setV({ ...v, heroImage: null })}
              >
                <Trash2 aria-hidden /> Elimină
              </Button>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">
              Fără fotografie se afișează ilustrația botanică.
            </p>
          )}
          <ImageUpload
            purpose="hero"
            label="Încarcă fotografia"
            onUploaded={(img) =>
              setV({ ...v, heroImage: { src: img.url, alt: v.heroImage?.alt ?? "" } })
            }
          />
        </div>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold">Cele 5 esențiale</legend>
          {v.essentials.map((item, i) => (
            <div
              key={i}
              className="grid gap-3 rounded-lg border border-line p-3 md:grid-cols-[16rem_1fr_auto]"
            >
              <label className="sr-only" htmlFor={`${uid}-e${i}`}>
                Produsul {i + 1}
              </label>
              <select
                id={`${uid}-e${i}`}
                value={item.slug}
                onChange={(e) => setItem(i, { slug: e.target.value })}
                className={cn(adminSelect, "h-11")}
              >
                <option value="">Alege produsul</option>
                {products.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Input
                aria-label={`Nota pentru produsul ${i + 1}`}
                value={item.note}
                maxLength={160}
                onChange={(e) => setItem(i, { note: e.target.value })}
                placeholder="O frază despre aromă"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-danger"
                onClick={() => setV({ ...v, essentials: v.essentials.filter((_, j) => j !== i) })}
                aria-label={`Elimină produsul ${i + 1}`}
              >
                <Trash2 aria-hidden />
              </Button>
            </div>
          ))}
          {errors.essentials ? <p className="text-sm text-danger">{errors.essentials}</p> : null}
          {v.essentials.length < 5 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => setV({ ...v, essentials: [...v.essentials, { slug: "", note: "" }] })}
            >
              <Plus aria-hidden /> Adaugă un produs
            </Button>
          ) : null}
          <p className="text-xs text-ink-muted">
            Secțiunea apare doar cu cel puțin 3 produse active.
          </p>
        </fieldset>
        <SaveRow pending={pending} />
      </form>
    </AdminCard>
  );
}

// ── Legal, recommendations ──────────────────────────────────────────────────

export function LegalForm({ legal }: { legal: SettingValue<"legal"> }) {
  const uid = useId();
  const [l, setL] = useState(legal);
  const legalSave = useSave("legal");
  const text = (k: keyof typeof l, label: string, hint?: string) => (
    <Field id={`${uid}-${k}`} label={label} hint={hint} error={legalSave.errors[k]}>
      {(p) => (
        <Input
          {...p}
          value={(l[k] as string | null) ?? ""}
          onChange={(e) =>
            setL({ ...l, [k]: e.target.value || (k.startsWith("company") ? null : "") })
          }
        />
      )}
    </Field>
  );
  return (
    <AdminCard title="Date legale">
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          legalSave.save(l);
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {text("companyName", "Denumirea firmei")}
          {text("companyRegistration", "Nr. Registrul Comerțului")}
          {text("companyVatNumber", "CUI")}
          {text("companyAddress", "Sediul social")}
          {text("termsVersion", "Versiune termeni", "Schimb-o când modifici textul.")}
          {text("privacyPolicyVersion", "Versiune politică de confidențialitate")}
          {text(
            "cookiePolicyVersion",
            "Versiune politică de cookies",
            "O versiune nouă reafișează bannerul de cookie-uri.",
          )}
        </div>
        <SaveRow pending={legalSave.pending} />
      </form>
    </AdminCard>
  );
}

const weightLabels: Record<keyof SettingValue<"recommendation">, string> = {
  need: "Nevoie",
  aroma: "Profil aromatic",
  tag: "Etichetă",
  productType: "Tip produs",
  budgetPenalty: "Penalizare peste buget (puncte)",
  needSelection: "Greutatea unei nevoi alese pe /descopera",
  wishlistAffinity: "Afinitate: produse salvate",
  routineAffinity: "Afinitate: ritualuri salvate",
  viewedAffinity: "Afinitate: produse văzute",
};

export function RecommendationForm({ initial }: { initial: SettingValue<"recommendation"> }) {
  const uid = useId();
  const [v, setV] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(initial).map(([k, n]) => [k, String(n)])),
  );
  const { errors, pending, save } = useSave("recommendation");
  return (
    <AdminCard title="Motorul de recomandări">
      <p className="-mt-2 text-sm text-ink-muted">
        Multiplicatori globali. Greutățile fiecărui răspuns se setează în Quiz; poți verifica
        efectul în previzualizarea quiz-ului.
      </p>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => (
          e.preventDefault(),
          save(
            Object.fromEntries(Object.entries(v).map(([k, s]) => [k, Number(s.replace(",", "."))])),
          )
        )}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(weightLabels) as Array<keyof typeof weightLabels>).map((k) => (
            <Field key={k} id={`${uid}-${k}`} label={weightLabels[k]} error={errors[k]}>
              {(p) => (
                <Input
                  {...p}
                  inputMode="decimal"
                  value={v[k] ?? ""}
                  onChange={(e) => setV({ ...v, [k]: e.target.value })}
                />
              )}
            </Field>
          ))}
        </div>
        <SaveRow pending={pending} />
      </form>
    </AdminCard>
  );
}

// ── doTERRA links ─────────────────────────────────────────────────────────

export function AffiliateForm({ initial }: { initial: SettingValue<"affiliate"> }) {
  const uid = useId();
  const [hosts, setHosts] = useState(initial.allowedHosts.join("\n"));
  const [v, setV] = useState(initial);
  const { errors, pending, save } = useSave("affiliate");
  const hostsError = Object.entries(errors).find(([key]) => key.startsWith("allowedHosts"))?.[1];
  return (
    <AdminCard title="Linkuri doTERRA">
      <form
        onSubmit={(e) => (
          e.preventDefault(),
          save({
            ...v,
            allowedHosts: hosts
              .split(/\s+/)
              .map((h) => h.trim())
              .filter(Boolean),
          })
        )}
        className="flex flex-col gap-4"
        noValidate
      >
        <Field
          id={`${uid}-hosts`}
          label="Domenii permise pentru linkuri"
          required
          error={hostsError}
          hint="Câte unul pe rând, fără https://. Sunt permise și subdomeniile (ex.: www.doterra.com)."
        >
          {(p) => (
            <Textarea
              {...p}
              value={hosts}
              onChange={(e) => setHosts(e.target.value)}
              className="min-h-20 font-mono"
            />
          )}
        </Field>
        <Field
          id={`${uid}-short`}
          label="Mențiune scurtă (sub butonul de pe pagina produsului)"
          required
          error={errors.disclosureShort}
        >
          {(p) => (
            <Textarea
              {...p}
              value={v.disclosureShort}
              onChange={(e) => setV({ ...v, disclosureShort: e.target.value })}
              className="min-h-16"
            />
          )}
        </Field>
        <Field
          id={`${uid}-long`}
          label="Explicație completă (pagina „Cum cumpăr” și termeni)"
          required
          error={errors.disclosureLong}
        >
          {(p) => (
            <Textarea
              {...p}
              value={v.disclosureLong}
              onChange={(e) => setV({ ...v, disclosureLong: e.target.value })}
              className="min-h-32"
            />
          )}
        </Field>
        <SaveRow pending={pending} />
      </form>
    </AdminCard>
  );
}
