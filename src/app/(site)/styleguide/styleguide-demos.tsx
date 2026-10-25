"use client";

import { ArrowRight, Bookmark, Heart, Leaf as LeafIcon, Moon, Sunrise } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  Blossom,
  Leaf,
  ROOT_PATHS,
  Roots,
  SectionDivider,
  Sprig,
  SPRIG_PATHS,
} from "@/components/botanical";
import { ImagePlaceholder } from "@/components/media/image-placeholder";
import { SmartImage } from "@/components/media/smart-image";
import {
  BotanicalFloat,
  DrawLine,
  HoverScale,
  Parallax,
  Reveal,
  Stagger,
  StaggerItem,
} from "@/components/motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Price } from "@/components/ui/price";
import { RadioCards } from "@/components/ui/radio-cards";
import { RatingStars } from "@/components/ui/rating-stars";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-28 border-t border-line py-12"
    >
      <h2 id={`${id}-title`} className="mb-8 text-display-md">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      <p className="text-eyebrow text-ink-muted">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

const variants = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "accent",
  "subtle",
  "danger",
  "link",
] as const;

export function StyleguideDemos() {
  const [moment, setMoment] = useState("dimineata");
  const [sort, setSort] = useState("recomandate");
  const [agree, setAgree] = useState<boolean | "indeterminate">(false);

  return (
    <>
      <Section id="butoane" title="Butoane">
        <Row label="Variante">
          {variants.map((v) => (
            <Button key={v} variant={v}>
              {v}
            </Button>
          ))}
        </Row>
        <Row label="Mărimi">
          <Button size="sm">Mic</Button>
          <Button size="md">Mediu</Button>
          <Button size="lg">Mare</Button>
          <Button size="icon" variant="outline" aria-label="Favorite">
            <Heart aria-hidden />
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Salvează">
            <Bookmark aria-hidden />
          </Button>
        </Row>
        <Row label="Stări">
          <Button loading>Se salvează</Button>
          <Button disabled>Indisponibil</Button>
          <Button variant="outline" loading>
            Se încarcă
          </Button>
          <Button asChild variant="secondary">
            <Link href="/produse">
              Ca link <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button block className="max-w-xs">
            Lățime completă
          </Button>
        </Row>
      </Section>

      <Section id="formulare" title="Formulare">
        <div className="grid max-w-3xl gap-6 md:grid-cols-2">
          <Field id="sg-name" label="Nume" hint="Așa cum vrei să apară la recenzii." required>
            {(p) => <Input {...p} placeholder="Ana Popescu" />}
          </Field>
          <Field id="sg-email" label="Email" error="Introdu o adresă de email validă.">
            {(p) => <Input {...p} type="email" defaultValue="ana@" />}
          </Field>
          <Field id="sg-sort" label="Sortare">
            {(p) => (
              <Select
                id={p.id}
                aria-describedby={p["aria-describedby"]}
                value={sort}
                onValueChange={setSort}
                options={[
                  { value: "recomandate", label: "Recomandate" },
                  { value: "noi", label: "Cele mai noi" },
                  { value: "pret-crescator", label: "Preț crescător" },
                  { value: "pret-descrescator", label: "Preț descrescător" },
                  { value: "rating", label: "Rating" },
                ]}
              />
            )}
          </Field>
          <Field id="sg-disabled" label="Câmp dezactivat">
            {(p) => <Input {...p} disabled value="Nu se poate edita" readOnly />}
          </Field>
          <Field id="sg-note" label="Mesaj" className="md:col-span-2">
            {(p) => <Textarea {...p} placeholder="Scrie-ne câteva cuvinte…" />}
          </Field>
          <div className="flex flex-col gap-4 md:col-span-2">
            <Checkbox
              id="sg-agree"
              checked={agree}
              onCheckedChange={setAgree}
              label="Sunt de acord cu termenii și condițiile"
              description="Poți citi documentul complet oricând."
            />
            <Checkbox id="sg-indeterminate" checked="indeterminate" label="Stare nedeterminată" />
            <Checkbox id="sg-disabled-check" disabled label="Opțiune dezactivată" />
          </div>
          <div className="md:col-span-2">
            <p className="mb-3 text-sm font-semibold">Carduri radio</p>
            <RadioCards
              aria-label="Momentul zilei"
              value={moment}
              onValueChange={setMoment}
              columns={2}
              options={[
                {
                  value: "dimineata",
                  title: "Dimineață",
                  description: "Arome luminoase, citrice",
                  icon: <Sunrise aria-hidden className="size-5" />,
                  aside: "3 ritualuri",
                },
                {
                  value: "seara",
                  title: "Seară",
                  description: "Arome calde, florale",
                  icon: <Moon aria-hidden className="size-5" />,
                  aside: "5 ritualuri",
                },
                {
                  value: "noapte",
                  title: "Noapte",
                  description: "În curând",
                  disabled: true,
                },
              ]}
            />
          </div>
        </div>
      </Section>

      <Section id="insigne" title="Insigne">
        <Row label="Variante">
          <Badge>Neutru</Badge>
          <Badge variant="forest">Nou</Badge>
          <Badge variant="sage">Popular</Badge>
          <Badge variant="clay">Recenzie</Badge>
          <Badge variant="clay-soft">Ritual</Badge>
          <Badge variant="ochre">Ediție limitată</Badge>
          <Badge variant="outline">Contur</Badge>
          <Badge variant="success">Publicată</Badge>
          <Badge variant="warning">În moderare</Badge>
          <Badge variant="danger">Respinsă</Badge>
          <Badge variant="sage" size="sm">
            <LeafIcon aria-hidden /> Mic
          </Badge>
        </Row>
      </Section>

      <Section id="carduri" title="Carduri">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Card simplu</CardTitle>
              <CardDescription>Cu titlu, descriere și acțiuni.</CardDescription>
            </CardHeader>
            <CardContent className="text-ink-muted">Conținutul cardului stă aici.</CardContent>
            <CardFooter>
              <Button size="sm">Acțiune</Button>
              <Button size="sm" variant="ghost">
                Anulează
              </Button>
            </CardFooter>
          </Card>
          <Card interactive className="overflow-hidden">
            <ImagePlaceholder kind="bottle" tone="#E3B23C" className="aspect-[4/3]" />
            <CardContent>
              <p className="font-display text-xl">Card interactiv</p>
              <p className="text-sm text-ink-muted">Se ridică ușor la hover.</p>
            </CardContent>
          </Card>
          <Card className="bg-forest text-ink-inverse">
            <CardContent className="flex h-full flex-col justify-between gap-6">
              <p className="font-display text-2xl text-ink-inverse">Card de accent</p>
              <Button variant="subtle" size="sm" className="self-start">
                Descoperă
              </Button>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section id="suprapuneri" title="Dialog, sertar, notificări">
        <Row label="Deschide">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Un dialog elegant</DialogTitle>
                <DialogDescription>
                  Focusul rămâne în dialog; Esc sau clic în afară îl închide.
                </DialogDescription>
              </DialogHeader>
              <p className="text-ink-muted">Conținutul dialogului.</p>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Anulează</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button>Confirmă</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">Sertar dreapta</Button>
            </DrawerTrigger>
            <DrawerContent
              title="Favoritele tale"
              description="Exemplu de sertar lateral."
              footer={<Button block>Vezi toate favoritele</Button>}
            >
              <EmptyState
                size="sm"
                title="Nu ai încă favorite"
                description="Salvează produse pentru a le vedea aici."
              />
            </DrawerContent>
          </Drawer>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">Sertar jos</Button>
            </DrawerTrigger>
            <DrawerContent side="bottom" title="Filtre">
              <p className="text-ink-muted">Pe mobil, filtrele se deschid de jos.</p>
            </DrawerContent>
          </Drawer>
          <Button
            variant="secondary"
            onClick={() => toast({ title: "Produs salvat la favorite", variant: "success" })}
          >
            Toast succes
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast({
                title: "Ceva nu a mers",
                description: "Te rugăm să încerci din nou.",
                variant: "error",
              })
            }
          >
            Toast eroare
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast({
                title: "Eliminat din favorite",
                action: { label: "Anulează", onClick: () => toast({ title: "Readăugat" }) },
              })
            }
          >
            Toast cu acțiune
          </Button>
        </Row>
      </Section>

      <Section id="tab-uri" title="Tab-uri și acordeon">
        <div className="grid gap-10 md:grid-cols-2">
          <Tabs defaultValue="descriere">
            <TabsList aria-label="Detalii produs">
              <TabsTrigger value="descriere">Descriere</TabsTrigger>
              <TabsTrigger value="utilizare">Utilizare</TabsTrigger>
              <TabsTrigger value="siguranta">Siguranță</TabsTrigger>
            </TabsList>
            <TabsContent value="descriere" className="text-ink-muted">
              O aromă florală, rotundă, ca un câmp de lavandă la apus.
            </TabsContent>
            <TabsContent value="utilizare" className="text-ink-muted">
              Recomandările de utilizare vin din documentația producătorului.
            </TabsContent>
            <TabsContent value="siguranta" className="text-ink-muted">
              Citește întotdeauna eticheta produsului.
            </TabsContent>
          </Tabs>
          <Accordion type="single" collapsible defaultValue="a">
            <AccordionItem value="a">
              <AccordionTrigger>Cum aleg primul ulei?</AccordionTrigger>
              <AccordionContent>
                Pornește de la aromele care îți plac: citrice, florale sau mentolate.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="b">
              <AccordionTrigger>De unde cumpăr produsele?</AccordionTrigger>
              <AccordionContent>
                De pe site-ul oficial doTERRA, la prețul afișat acolo.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </Section>

      <Section id="produs" title="Elemente de produs">
        <Row label="Rating">
          <RatingStars value={4.6} count={128} showValue />
          <RatingStars value={3.2} size="lg" />
          <RatingStars value={5} count={1} size="sm" />
          <RatingStars value={null} />
        </Row>
        <Row label="Preț">
          <Price price={4900} />
          <Price price={21900} size="xl" />
          <Price price={6900} size="sm" />
        </Row>
      </Section>

      <Section id="stari" title="Stări">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="flex flex-col gap-3">
            <Skeleton className="aspect-[4/5] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <div className="grid place-items-center rounded-lg border border-dashed border-line-strong">
            <Spinner className="size-8 text-forest" />
          </div>
          <EmptyState
            size="sm"
            title="Încă nu ai produse favorite."
            description="Apasă pe inimioară pentru a salva produsele care îți plac."
            actions={
              <Button asChild size="sm">
                <Link href="/produse">Descoperă produse</Link>
              </Button>
            }
          />
        </div>
      </Section>

      <Section id="imagini" title="Imagini">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          {(["bottle", "kit", "diffuser", "accessory", "leaf"] as const).map((kind, i) => (
            <div key={kind} className="flex flex-col gap-2">
              <ImagePlaceholder
                kind={kind}
                tone={["#E3B23C", "#B98BB3", "#6FB3A0", "#8A6A4F", null][i]}
                className="aspect-[4/5] rounded-lg"
              />
              <span className="text-xs text-ink-muted">{kind}</span>
            </div>
          ))}
          <div className="flex flex-col gap-2">
            <SmartImage
              src="/imagine-inexistenta.jpg"
              alt="Imagine lipsă (fallback)"
              aspect="portrait"
              wrapperClassName="rounded-lg"
            />
            <span className="text-xs text-ink-muted">sursă invalidă → fallback</span>
          </div>
        </div>
      </Section>

      <Section id="botanic" title="Motive botanice">
        <div className="flex flex-wrap items-end gap-10 text-sage">
          <Sprig className="h-32" />
          <Leaf className="size-16" />
          <Blossom className="size-16 text-clay/60" />
          <Roots className="w-56" />
        </div>
        <div className="mt-10 flex flex-col gap-8">
          <SectionDivider />
          <SectionDivider variant="wave" />
          <SectionDivider variant="line" />
        </div>
      </Section>

      <Section id="animatii" title="Animații">
        <p className="mb-6 max-w-2xl text-ink-muted">
          Toate animațiile respectă setarea „reduce motion” a sistemului: conținutul apare imediat,
          fără deplasare.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          <Reveal className="rounded-lg bg-surface p-6 shadow-soft">
            <p className="font-display text-xl">Reveal</p>
            <p className="text-sm text-ink-muted">Fade + translate la intrarea în ecran.</p>
          </Reveal>
          <HoverScale className="rounded-lg bg-forest-soft p-6">
            <p className="font-display text-xl">HoverScale</p>
            <p className="text-sm text-ink-muted">Treci cu mouse-ul peste mine.</p>
          </HoverScale>
          <div className="relative h-40 overflow-hidden rounded-lg bg-paper-deep">
            <Parallax className="absolute inset-0" offset={60}>
              <div className="grid h-full place-items-center">
                <Sprig className="h-28" />
              </div>
            </Parallax>
            <span className="absolute bottom-3 left-4 text-sm font-semibold">Parallax</span>
          </div>
        </div>
        <Stagger className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {["Unu", "Doi", "Trei", "Patru"].map((label) => (
            <StaggerItem
              key={label}
              className="rounded-lg border border-line bg-surface p-4 text-center font-semibold"
            >
              Stagger · {label}
            </StaggerItem>
          ))}
        </Stagger>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="relative grid h-48 place-items-center overflow-hidden rounded-lg bg-paper-deep">
            <BotanicalFloat className="w-20" drift={14} sway={6}>
              <Leaf className="w-full text-forest/60" />
            </BotanicalFloat>
            <span className="absolute bottom-3 left-4 text-sm font-semibold">BotanicalFloat</span>
          </div>
          <div className="relative grid h-48 place-items-center overflow-hidden rounded-lg bg-paper-deep">
            <div className="flex gap-6">
              <DrawLine d={SPRIG_PATHS} viewBox="0 0 120 160" className="h-36 text-forest" />
              <DrawLine d={ROOT_PATHS} viewBox="0 0 200 140" className="h-28 text-forest/70" />
            </div>
            <span className="absolute bottom-3 left-4 text-sm font-semibold">DrawLine</span>
          </div>
        </div>
      </Section>
    </>
  );
}
