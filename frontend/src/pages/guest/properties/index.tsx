import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  ArrowRight,
  Building2,
  DoorOpen,
  MapPin,
  Maximize2,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/formatters";
import {
  ListingMediaPlaceholder,
  PublicFilterSheet,
  PublicListingFilters,
  PublicPropertyCard,
  PublicPropertyRowCard,
  PublicRoomRowCard,
  ScheduleVisitModal,
  parseCatalogTabParam,
  usePublicListings,
  type ListingQuickMode,
  type PublicCatalogTab,
} from "@/components/features/listings";

const MOBILE_MODE_PILLS: Array<{ id: ListingQuickMode; label: string }> = [
  { id: "all", label: "All" },
  { id: "vacant", label: "Vacant Ready" },
  { id: "solo", label: "Solo Units" },
  { id: "shared", label: "2+ Pax" },
];

export default function PublicPropertiesPage() {
  const [searchParams] = useSearchParams();
  const [catalogTab, setCatalogTab] = useState<PublicCatalogTab>(() =>
    parseCatalogTabParam(searchParams.get("tab"))
  );
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  useEffect(() => {
    setCatalogTab(parseCatalogTabParam(searchParams.get("tab")));
  }, [searchParams]);

  const {
    visibleListings,
    allVacantRooms,
    cities,
    loading,
    error,
    quickMode,
    setQuickMode,
    searchInput,
    setSearchInput,
    city,
    setCity,
    maxRent,
    setMaxRent,
    capacity,
    setCapacity,
    activeFilterCount,
    hasActiveFilters,
    clearFilters,
    fetchListings,
    visitProperty,
    setVisitProperty,
  } = usePublicListings({ syncFromUrl: true });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-8 space-y-5 lg:space-y-8">
      {/* ================= Mobile Compact Catalog Controls (< lg) ================= */}
      <div className="lg:hidden space-y-3">
        {/* Horizontal Pill Bar (Screen 3 style) */}
        <div
          role="tablist"
          aria-label="Filter by unit availability"
          className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-0.5 no-scrollbar"
        >
          {MOBILE_MODE_PILLS.map((pill) => {
            const active = quickMode === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setQuickMode(pill.id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors cursor-pointer",
                  active
                    ? "bg-accent text-white shadow-soft"
                    : "border border-edge bg-card text-fg-soft hover:text-fg"
                )}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Compact Search (16px to prevent iOS auto-zoom) + Filter Button Row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-faint" />
            <input
              type="text"
              inputMode="search"
              enterKeyHint="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search building, street, or city..."
              aria-label="Search properties"
              className="w-full h-11 rounded-xl border border-edge bg-card pl-9 pr-9 text-base sm:text-sm text-fg shadow-soft placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            {searchInput.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-hover hover:text-fg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setFilterSheetOpen(true)}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-edge bg-card px-3.5 text-xs font-semibold text-fg shadow-soft hover:border-accent-border hover:text-accent active:scale-95 transition-all cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-accent" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Buildings vs Vacant Rooms Switcher + Result Count */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex flex-1 rounded-xl border border-edge bg-inset p-0.5">
            <button
              type="button"
              onClick={() => setCatalogTab("buildings")}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                catalogTab === "buildings"
                  ? "bg-card text-accent shadow-soft"
                  : "text-muted hover:text-fg"
              )}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Buildings ({visibleListings.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setCatalogTab("rooms")}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                catalogTab === "rooms"
                  ? "bg-card text-accent shadow-soft"
                  : "text-muted hover:text-fg"
              )}
            >
              <DoorOpen className="h-3.5 w-3.5" />
              <span>Vacant Rooms ({allVacantRooms.length})</span>
            </button>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              aria-label="Reset all filters"
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-accent hover:bg-accent-soft cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= Desktop Catalog Header & Filter Bar (>= lg) ================= */}
      <div className="hidden lg:block space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
              Property Directory
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-fg">
              Browse Managed Properties &amp; Units
            </h1>
            <p className="text-sm text-muted">
              Compare buildings or scan all currently vacant rooms ready for in-person viewing.
            </p>
          </div>

          <div className="inline-flex rounded-xl border border-edge bg-inset p-1 shrink-0">
            <button
              type="button"
              onClick={() => setCatalogTab("buildings")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer",
                catalogTab === "buildings"
                  ? "bg-card text-accent shadow-soft"
                  : "text-muted hover:text-fg"
              )}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Buildings ({visibleListings.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setCatalogTab("rooms")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer",
                catalogTab === "rooms"
                  ? "bg-card text-accent shadow-soft"
                  : "text-muted hover:text-fg"
              )}
            >
              <DoorOpen className="h-3.5 w-3.5" />
              <span>Vacant Rooms ({allVacantRooms.length})</span>
            </button>
          </div>
        </div>

        <PublicListingFilters
          floating={false}
          quickMode={quickMode}
          onQuickModeChange={setQuickMode}
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          city={city}
          onCityChange={setCity}
          cities={cities}
          maxRent={maxRent}
          onMaxRentChange={setMaxRent}
          capacity={capacity}
          onCapacityChange={setCapacity}
          hasActiveFilters={hasActiveFilters}
          resultCount={visibleListings.length}
          onClearFilters={clearFilters}
        />
      </div>

      {/* ================= Results List (Compact Rows on Phone, Rich Grid on Desktop) ================= */}
      {loading ? (
        <>
          <div className="lg:hidden space-y-2.5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-80 w-full rounded-2xl" />
            ))}
          </div>
        </>
      ) : error ? (
        <Card className="rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm font-medium text-danger-fg">{error}</p>
          <div>
            <Button variant="secondary" size="sm" onClick={fetchListings}>
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </Button>
          </div>
        </Card>
      ) : catalogTab === "buildings" ? (
        visibleListings.length === 0 ? (
          <Card className="rounded-2xl">
            <EmptyState
              icon={<Building2 className="h-4 w-4" />}
              title={
                hasActiveFilters
                  ? "No vacant buildings match your filters"
                  : "All units are currently occupied"
              }
              description={
                hasActiveFilters
                  ? "Try clearing or broadening your search, city, rent budget, or occupant filters."
                  : "Buildings automatically reappear here as soon as a room becomes vacant."
              }
              action={
                hasActiveFilters ? (
                  <Button variant="secondary" size="sm" onClick={clearFilters}>
                    Reset Filters
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <>
            {/* Mobile Compact Row List — 4 to 5 buildings visible per phone screen */}
            <div className="lg:hidden space-y-2.5">
              {visibleListings.map((property) => (
                <PublicPropertyRowCard
                  key={property.id}
                  property={property}
                  onScheduleVisit={setVisitProperty}
                />
              ))}
            </div>

            {/* Desktop Full Property Grid */}
            <div className="hidden lg:grid grid-cols-2 gap-6">
              {visibleListings.map((property) => (
                <PublicPropertyCard
                  key={property.id}
                  property={property}
                  onScheduleVisit={setVisitProperty}
                />
              ))}
            </div>
          </>
        )
      ) : allVacantRooms.length === 0 ? (
        <Card className="rounded-2xl">
          <EmptyState
            icon={<DoorOpen className="h-4 w-4" />}
            title="No vacant rooms match your filters"
            description="Adjust your monthly budget, city, or occupant filter, or check Buildings to book a waitlist inquiry."
            action={
              hasActiveFilters ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Reset Filters
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setCatalogTab("buildings")}>
                  View Buildings
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <>
          {/* Mobile Compact Room Rows */}
          <div className="lg:hidden space-y-2.5">
            {allVacantRooms.map((item) => (
              <PublicRoomRowCard key={item.room.id} item={item} />
            ))}
          </div>

          {/* Desktop 3-Column Room Grid */}
          <div className="hidden lg:grid grid-cols-3 gap-5">
            {allVacantRooms.map((item) => {
              const { room } = item;
              return (
                <article
                  key={room.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-edge bg-card shadow-card transition-all duration-200 hover:border-edge-strong hover:shadow-pop"
                >
                  <Link
                    to={`/rooms/${room.id}`}
                    className="relative block h-48 w-full overflow-hidden bg-inset border-b border-edge"
                  >
                    {item.previewPhotoUrl ? (
                      <img
                        src={item.previewPhotoUrl}
                        alt={`Room ${room.room_number} at ${item.propertyName}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <ListingMediaPlaceholder
                        kind="room"
                        label={`Room ${room.room_number}`}
                        className="h-full w-full"
                      />
                    )}
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-success-border/80 bg-card/95 px-2.5 py-0.5 text-[11px] font-semibold text-success-fg shadow-soft backdrop-blur-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-success-fg" />
                      Vacant
                    </span>
                    <span className="absolute right-3 top-3 rounded-full bg-card/92 px-2.5 py-0.5 text-[11px] font-semibold text-fg shadow-soft backdrop-blur-sm">
                      {item.propertyCity}
                    </span>
                  </Link>

                  <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-lg font-extrabold text-accent tabular-nums">
                        {formatCurrency(room.rent)}
                        <span className="text-xs font-medium text-muted"> / Month</span>
                      </p>
                      <Link
                        to={`/rooms/${room.id}`}
                        className="block text-base font-bold tracking-tight text-fg hover:text-accent transition-colors line-clamp-1"
                      >
                        Room {room.room_number} &mdash; {item.propertyName}
                      </Link>
                      <p className="flex items-center gap-1 text-xs text-muted">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-faint" />
                        <span className="truncate">
                          {item.propertyAddress}, {item.propertyCity}
                        </span>
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 border-t border-edge pt-3 text-[11px] font-medium text-fg-soft">
                        <span className="inline-flex items-center gap-1 truncate">
                          <Users className="h-3.5 w-3.5 shrink-0 text-muted" />
                          <span className="truncate">
                            {room.capacity} {room.capacity === 1 ? "Person" : "Persons"}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1 truncate tabular-nums">
                          <Maximize2 className="h-3.5 w-3.5 shrink-0 text-muted" />
                          <span className="truncate">
                            {room.floor_area != null ? `${room.floor_area} sqm` : "Standard"}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1 truncate tabular-nums">
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-muted" />
                          <span className="truncate">
                            {room.advance_months}+{room.deposit_months} mo
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link to={`/rooms/${room.id}`} className="flex-1">
                          <Button variant="secondary" size="sm" className="w-full h-9 rounded-xl">
                            View Details
                          </Button>
                        </Link>
                        <Link to={`/register?room=${room.id}`} className="flex-1">
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full h-9 rounded-xl font-semibold"
                          >
                            <span>Apply</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* Mobile Filter Bottom Sheet */}
      <PublicFilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        quickMode={quickMode}
        onQuickModeChange={setQuickMode}
        city={city}
        onCityChange={setCity}
        cities={cities}
        maxRent={maxRent}
        onMaxRentChange={setMaxRent}
        capacity={capacity}
        onCapacityChange={setCapacity}
        resultCount={visibleListings.length}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      {/* Viewing Appointment Modal */}
      {visitProperty && (
        <ScheduleVisitModal
          open={Boolean(visitProperty)}
          onClose={() => setVisitProperty(null)}
          property={visitProperty}
          availableRooms={visitProperty.rooms.filter((r) => r.is_available)}
        />
      )}
    </div>
  );
}
