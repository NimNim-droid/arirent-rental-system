import { Link } from "react-router";
import { Building2, Calendar, ChevronRight, DoorOpen, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { PublicProperty } from "@/lib/types";

interface PublicPropertyRowCardProps {
  property: PublicProperty;
  onScheduleVisit: (property: PublicProperty) => void;
}

/**
 * Compact horizontal property row card optimized for fast scanning of many buildings on phones.
 */
export function PublicPropertyRowCard({
  property,
  onScheduleVisit,
}: PublicPropertyRowCardProps) {
  return (
    <article className="flex items-stretch gap-3 rounded-2xl border border-edge bg-card p-3 shadow-card transition-colors hover:border-edge-strong">
      {/* Compact Square Media Thumbnail */}
      <Link
        to={`/properties/${property.id}`}
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-edge bg-inset"
      >
        {property.cover_photo_url ? (
          <img
            src={property.cover_photo_url}
            alt={property.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-faint">
            <Building2 className="h-5 w-5" />
            <span className="text-[11px] font-medium text-muted">Building</span>
          </div>
        )}

        {property.available_rooms_count > 0 ? (
          <span className="absolute left-1.5 bottom-1.5 inline-flex items-center gap-1 rounded-full border border-success-border/80 bg-card/95 px-2 py-0.5 text-[10px] font-semibold text-success-fg shadow-soft backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-success-fg" />
            {property.available_rooms_count} vacant
          </span>
        ) : (
          <span className="absolute left-1.5 bottom-1.5 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            Full
          </span>
        )}
      </Link>

      {/* Scannable Metadata Column */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={`/properties/${property.id}`}
              className="block truncate text-sm font-bold tracking-tight text-fg hover:text-accent transition-colors"
            >
              {property.name}
            </Link>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-faint" />
              <span className="truncate">
                {property.address}, {property.city}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => onScheduleVisit(property)}
            title={`Schedule visit for ${property.name}`}
            aria-label={`Schedule visit for ${property.name}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-edge bg-inset text-accent hover:bg-accent-soft hover:border-accent-border active:scale-95 transition-all cursor-pointer"
          >
            <Calendar className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-end justify-between gap-2 pt-1.5">
          <div className="min-w-0">
            {property.starting_rent != null ? (
              <p className="text-sm font-bold text-accent tabular-nums leading-tight">
                {formatCurrency(property.starting_rent)}
                <span className="text-xs font-medium text-muted">/mo</span>
              </p>
            ) : (
              <p className="text-xs font-semibold text-muted">View unit rates</p>
            )}
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted tabular-nums">
              <span className="inline-flex items-center gap-1">
                <DoorOpen className="h-3.5 w-3.5 text-faint" />
                {property.listed_rooms_count} units
              </span>
              <span>&middot;</span>
              <span className="truncate">{property.city}</span>
            </div>
          </div>

          <Link
            to={`/properties/${property.id}`}
            className="inline-flex items-center gap-0.5 rounded-lg bg-inset px-2.5 py-1.5 text-xs font-semibold text-fg-soft hover:text-accent transition-colors shrink-0"
          >
            <span>Units</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
