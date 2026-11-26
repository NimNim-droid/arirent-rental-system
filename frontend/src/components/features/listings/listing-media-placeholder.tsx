import { Building2, DoorOpen } from "lucide-react";
import { cn } from "@/lib/cn";

interface ListingMediaPlaceholderProps {
  label?: string;
  kind?: "property" | "room";
  className?: string;
}

/**
 * Clean architectural blueprint placeholder rendered when a building or unit
 * has no uploaded photos yet. Avoids stock imagery so listings stay truthful.
 */
export function ListingMediaPlaceholder({
  label,
  kind = "property",
  className,
}: ListingMediaPlaceholderProps) {
  const Icon = kind === "room" ? DoorOpen : Building2;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden bg-inset text-muted select-none",
        className
      )}
    >
      {/* Subtle architectural grid lines */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.35] dark:opacity-[0.18]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="arirent-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path
              d="M 28 0 L 0 0 0 28"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.6"
              className="text-edge-strong"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#arirent-grid)" />
      </svg>

      <div className="relative z-10 flex flex-col items-center gap-1.5 px-4 text-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-edge bg-card text-faint shadow-soft">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[11px] font-medium text-muted">
          {label || (kind === "room" ? "Unit photo pending" : "Building photo pending")}
        </span>
      </div>
    </div>
  );
}
