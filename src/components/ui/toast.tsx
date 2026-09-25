"use client";

import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error";

export type ToastOptions = {
  title: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  action?: { label: string; onClick: () => void };
  /** ms; defaults to 5000. */
  duration?: number;
};

type ToastItem = ToastOptions & { id: number; open: boolean };

// Tiny external store so `toast()` can be called from anywhere on the client.
let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(options: ToastOptions): number {
  const id = nextId++;
  items = [...items.slice(-3), { ...options, id, open: true }];
  emit();
  return id;
}

function setOpen(id: number, open: boolean) {
  items = items.map((t) => (t.id === id ? { ...t, open } : t));
  emit();
  if (!open) {
    // Let the exit animation play before removing.
    setTimeout(() => {
      items = items.filter((t) => t.id !== id);
      emit();
    }, 250);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => items;
const getServerSnapshot = (): ToastItem[] => [];

const icons = {
  default: <Info aria-hidden className="size-5 text-forest" />,
  success: <CheckCircle2 aria-hidden className="size-5 text-success" />,
  error: <TriangleAlert aria-hidden className="size-5 text-danger" />,
} satisfies Record<ToastVariant, React.ReactNode>;

/** Mount once (root layout). Bottom-centre on mobile (above the bottom nav), bottom-right on desktop. */
export function Toaster() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <ToastPrimitive.Provider swipeDirection="right" label="Notificări">
      {toasts.map((t) => (
        <ToastPrimitive.Root
          key={t.id}
          open={t.open}
          onOpenChange={(open) => setOpen(t.id, open)}
          duration={t.duration ?? 5000}
          type={t.variant === "error" ? "foreground" : "background"}
          className={cn(
            "flex w-full items-start gap-3 rounded-lg border border-line bg-surface p-4 shadow-lifted data-[state=closed]:animate-toast-out data-[state=open]:animate-toast-in data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform data-[swipe=end]:translate-x-(--radix-toast-swipe-end-x) data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x)",
          )}
        >
          <span className="mt-0.5">{icons[t.variant ?? "default"]}</span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <ToastPrimitive.Title className="font-semibold text-ink">
              {t.title}
            </ToastPrimitive.Title>
            {t.description ? (
              <ToastPrimitive.Description className="text-sm text-ink-muted">
                {t.description}
              </ToastPrimitive.Description>
            ) : null}
            {t.action ? (
              <ToastPrimitive.Action
                altText={t.action.label}
                onClick={t.action.onClick}
                className="mt-2 self-start text-sm font-semibold text-forest underline underline-offset-4 hover:text-forest-deep"
              >
                {t.action.label}
              </ToastPrimitive.Action>
            ) : null}
          </div>
          <ToastPrimitive.Close
            aria-label="Închide notificarea"
            className="-m-1 grid size-8 place-items-center rounded-full text-ink-muted hover:bg-paper-deep hover:text-ink"
          >
            <X aria-hidden className="size-4" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[60] mx-auto flex w-full max-w-sm flex-col gap-2 px-4 outline-none md:right-6 md:bottom-6 md:left-auto md:mx-0 md:px-0" />
    </ToastPrimitive.Provider>
  );
}
