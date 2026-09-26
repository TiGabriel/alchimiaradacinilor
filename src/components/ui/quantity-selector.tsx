"use client";

import { Minus, Plus } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";

type QuantitySelectorProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  /** Usually the available stock. */
  max?: number;
  size?: "sm" | "md";
  disabled?: boolean;
  label?: string;
  className?: string;
};

export function clampQuantity(value: number, min: number, max: number | undefined) {
  if (!Number.isFinite(value)) return min;
  const whole = Math.trunc(value);
  return Math.max(min, max == null ? whole : Math.min(max, whole));
}

/** − [n] + stepper. Typing is allowed; the value is clamped on blur/Enter. */
export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max,
  size = "md",
  disabled,
  label = "Cantitate",
  className,
}: QuantitySelectorProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const atMin = value <= min;
  const atMax = max != null && value >= max;

  const commit = (raw: string) => {
    setDraft(null);
    const next = clampQuantity(Number(raw), min, max);
    if (next !== value) onChange(next);
  };

  const buttonClass =
    "grid h-full shrink-0 place-items-center text-ink transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-forest disabled:cursor-not-allowed disabled:text-ink-muted/40 disabled:hover:bg-transparent";

  return (
    <div
      className={cn(
        "inline-flex items-center overflow-hidden rounded-full border border-line-strong bg-surface",
        // The input hides its own outline (it would be clipped); the pill shows focus instead.
        "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-forest",
        size === "md" ? "h-11" : "h-9",
        disabled && "opacity-60",
        className,
      )}
    >
      <button
        type="button"
        className={cn(buttonClass, size === "md" ? "w-11" : "w-9")}
        onClick={() => onChange(clampQuantity(value - 1, min, max))}
        disabled={disabled || atMin}
        aria-label="Scade cantitatea"
      >
        <Minus aria-hidden className="size-4" />
      </button>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        inputMode="numeric"
        pattern="[0-9]*"
        className={cn(
          "h-full min-w-0 bg-transparent text-center font-semibold text-ink tabular-nums focus-visible:outline-none",
          size === "md" ? "w-10" : "w-8 text-sm",
        )}
        value={draft ?? String(value)}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(e.currentTarget.value);
        }}
        aria-describedby={atMax ? `${id}-max` : undefined}
      />
      <button
        type="button"
        className={cn(buttonClass, size === "md" ? "w-11" : "w-9")}
        onClick={() => onChange(clampQuantity(value + 1, min, max))}
        disabled={disabled || atMax}
        aria-label="Crește cantitatea"
      >
        <Plus aria-hidden className="size-4" />
      </button>
      {atMax ? (
        <span id={`${id}-max`} className="sr-only">
          Ai atins cantitatea maximă disponibilă.
        </span>
      ) : null}
    </div>
  );
}
