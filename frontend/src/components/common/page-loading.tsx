import { AriRentMark } from "@/components/common/logo";
import { cn } from "@/lib/cn";

interface PageLoadingProps {
  label?: string;
  className?: string;
}

/**
 * Full-screen centered brand splash loader shown on initial page refresh
 * and session bootstrap.
 */
export function PageLoading({
  label = "Loading workspace…",
  className,
}: PageLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        "fixed inset-0 z-50 flex min-h-screen w-full flex-col items-center justify-center bg-app select-none",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        {/* Centered Brand Mark with subtle animated ring */}
        <div className="relative flex items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute -inset-2 rounded-[28%] border border-brand-gold/30 animate-pulse"
          />
          <AriRentMark size="lg" className="h-14 w-14 shadow-md" />
        </div>

        {/* Brand Wordmark */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-baseline gap-0.5 text-lg font-bold tracking-tight">
            <span className="text-fg">Ari</span>
            <span className="text-[#C9A24B]">Rent</span>
          </div>
          <span className="text-[11px] font-medium text-muted">{label}</span>
        </div>

        {/* Slim indeterminate progress bar */}
        <div className="mt-1 h-1 w-28 overflow-hidden rounded-full bg-edge">
          <div className="h-full w-1/2 rounded-full bg-[#C9A24B] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

