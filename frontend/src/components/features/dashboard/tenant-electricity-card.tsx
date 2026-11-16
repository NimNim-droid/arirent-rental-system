import { useState } from "react";
import { Zap, Camera, ImageOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MeterPhotoViewer } from "@/components/features/utilities";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { TenantDashboardData } from "@/lib/types";

interface TenantElectricityCardProps {
  elec: TenantDashboardData["electricity"] | undefined;
  loading: boolean;
}

/**
 * Read-only electricity summary on the tenant home.
 * Shows the latest meter reading recorded by the landlord and lets the tenant
 * open the proof photo. Tenants cannot add, edit or replace readings or photos.
 */
export function TenantElectricityCard({ elec, loading }: TenantElectricityCardProps) {
  const [photoOpen, setPhotoOpen] = useState(false);

  if (loading) {
    return <Skeleton className="h-28 w-full rounded-2xl" />;
  }

  const hasReading = !!elec && (elec.latest_reading > 0 || elec.usage_kwh > 0);

  if (!hasReading) {
    return (
      <div className="flex items-center gap-3.5 rounded-2xl border border-edge bg-card p-3.5 shadow-card">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-inset text-muted border border-edge">
          <Zap className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-fg">No meter reading yet</p>
          <p className="text-xs text-muted">Your landlord records the electric meter monthly.</p>
        </div>
      </div>
    );
  }

  const photoUrl = elec?.meter_photo_url ?? null;
  const readingDate = elec?.last_reading_date ? formatDate(elec.last_reading_date) : null;

  return (
    <>
      <div className="rounded-2xl border border-edge bg-card p-4 shadow-card space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-warning-bg text-warning-fg">
              <Zap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-fg">
                {elec?.usage_kwh} <span className="text-xs font-semibold text-muted">kWh used</span>
              </p>
              <p className="text-xs text-muted truncate">
                {readingDate ? `Read on ${readingDate}` : "Latest reading"}
              </p>
            </div>
          </div>
          <p className="shrink-0 text-sm font-extrabold text-fg tabular-nums">
            {formatCurrency(elec?.estimated_charge ?? 0)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-inset/60 p-2.5 text-center">
          <div>
            <p className="text-[11px] text-muted">Previous</p>
            <p className="text-sm font-bold text-fg tabular-nums">{elec?.prev_reading ?? 0}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted">Current</p>
            <p className="text-sm font-bold text-fg tabular-nums">{elec?.latest_reading}</p>
          </div>
        </div>

        {photoUrl ? (
          <button
            type="button"
            onClick={() => setPhotoOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-edge bg-card py-2.5 text-xs font-bold text-fg transition-all hover:bg-hover active:scale-[0.99] cursor-pointer"
          >
            <Camera className="h-4 w-4 text-accent" /> View meter photo
          </button>
        ) : (
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
            <ImageOff className="h-3.5 w-3.5" /> No meter photo attached for this reading
          </p>
        )}
      </div>

      <MeterPhotoViewer
        url={photoOpen ? photoUrl : null}
        caption={`${elec?.prev_reading ?? 0} → ${elec?.latest_reading} kWh · ${elec?.usage_kwh} kWh used`}
        onClose={() => setPhotoOpen(false)}
      />
    </>
  );
}
