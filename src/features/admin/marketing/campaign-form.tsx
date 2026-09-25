"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

import { AdminCard } from "../ui";

import { previewAudienceAction, saveCampaignAction, sendCampaignAction } from "./actions";

type Segment = {
  interests?: string[];
  sources?: string[];
  customersOnly?: boolean;
  confirmedSince?: string;
};
export type CampaignDraft = {
  subject: string;
  preheader: string;
  heading: string;
  body: string;
  segment: Segment;
};

export function CampaignForm({
  campaignId,
  initial,
  editable,
  interests,
  sources,
  emailEnabled,
}: {
  campaignId?: string;
  initial: CampaignDraft;
  editable: boolean;
  interests: Array<{ slug: string; name: string }>;
  sources: string[];
  emailEnabled: boolean;
}) {
  const uid = useId();
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [audience, setAudience] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const segmentKey = JSON.stringify(v.segment);

  useEffect(() => {
    let active = true;
    void previewAudienceAction(JSON.parse(segmentKey)).then((r) => {
      if (active && r.ok) setAudience(r.data);
    });
    return () => {
      active = false;
    };
  }, [segmentKey]);

  const toggle = (key: "interests" | "sources", value: string) => {
    const list = v.segment[key] ?? [];
    setV({
      ...v,
      segment: {
        ...v.segment,
        [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value],
      },
    });
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const segment = { ...v.segment, confirmedSince: v.segment.confirmedSince || undefined };
      const result = await saveCampaignAction(
        { ...v, preheader: v.preheader || undefined, segment },
        campaignId,
      );
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast({ title: result.error, variant: "error" });
        return;
      }
      setErrors({});
      toast({ title: result.message ?? "Salvat", variant: "success" });
      if (!campaignId) router.push(`/admin/newsletter/campanii/${result.data.id}`);
      else router.refresh();
    });
  };

  const send = () => {
    if (
      !campaignId ||
      !confirm(`Trimiți campania către ${audience ?? 0} abonați? Nu poate fi oprită după pornire.`)
    )
      return;
    start(async () => {
      const result = await sendCampaignAction(campaignId);
      if (!result.ok) {
        toast({ title: result.error, variant: "error" });
        return;
      }
      toast({
        title: `Campanie trimisă: ${result.data.delivered} livrate, ${result.data.failed} eșuate.`,
        variant: "success",
      });
      router.refresh();
    });
  };

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-6">
      <fieldset disabled={!editable} className="flex flex-col gap-6">
        <AdminCard title="Conținut">
          <Field id={`${uid}-subject`} label="Subiect" required error={errors.subject}>
            {(p) => (
              <Input
                {...p}
                value={v.subject}
                onChange={(e) => setV({ ...v, subject: e.target.value })}
              />
            )}
          </Field>
          <Field
            id={`${uid}-pre`}
            label="Text de previzualizare"
            hint="Apare lângă subiect în inbox."
            error={errors.preheader}
          >
            {(p) => (
              <Input
                {...p}
                value={v.preheader}
                onChange={(e) => setV({ ...v, preheader: e.target.value })}
              />
            )}
          </Field>
          <Field id={`${uid}-heading`} label="Titlu" required error={errors.heading}>
            {(p) => (
              <Input
                {...p}
                value={v.heading}
                onChange={(e) => setV({ ...v, heading: e.target.value })}
              />
            )}
          </Field>
          <Field
            id={`${uid}-body`}
            label="Text"
            required
            hint="Paragrafele se separă printr-un rând liber. Linkul de dezabonare se adaugă automat."
            error={errors.body}
          >
            {(p) => (
              <Textarea
                {...p}
                value={v.body}
                onChange={(e) => setV({ ...v, body: e.target.value })}
                className="min-h-64"
              />
            )}
          </Field>
        </AdminCard>
        <AdminCard title="Destinatari">
          <p className="-mt-2 text-sm text-ink-muted">
            Doar abonații care și-au confirmat adresa. Fără filtre: toți.
          </p>
          {interests.length ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-semibold">Interese (oricare)</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {interests.map((i) => (
                  <Checkbox
                    key={i.slug}
                    id={`${uid}-i-${i.slug}`}
                    checked={(v.segment.interests ?? []).includes(i.slug)}
                    onCheckedChange={() => toggle("interests", i.slug)}
                    label={i.name}
                  />
                ))}
              </div>
            </fieldset>
          ) : null}
          {sources.length ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-semibold">Sursa abonării</legend>
              <div className="flex flex-wrap gap-4">
                {sources.map((s) => (
                  <Checkbox
                    key={s}
                    id={`${uid}-s-${s}`}
                    checked={(v.segment.sources ?? []).includes(s)}
                    onCheckedChange={() => toggle("sources", s)}
                    label={s}
                  />
                ))}
              </div>
            </fieldset>
          ) : null}
          <div className="flex flex-wrap items-end gap-6">
            <Checkbox
              id={`${uid}-cust`}
              checked={v.segment.customersOnly ?? false}
              onCheckedChange={(c) =>
                setV({ ...v, segment: { ...v.segment, customersOnly: c === true } })
              }
              label="Doar clienți cu comenzi"
            />
            <Field
              id={`${uid}-since`}
              label="Confirmați din"
              error={errors["segment.confirmedSince"]}
            >
              {(p) => (
                <Input
                  {...p}
                  type="date"
                  value={v.segment.confirmedSince ?? ""}
                  onChange={(e) =>
                    setV({ ...v, segment: { ...v.segment, confirmedSince: e.target.value } })
                  }
                />
              )}
            </Field>
          </div>
          <p className="text-sm font-semibold" aria-live="polite">
            Audiență:{" "}
            {audience == null ? "…" : `${audience} ${audience === 1 ? "abonat" : "abonați"}`}
          </p>
        </AdminCard>
      </fieldset>
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap justify-end gap-3 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        {editable ? (
          <Button type="submit" variant="outline" loading={pending}>
            Salvează ciorna
          </Button>
        ) : null}
        {campaignId && editable ? (
          <Button
            type="button"
            onClick={send}
            disabled={!emailEnabled || pending || !audience}
            title={emailEnabled ? undefined : "Nu este configurat un furnizor de email"}
          >
            <Send aria-hidden /> Trimite campania
          </Button>
        ) : null}
      </div>
      {!emailEnabled ? (
        <p className="text-sm text-warning">
          Trimiterea este dezactivată: nu este configurat un furnizor de email (EMAIL_PROVIDER).
        </p>
      ) : null}
    </form>
  );
}
