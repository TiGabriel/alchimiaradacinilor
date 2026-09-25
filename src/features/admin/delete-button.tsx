"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

/** Confirmed delete for admin entities; shows the service's explanation when refused. */
export function DeleteButton({
  action,
  confirmText,
  redirectTo,
  label = "Șterge",
}: {
  action: () => Promise<{ ok: boolean; error?: string }>;
  confirmText: string;
  redirectTo?: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      loading={pending}
      className="border-danger/40 text-danger hover:bg-danger/5"
      onClick={() => {
        if (!confirm(confirmText)) return;
        start(async () => {
          const result = await action();
          if (!result.ok) {
            toast({ title: result.error ?? "Nu am putut șterge.", variant: "error" });
            return;
          }
          toast({ title: "Șters", variant: "success" });
          if (redirectTo) router.push(redirectTo);
          else router.refresh();
        });
      }}
    >
      <Trash2 aria-hidden /> {label}
    </Button>
  );
}
