import { Roots, Sprig } from "@/components/botanical";
import { BotanicalFloat } from "@/components/motion";

/** Split layout for sign-in/up pages: form on one side, a quiet botanical panel on the other. */
export function AuthShell({
  eyebrow,
  title,
  intro,
  children,
  aside,
}: {
  eyebrow: string;
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="container-page grid gap-10 py-10 md:py-16 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-eyebrow text-clay">{eyebrow}</p>
          <h1 className="text-display-lg">{title}</h1>
          {intro ? <div className="text-ink-muted">{intro}</div> : null}
        </div>
        {children}
      </div>
      <aside
        aria-hidden={aside ? undefined : true}
        className="relative hidden min-h-[32rem] overflow-hidden rounded-2xl bg-forest p-10 text-ink-inverse lg:flex lg:flex-col lg:justify-end"
      >
        <BotanicalFloat className="absolute top-10 right-10 w-40" drift={12}>
          <Sprig className="w-full text-ink-inverse/30" />
        </BotanicalFloat>
        <Roots className="absolute -bottom-6 -left-10 w-[28rem] text-ink-inverse/10" />
        <div className="relative flex flex-col gap-3">
          {aside ?? (
            <>
              <p className="font-display text-3xl leading-snug text-ink-inverse">
                Ritualurile tale, favoritele și comenzile — într-un singur loc.
              </p>
              <p className="text-ink-inverse/75">
                Salvează produsele preferate, rezultatele quiz-ului și adresele de livrare.
              </p>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
