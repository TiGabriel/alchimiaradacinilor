import { cn } from "@/lib/utils";

export function AccountHeader({
  title,
  description,
  eyebrow,
}: {
  title: string;
  description?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="flex flex-col gap-2">
      {eyebrow ? <p className="text-eyebrow text-clay">{eyebrow}</p> : null}
      <h1 className="text-display-md">{title}</h1>
      {description ? <p className="max-w-2xl text-ink-muted">{description}</p> : null}
    </header>
  );
}

export function AccountCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("flex flex-col gap-4 rounded-xl border border-line bg-surface p-6", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
