import { Phone } from "lucide-react";
import { cn } from "@/lib/cn";

interface EmergencyHotlineBannerProps {
  phone?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Reusable 24/7 emergency hotline banner for tenant support surfaces.
 * Uses explicit dark-mode text contrast so the icon and call action remain legible in both themes.
 */
export function EmergencyHotlineBanner({
  phone = "0917-222-3333",
  compact = false,
  className,
}: EmergencyHotlineBannerProps) {
  const cleanTel = phone.replace(/[^\d+]/g, "");

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-2xl border border-warning-border/80 bg-warning-bg/70",
        compact ? "p-3 text-xs" : "p-3.5",
        className
      )}
    >
      <div className={cn("flex items-center min-w-0", compact ? "gap-2.5" : "gap-3")}>
        {compact ? (
          <Phone className="h-4 w-4 text-warning-fg shrink-0" />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card border border-warning-border/80 text-warning-fg shadow-soft">
            <Phone className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-bold text-fg">Emergency Hotline (24/7)</p>
          <p
            className={cn(
              "tracking-tight text-warning-fg tabular-nums",
              compact ? "text-[11px] font-semibold" : "text-xs font-bold"
            )}
          >
            {phone}
          </p>
        </div>
      </div>
      <a
        href={`tel:${cleanTel}`}
        className={cn(
          "shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-card border border-warning-border text-xs font-bold text-warning-fg hover:bg-warning-fg hover:text-white active:scale-95 transition-all shadow-soft",
          compact ? "px-3 py-1" : "px-3.5 py-1.5"
        )}
      >
        <Phone className="h-3 w-3" />
        <span>Call</span>
      </a>
    </div>
  );
}

