"use client";

import { Check, Minus } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

type CheckboxProps = React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  label?: React.ReactNode;
  description?: React.ReactNode;
};

export function Checkbox({ className, label, description, id, ...props }: CheckboxProps) {
  const box = (
    <CheckboxPrimitive.Root
      id={id}
      className={cn(
        "peer grid size-5 shrink-0 place-items-center rounded-xs border border-line-strong bg-surface text-ink-inverse shadow-xs transition-colors hover:border-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-forest data-[state=checked]:bg-forest data-[state=indeterminate]:border-forest data-[state=indeterminate]:bg-forest",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="data-[state=checked]:animate-fade-in">
        {props.checked === "indeterminate" ? (
          <Minus aria-hidden className="size-3.5" strokeWidth={3} />
        ) : (
          <Check aria-hidden className="size-3.5" strokeWidth={3} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!label) return box;

  return (
    <div className="flex items-start gap-3">
      <div className="pt-0.5">{box}</div>
      <label
        htmlFor={id}
        className="cursor-pointer text-[0.9375rem] leading-snug text-ink peer-disabled:cursor-not-allowed"
      >
        {label}
        {description ? (
          <span className="mt-0.5 block text-sm text-ink-muted">{description}</span>
        ) : null}
      </label>
    </div>
  );
}
