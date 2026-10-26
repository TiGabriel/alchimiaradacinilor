"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

import { toggleSaveRoutineAction } from "./actions";

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
                title: "Autentifică-te pentru a salva ritualul",
                action: {
                  label: "Autentificare",
                  onClick: () =>
                    router.push(`/cont/autentificare?next=${encodeURIComponent(pathname)}`),
                },
              });
            } else toast({ title: "Nu am putut salva ritualul.", variant: "error" });
            return;
          }
          setSaved(result.saved);
          toast({
            title: result.saved
              ? "Ritualul a fost salvat în contul tău"
              : "Ritualul a fost scos din lista ta",
            variant: "success",
          });
        })
      }
    >
      {saved ? <BookmarkCheck aria-hidden /> : <Bookmark aria-hidden />}
      {saved ? "Salvat" : "Salvează ritualul"}
    </Button>
  );
}
