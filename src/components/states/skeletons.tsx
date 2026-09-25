import { Skeleton } from "@/components/ui/skeleton";

/** Loading templates, announced once to assistive tech. */

function Announce() {
  return (
    <span role="status" className="sr-only">
      Se încarcă…
    </span>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[4/5] w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-5 w-1/3" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-12 md:py-16">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-10 w-2/3 max-w-xl" />
      <Skeleton className="h-4 w-full max-w-lg" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="container-page pb-16">
      <Announce />
      <PageHeaderSkeleton />
      <ProductGridSkeleton />
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="container-page grid gap-10 py-10 lg:grid-cols-2 lg:gap-16">
      <Announce />
      <Skeleton className="aspect-[4/5] w-full rounded-xl" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}
