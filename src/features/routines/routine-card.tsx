import { Clock, Moon, Sun, Sunrise, Sparkles } from "lucide-react";
import Link from "next/link";

import { ImagePlaceholder } from "@/components/media/image-placeholder";
import { SmartImage } from "@/components/media/smart-image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { timeOfDayLabels, type RoutineCardData } from "@/services/routines/routines";

const timeIcon = { MORNING: Sunrise, DAY: Sun, EVENING: Moon, ANYTIME: Sparkles } as const;

export function RoutineCard({
  routine,
  reason,
  className,
}: {
  routine: RoutineCardData;
  reason?: string | null;
  className?: string;
}) {
  const Icon = timeIcon[routine.timeOfDay];
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-xs transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-lifted motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {routine.image ? (
          <SmartImage
            src={routine.image.url}
            alt={routine.image.alt ?? routine.title}
            aspect="auto"
            wrapperClassName="size-full"
            sizes="(min-width: 1024px) 33vw, 100vw"
          />
        ) : (
          <ImagePlaceholder
            kind="leaf"
            tone={
              routine.timeOfDay === "MORNING"
                ? "#E3B23C"
                : routine.timeOfDay === "EVENING"
                  ? "#B98BB3"
                  : "#8FB58A"
            }
          />
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge variant="neutral" size="sm" className="bg-surface/90">
            <Icon aria-hidden /> {timeOfDayLabels[routine.timeOfDay]}
          </Badge>
          {routine.isDemo ? (
            <Badge variant="demo" size="sm">
              Demo
            </Badge>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-xl">
          <Link
            href={`/rutine/${routine.slug}`}
            className="after:absolute after:inset-0 hover:text-forest"
          >
            {routine.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm text-ink-muted">{routine.summary}</p>
        {reason ? <p className="text-xs text-forest-deep">{reason}</p> : null}
        <p className="mt-auto flex items-center gap-3 pt-2 text-xs font-semibold text-ink-muted">
          {routine.durationMinutes ? (
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden className="size-3.5" /> {routine.durationMinutes} min
            </span>
          ) : null}
          <span>{routine.productCount === 1 ? "1 produs" : `${routine.productCount} produse`}</span>
        </p>
      </div>
    </article>
  );
}
