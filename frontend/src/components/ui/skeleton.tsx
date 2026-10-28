import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-hover border border-edge/60", className)}
    />
  );
}

export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-5 w-full" />
      ))}
    </div>
  );
}

export function SkeletonCards({ cards = 3, className }: { cards?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5", className)}>
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-edge bg-card p-6 space-y-3.5 shadow-soft"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
      ))}
    </div>
  );
}

/** Full-page shell fallback used during Suspense route chunk downloads */
export function PageShellSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in" aria-busy="true" aria-label="Loading page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      <SkeletonCards cards={3} />

      <div className="rounded-2xl border border-edge bg-card p-6 space-y-4 shadow-soft">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <SkeletonRows rows={5} />
      </div>
    </div>
  );
}