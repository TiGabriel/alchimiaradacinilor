"use client";

import { RadioGroup } from "radix-ui";

import { cn } from "@/lib/utils";

export type RadioCardOption = {
  value: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  aside?: React.ReactNode;
  disabled?: boolean;
};

type RadioCardsProps = Omit<React.ComponentProps<typeof RadioGroup.Root>, "children"> & {
  options: RadioCardOption[];
  columns?: 1 | 2 | 3;
};

/** Selectable cards (radio semantics, arrow-key navigation). */
export function RadioCards({ options, columns = 1, className, ...props }: RadioCardsProps) {
  return (
    <RadioGroup.Root
      className={cn(
        "grid gap-3",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-3",
        className,
      )}
      {...props}
    >
      {options.map((option) => (
        <RadioGroup.Item
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          className="group relative flex w-full items-start gap-3 rounded-lg border border-line bg-surface p-4 text-left shadow-xs transition-[border-color,box-shadow,background-color] duration-200 hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-forest data-[state=checked]:bg-forest-soft/50 data-[state=checked]:shadow-soft"
        >
          <span
            aria-hidden
            className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-line-strong bg-surface transition-colors group-data-[state=checked]:border-forest"
          >
            <RadioGroup.Indicator className="size-2.5 rounded-full bg-forest data-[state=checked]:animate-fade-in" />
          </span>
          {option.icon ? <span className="text-forest">{option.icon}</span> : null}
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="font-semibold text-ink">{option.title}</span>
            {option.description ? (
              <span className="text-sm text-ink-muted">{option.description}</span>
            ) : null}
          </span>
          {option.aside ? (
            <span className="shrink-0 text-sm font-semibold text-ink">{option.aside}</span>
          ) : null}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
