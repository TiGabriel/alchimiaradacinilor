"use client";

import { Bookmark, BookmarkCheck, ShoppingBag } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useCart } from "@/features/cart/cart-context";

import { addRoutineToCartAction, toggleSaveRoutineAction } from "./actions";

export function AddRoutineToCartButton({
  routineId,
  className,
}: {
  routineId: string;
  className?: string;
}) {
  const { applyCart } = useCart();
  const [pending, start] = useTransition();
  return (
    <Button
      size="lg"
      className={className}
      loading={pending}
      onClick={() =>
        start(async () => {
          const result = await addRoutineToCartAction(routineId);
          if (!result.ok) {
            toast({ title: result.error, variant: "error" });
            return;
          }
          if (result.added > 0) applyCart(result.cart);
          toast({
            title:
              result.added > 0
                ? "Produsele rutinei au fost adăugate"
                : "Nu am adăugat niciun produs",
            description: result.message,
            variant: result.added > 0 ? "success" : "default",
            duration: 8000,
          });
        })
      }
    >
      <ShoppingBag aria-hidden /> Adaugă produsele rutinei în coș
    </Button>
  );
}

export function SaveRoutineButton({
  routineId,
  initiallySaved,
}: {
  routineId: string;
  initiallySaved: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="lg"
      aria-pressed={saved}
      loading={pending}
      onClick={() =>
        start(async () => {
          const result = await toggleSaveRoutineAction(routineId);
          if (!result.ok) {
            if (result.reason === "signed-out") {
              toast({
                title: "Autentifică-te pentru a salva rutina",
                action: {
                  label: "Autentificare",
                  onClick: () =>
                    router.push(`/cont/autentificare?next=${encodeURIComponent(pathname)}`),
                },
              });
            } else toast({ title: "Nu am putut salva rutina.", variant: "error" });
            return;
          }
          setSaved(result.saved);
          toast({
            title: result.saved
              ? "Rutina a fost salvată în contul tău"
              : "Rutina a fost scoasă din lista ta",
            variant: "success",
          });
        })
      }
    >
      {saved ? <BookmarkCheck aria-hidden /> : <Bookmark aria-hidden />}
      {saved ? "Salvată" : "Salvează rutina"}
    </Button>
  );
}
