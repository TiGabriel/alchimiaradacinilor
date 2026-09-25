import { ArrowRight, ClipboardList, Heart, Mail, Moon, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ProductImage } from "@/components/media/product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/features/account/section";
import { requireUser } from "@/features/auth/session";
import { formatMoney } from "@/lib/money";
import { pluralRo } from "@/lib/plural";
import { getAccountOverview } from "@/services/account/overview";
import { productHref } from "@/services/catalog/product-types";

export const metadata: Metadata = { title: "Contul meu", robots: { index: false, follow: false } };

function Empty({
  icon: Icon,
  text,
  cta,
}: {
  icon: typeof Heart;
  text: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      <span className="grid size-10 place-items-center rounded-full bg-forest-soft text-forest">
        <Icon aria-hidden className="size-4" />
      </span>
      <p className="text-ink-muted">{text}</p>
      <Button asChild variant="outline" size="sm">
        <Link href={cta.href}>{cta.label}</Link>
      </Button>
    </div>
  );
}

const dateFormat = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function AccountOverviewPage(props: PageProps<"/cont">) {
  const { user } = await requireUser("/cont");
  const overview = await getAccountOverview(user.id);
  const params = await props.searchParams;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-eyebrow text-clay">Contul meu</p>
        <h1 className="text-display-lg">Salut, {user.firstName}</h1>
        <p className="text-ink-muted">Aici găsești comenzile, favoritele și recomandările tale.</p>
      </header>

      {params["bun-venit"] ? (
        <p role="status" className="rounded-lg bg-success-soft p-4 text-sm text-success">
          Contul tău a fost creat. Ți-am trimis un email pentru confirmarea adresei.
        </p>
      ) : null}
      {params["email-netrimis"] ? (
        <p role="alert" className="rounded-lg bg-warning-soft p-4 text-sm text-warning">
          Contul tău a fost creat, dar momentan nu am putut trimite emailul de confirmare. Poți cere
          unul nou mai jos, puțin mai târziu.
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <AccountCard
          title="Comanda recentă"
          action={
            overview.recentOrder ? (
              <Link href="/cont/comenzi" className="text-sm font-semibold text-forest">
                Toate comenzile
              </Link>
            ) : undefined
          }
        >
          {overview.recentOrder ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="font-semibold">Comanda {overview.recentOrder.number}</span>
                <span className="text-sm text-ink-muted">
                  {dateFormat.format(overview.recentOrder.placedAt)} ·{" "}
                  {pluralRo(overview.recentOrder._count.items, "produs", "produse")}
                </span>
              </div>
              <span className="font-semibold">{formatMoney(overview.recentOrder.total)}</span>
            </div>
          ) : (
            <Empty
              icon={ClipboardList}
              text="Nu ai plasat încă nicio comandă."
              cta={{ href: "/produse", label: "Descoperă produsele" }}
            />
          )}
        </AccountCard>

        <AccountCard
          title="Produse salvate"
          action={
            overview.savedCount ? (
              <Link href="/cont/favorite" className="text-sm font-semibold text-forest">
                Vezi toate ({overview.savedCount})
              </Link>
            ) : undefined
          }
        >
          {overview.savedProducts.length ? (
            <ul className="grid grid-cols-4 gap-3">
              {overview.savedProducts.map((p) => (
                <li key={p.id}>
                  <Link href={productHref(p)} className="flex flex-col gap-1.5">
                    <span className="overflow-hidden rounded-md">
                      <ProductImage
                        name={p.name}
                        productType={p.productType}
                        image={p.images[0]}
                        tone={p.tone}
                        aspect="square"
                        sizes="96px"
                      />
                    </span>
                    <span className="truncate text-sm font-semibold">{p.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty
              icon={Heart}
              text="Încă nu ai produse favorite."
              cta={{ href: "/produse", label: "Descoperă produsele" }}
            />
          )}
        </AccountCard>

        <AccountCard title="Ultima recomandare">
          {overview.latestQuiz?.product ? (
            <Link
              href={productHref(overview.latestQuiz.product)}
              className="flex items-center gap-4"
            >
              <span className="w-20 shrink-0 overflow-hidden rounded-md">
                <ProductImage
                  name={overview.latestQuiz.product.name}
                  productType={overview.latestQuiz.product.productType}
                  image={overview.latestQuiz.product.images[0]}
                  tone={overview.latestQuiz.product.tone}
                  aspect="square"
                  sizes="80px"
                />
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-display text-lg">{overview.latestQuiz.product.name}</span>
                {overview.latestQuiz.reason ? (
                  <span className="text-sm text-ink-muted">{overview.latestQuiz.reason}</span>
                ) : null}
              </span>
            </Link>
          ) : (
            <Empty
              icon={Sparkles}
              text="Fă quiz-ul ca să descoperi de unde să începi."
              cta={{ href: "/quiz", label: "Începe quiz-ul" }}
            />
          )}
        </AccountCard>

        <AccountCard title="Rutină salvată">
          {overview.savedRoutine ? (
            <Link href={`/rutine/${overview.savedRoutine.slug}`} className="flex flex-col gap-1">
              <span className="font-display text-lg">{overview.savedRoutine.title}</span>
              <span className="text-sm text-ink-muted">{overview.savedRoutine.summary}</span>
            </Link>
          ) : (
            <Empty
              icon={Moon}
              text="Nu ai salvat încă nicio rutină."
              cta={{ href: "/rutine", label: "Vezi rutinele" }}
            />
          )}
        </AccountCard>

        <AccountCard title="Newsletter" className="xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="flex items-center gap-3">
              <Mail aria-hidden className="size-5 text-forest" />
              {overview.newsletter.subscribed ? (
                <>Ești abonat la scrisorile noastre botanice.</>
              ) : overview.newsletter.status === "PENDING" ? (
                <>Abonarea se activează după confirmarea adresei de email.</>
              ) : (
                <>Nu ești abonat la newsletter.</>
              )}
              <Badge variant={overview.newsletter.subscribed ? "success" : "neutral"} size="sm">
                {overview.newsletter.subscribed
                  ? "Abonat"
                  : overview.newsletter.status === "PENDING"
                    ? "În așteptare"
                    : "Neabonat"}
              </Badge>
            </p>
            <Button asChild variant="link">
              <Link href="/cont/newsletter">
                Gestionează preferințele <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </AccountCard>
      </div>
    </div>
  );
}
