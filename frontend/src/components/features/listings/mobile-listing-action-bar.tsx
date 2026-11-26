import { Link } from "react-router";
import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";

interface MobileListingActionBarProps {
  priceLabel: string;
  priceAmount: number | null | undefined;
  onScheduleVisit: () => void;
  applyHref?: string | null;
  applyLabel?: string;
}

/**
 * Sticky thumb-reachable bottom bar for phone visitors inspecting a property or room page.
 */
export function MobileListingActionBar({
  priceLabel,
  priceAmount,
  onScheduleVisit,
  applyHref = null,
  applyLabel = "Apply",
}: MobileListingActionBarProps) {
  return (
    <div
      className="fixed bottom-0 inset-x-0 z-30 lg:hidden border-t border-edge bg-card/95 backdrop-blur-md px-4 pt-3 shadow-[0_-4px_20px_rgba(15,23,42,0.08)]"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)" }}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        {priceAmount != null ? (
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
              {priceLabel}
            </p>
            <p className="text-base font-extrabold text-accent tabular-nums leading-tight truncate">
              {formatCurrency(priceAmount)}
              <span className="text-[11px] font-medium text-muted">/mo</span>
            </p>
          </div>
        ) : (
          <div className="min-w-0">
            <p className="text-xs font-bold text-fg truncate">Interested?</p>
            <p className="text-[11px] text-muted truncate">Book an inspection</p>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant={applyHref ? "secondary" : "primary"}
            size="md"
            onClick={onScheduleVisit}
            className="h-10 rounded-xl px-3.5 font-semibold"
          >
            <Calendar className="h-4 w-4" />
            <span>Visit</span>
          </Button>

          {applyHref && (
            <Link to={applyHref}>
              <Button variant="primary" size="md" className="h-10 rounded-xl px-4 font-semibold">
                <span>{applyLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
