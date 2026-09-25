"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

import { DialogOverlay } from "./dialog";

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;
export const DrawerTitle = DialogPrimitive.Title;
export const DrawerDescription = DialogPrimitive.Description;

const sides = {
  right:
    "inset-y-0 right-0 h-dvh w-full max-w-md border-l data-[state=closed]:animate-slide-out-right data-[state=open]:animate-slide-in-right",
  left: "inset-y-0 left-0 h-dvh w-full max-w-md border-r data-[state=closed]:animate-slide-out-left data-[state=open]:animate-slide-in-left",
  bottom:
    "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-2xl border-t data-[state=closed]:animate-slide-out-bottom data-[state=open]:animate-slide-in-bottom",
  full: "inset-0 h-dvh w-full data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in",
} as const;

type DrawerContentProps = Omit<React.ComponentProps<typeof DialogPrimitive.Content>, "title"> & {
  side?: keyof typeof sides;
  title: React.ReactNode;
  /** Visually hide the title (it stays available to screen readers). */
  hideTitle?: boolean;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  bodyClassName?: string;
};

/** Side sheet built on Dialog: focus trap, Escape to close, scroll lock. */
export function DrawerContent({
  side = "right",
  title,
  hideTitle,
  description,
  footer,
  className,
  bodyClassName,
  children,
  ...props
}: DrawerContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 flex flex-col border-line bg-paper shadow-overlay focus:outline-none",
          sides[side],
          className,
        )}
        {...(description ? {} : { "aria-describedby": undefined })}
        {...props}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-4 px-6 pt-5 pb-4",
            hideTitle && "pb-0",
          )}
        >
          <DialogPrimitive.Title className={cn("text-2xl", hideTitle && "sr-only")}>
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close
            className="-mr-2 ml-auto grid size-10 place-items-center rounded-full text-ink-muted transition-colors hover:bg-paper-deep hover:text-ink focus-visible:outline-2 focus-visible:outline-forest"
            aria-label="Închide"
          >
            <X aria-hidden className="size-5" />
          </DialogPrimitive.Close>
        </div>
        {description ? (
          <DialogPrimitive.Description className="-mt-2 px-6 pb-3 text-sm text-ink-muted">
            {description}
          </DialogPrimitive.Description>
        ) : null}
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6",
            bodyClassName,
          )}
        >
          {children}
        </div>
        {footer ? (
          <div className="border-t border-line bg-surface px-6 py-4 pb-safe">{footer}</div>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
