import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  DoorOpen,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  User,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/formatters";
import type { PublicProperty } from "@/lib/types";
import {
  buildPropertiesCatalogUrl,
  type FeaturedPublicRoom,
  type ListingQuickMode,
} from "./listing-helpers";

const SHORTCUTS: Array<{
  mode: ListingQuickMode;
  label: string;
  icon: typeof Building2;
}> = [
  { mode: "all", label: "All Units", icon: Building2 },
  { mode: "vacant", label: "Vacant", icon: CheckCircle2 },
  { mode: "solo", label: "Solo", icon: User },
  { mode: "shared", label: "2+ Pax", icon: Users },
];

interface PublicMobileHomeProps {
  listings: PublicProperty[];
  featuredRooms: FeaturedPublicRoom[];
  loading: boolean;
  totalVacant: number;
  searchInput: string;
  onSearchChange: (value: string) => void;
  activeFilterCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onOpenFilterSheet: () => void;
  city: string;
  maxRent: string;
  capacity: string;
}

/**
 * Compact, app-like mobile home layout (< lg):
 * 1-row 16px search + filter button, compact hero banner, 4 quick shortcuts,
 * and adaptive horizontal swipe carousels that scale cleanly from 360px phones to tablets.
 */
export function PublicMobileHome({
  listings,
  featuredRooms,
  loading,
  totalVacant,
  searchInput,
  onSearchChange,
  activeFilterCount,
  hasActiveFilters,
  onClearFilters,
  onOpenFilterSheet,
  city,
  maxRent,
  capacity,
}: PublicMobileHomeProps) {
  const navigate = useNavigate();
  const [heroImgError, setHeroImgError] = useState(false);

  const catalogUrl = buildPropertiesCatalogUrl({
    q: searchInput,
    city,
    maxRent,
    capacity,
  });

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate(catalogUrl);
  };

  const singleBuilding = listings.length === 1;
  const singleRoom = featuredRooms.length === 1;

  return (
    <div className="lg:hidden mx-auto max-w-lg md:max-w-3xl px-4 sm:px-6 pt-4 pb-2 space-y-5">
      {/* 1. Single-Row Search Bar (16px to prevent iOS Safari zoom) + Blue Filter Button */}
      <div className="space-y-2">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-faint" />
            <input
              type="text"
              inputMode="search"
              enterKeyHint="search"
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search building, city, or street..."
              aria-label="Search properties"
              className="w-full h-11 rounded-2xl border border-edge bg-card pl-10 pr-9 text-base sm:text-sm text-fg shadow-card placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            {searchInput.length > 0 && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-hover hover:text-fg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenFilterSheet}
            aria-label="Open property filters"
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-white shadow-soft hover:bg-accent-strong active:scale-95 transition-all cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-navy px-1 text-[10px] font-bold text-[#DFB966] ring-2 ring-app tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </button>
        </form>

        {/* Live search helper bar when typing */}
        {searchInput.trim().length > 0 && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-accent-border bg-accent-soft/60 px-3 py-2 text-xs">
            <span className="text-fg-soft truncate">
              <strong className="text-fg tabular-nums">{listings.length}</strong>{" "}
              {listings.length === 1 ? "match" : "matches"} for &ldquo;{searchInput.trim()}&rdquo;
            </span>
            <Link
              to={catalogUrl}
              className="inline-flex shrink-0 items-center gap-1 font-bold text-accent hover:text-accent-strong"
            >
              <span>Open list</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* 2. Compact Architectural Hero Banner Card */}
      <section className="relative overflow-hidden rounded-2xl bg-[#1d4ed8] dark:bg-[#17284c] p-5 sm:p-6 text-white shadow-card ring-1 ring-white/10">
        {!heroImgError && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
            <img
              src="/images/hero-residence.jpg"
              alt=""
              onError={() => setHeroImgError(true)}
              className="h-full w-full object-cover object-right opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1d4ed8] via-[#1d4ed8]/90 via-55% to-[#1d4ed8]/20 dark:from-[#17284c] dark:via-[#17284c]/92 dark:to-[#17284c]/25" />
          </div>
        )}

        <div className="relative z-10 max-w-[235px] sm:max-w-xs space-y-3">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug">
              Find Your Next Verified Room
            </h1>
            <p className="text-xs text-blue-100/95 leading-relaxed">
              Direct landlord-managed rentals with transparent monthly rates and move-in terms.
            </p>
          </div>

          <Link
            to="/properties"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-[#1d4ed8] shadow-soft hover:bg-blue-50 active:scale-95 transition-all"
          >
            <span>Explore Properties</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* 3. Quick Category Icon Shortcuts */}
      <nav aria-label="Quick property filters" className="grid grid-cols-4 gap-2">
        {SHORTCUTS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.mode}
              to={buildPropertiesCatalogUrl({ mode: item.mode })}
              className="group flex flex-col items-center gap-1.5 py-1 active:scale-95 transition-transform"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-edge bg-card text-accent shadow-card group-hover:border-accent-border group-hover:bg-accent-soft transition-colors">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold text-fg-soft truncate max-w-full">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* 4. Managed Buildings Horizontal Swipe Carousel */}
      <section aria-label="Managed buildings" className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold tracking-tight text-fg">
              Managed Buildings
            </h2>
            {!loading && (
              <p className="text-xs text-muted">
                {listings.length} {listings.length === 1 ? "property" : "properties"} &middot;{" "}
                {totalVacant} vacant
              </p>
            )}
          </div>
          <Link
            to="/properties"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-accent hover:bg-accent-soft transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="-mx-4 sm:-mx-6 flex gap-3 overflow-hidden px-4 sm:px-6">
            <Skeleton className="h-56 w-[232px] shrink-0 rounded-2xl" />
            <Skeleton className="h-56 w-[232px] shrink-0 rounded-2xl" />
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-edge bg-card p-5 text-center space-y-3 shadow-card">
            <p className="text-xs text-muted">
              {hasActiveFilters
                ? "No properties match your current search or filters."
                : "No published properties available yet."}
            </p>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onClearFilters}
                className="h-9 rounded-xl"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </Button>
            )}
          </div>
        ) : (
          <div
            className={cn(
              singleBuilding
                ? "block"
                : "-mx-4 sm:-mx-6 flex gap-3 overflow-x-auto px-4 sm:px-6 pb-1.5 snap-x snap-mandatory no-scrollbar"
            )}
          >
            {listings.slice(0, 8).map((property) => (
              <Link
                key={property.id}
                to={`/properties/${property.id}`}
                className={cn(
                  "flex flex-col overflow-hidden rounded-2xl border border-edge bg-card shadow-card active:scale-[0.98] transition-transform",
                  singleBuilding ? "w-full" : "w-[232px] shrink-0 snap-start"
                )}
              >
                <div
                  className={cn(
                    "relative w-full bg-inset border-b border-edge",
                    singleBuilding ? "h-44" : "h-32"
                  )}
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
                      <span className="text-xs font-medium text-muted">Building</span>
                    </div>
                  )}

                  {property.available_rooms_count > 0 ? (
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full border border-success-border/80 bg-card/95 px-2.5 py-0.5 text-[11px] font-semibold text-success-fg shadow-soft backdrop-blur-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-success-fg" />
                      {property.available_rooms_count} Vacant
                    </span>
                  ) : (
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                      Full
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-3.5 space-y-2">
                  <div className="space-y-0.5">
                    <p className="truncate text-sm font-bold text-fg">{property.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-faint" />
                      <span className="truncate">{property.city}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-edge pt-2">
                    {property.starting_rent != null ? (
                      <p className="text-sm font-bold text-accent tabular-nums">
                        {formatCurrency(property.starting_rent)}
                        <span className="text-xs font-medium text-muted">/mo</span>
                      </p>
                    ) : (
                      <span className="text-xs font-medium text-muted">View rates</span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted tabular-nums">
                      <DoorOpen className="h-3.5 w-3.5 text-faint" />
                      {property.listed_rooms_count}
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {/* Trailing "See All" card when there are multiple buildings */}
            {listings.length > 2 && (
              <Link
                to="/properties"
                className="flex w-[148px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-accent-border bg-accent-soft/50 p-4 text-center text-accent active:scale-[0.98] transition-transform"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-soft">
                  <ArrowRight className="h-4 w-4" />
                </span>
                <span className="text-xs font-bold">View All ({listings.length})</span>
              </Link>
            )}
          </div>
        )}
      </section>

      {/* 5. Vacant Rooms Horizontal Swipe Carousel */}
      {!loading && featuredRooms.length > 0 && (
        <section aria-label="Vacant rooms ready to view" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold tracking-tight text-fg">
                Vacant Rooms Ready
              </h2>
              <p className="text-xs text-muted">Swipe to compare open units</p>
            </div>
            <Link
              to={buildPropertiesCatalogUrl({ mode: "vacant", tab: "rooms" })}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-accent hover:bg-accent-soft transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div
            className={cn(
              singleRoom
                ? "block"
                : "-mx-4 sm:-mx-6 flex gap-3 overflow-x-auto px-4 sm:px-6 pb-1.5 snap-x snap-mandatory no-scrollbar"
            )}
          >
            {featuredRooms.map((item) => (
              <Link
                key={item.room.id}
                to={`/rooms/${item.room.id}`}
                className={cn(
                  "flex flex-col overflow-hidden rounded-2xl border border-edge bg-card shadow-card active:scale-[0.98] transition-transform",
                  singleRoom ? "w-full" : "w-[228px] shrink-0 snap-start"
                )}
              >
                <div
                  className={cn(
                    "relative w-full bg-inset border-b border-edge",
                    singleRoom ? "h-40" : "h-32"
                  )}
                >
                  {item.previewPhotoUrl ? (
                    <img
                      src={item.previewPhotoUrl}
                      alt={`Room ${item.room.room_number}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-faint">
                      <DoorOpen className="h-5 w-5" />
                      <span className="text-xs font-medium text-muted">
                        Room {item.room.room_number}
                      </span>
                    </div>
                  )}

                  <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full border border-success-border/80 bg-card/95 px-2.5 py-0.5 text-[11px] font-semibold text-success-fg shadow-soft backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-success-fg" />
                    Vacant
                  </span>
                </div>

                <div className="p-3.5 space-y-1">
                  <p className="text-sm font-bold text-accent tabular-nums leading-tight">
                    {formatCurrency(item.room.rent)}
                    <span className="text-xs font-medium text-muted">/mo</span>
                  </p>
                  <p className="truncate text-sm font-bold text-fg">
                    Room {item.room.room_number} &middot; {item.propertyName}
                  </p>
                  <p className="text-xs text-muted truncate">
                    {item.room.capacity} {item.room.capacity === 1 ? "person" : "persons"}
                    {item.room.floor_area != null ? ` · ${item.room.floor_area} sqm` : ""}
                    {` · ${item.propertyCity}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
