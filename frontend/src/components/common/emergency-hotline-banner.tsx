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
        "flex items-center justify-between rounded-2xl border border-[#fedf89] bg-[#fffaeb] dark:border-[#78350f] dark:bg-[#451a03]/40 shadow-soft",
        compact ? "p-3 text-xs" : "p-3 sm:p-3.5",
        className
      )}
    >
      <div className={cn("flex items-center min-w-0", compact ? "gap-2.5" : "gap-3")}>
        {compact ? (
          <Phone className="h-4 w-4 text-[#b45309] dark:text-[#fef08a] shrink-0" />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fef08a] dark:bg-[#78350f] text-[#b45309] dark:text-[#fef08a] font-bold">
            <Phone className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-bold text-fg">Emergency Hotline (24/7)</p>
          <p
            className={cn(
              "tracking-tight text-[#b45309] dark:text-[#fef08a]",
              compact ? "text-[11px] font-semibold" : "text-xs font-extrabold"
            )}
          >
            {phone}
          </p>
        </div>
      </div>
      <a
        href={`tel:${cleanTel}`}
        className={cn(
          "shrink-0 rounded-xl bg-[#fef08a] dark:bg-[#78350f] text-xs font-bold text-[#b45309] dark:text-[#fef08a] hover:opacity-90 active:scale-95 transition-all",
          compact ? "px-3 py-1" : "px-3.5 py-1.5 shadow-soft"
        )}
      >
        Call
      </a>
    </div>
  );
}

