import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-lg border border-edge bg-[linear-gradient(100deg,var(--inset)_0%,var(--hover)_40%,var(--inset)_80%)] bg-[length:200%_100%]",
        className
      )}
    />
  );
}

export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-4" />
      ))}
    </div>
  );
}

export function SkeletonCards({ cards = 3, className }: { cards?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-5", className)}>
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-edge bg-card p-6 space-y-3"
        >
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}