import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Building2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FeaturedUnitsSection,
  LeasingStepsSection,
  PublicAboutSection,
  PublicContactSection,
  PublicFilterSheet,
  PublicHeroSection,
  PublicListingFilters,
  PublicMobileHome,
  PublicPropertyCard,
  PublicStatsStrip,
  ScheduleVisitModal,
  buildPropertiesCatalogUrl,
  usePublicListings,
} from "@/components/features/listings";

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export default function PublicListingsPage() {
  const navigate = useNavigate();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const {
    listings,
    visibleListings,
    featuredRooms,
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
    totals,
    primaryContact,
    visitProperty,
    setVisitProperty,
  } = usePublicListings();

  return (
    <div>
      {/* ================= Mobile Phone App-Style Home (< lg) ================= */}
      <PublicMobileHome
        listings={visibleListings}
        featuredRooms={featuredRooms}
        loading={loading}
        totalVacant={totals.totalVacant}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        activeFilterCount={activeFilterCount}
        onOpenFilterSheet={() => setFilterSheetOpen(true)}
        city={city}
        maxRent={maxRent}
        capacity={capacity}
      />

      {/* ================= Desktop Architectural Hero & Floating Search (>= lg) ================= */}
      <div className="hidden lg:block">
        <PublicHeroSection
          totalBuildings={totals.totalBuildings}
          totalVacant={totals.totalVacant}
          loading={loading}
          onExploreClick={() => scrollToSection("properties")}
        />

        <PublicListingFilters
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
          onSubmitSearch={() => scrollToSection("properties")}
        />
      </div>

      {/* Main Content Container */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 lg:pt-16 space-y-12 lg:space-y-20">
        {/* Desktop Managed Properties Grid (Mobile uses horizontal swipe carousel + /properties list) */}
        <section
          id="properties"
          aria-label="Managed properties"
          className="hidden lg:block scroll-mt-20 space-y-6"
        >
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
                Browse by Property
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-fg">
                Explore Managed <span className="text-accent">Buildings</span>
              </h2>
              <p className="text-sm text-muted">
                Inspect verified locations, amenities, and open units directly managed by AriRent.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {!loading && !error && (
                <Badge
                  variant={totals.totalVacant > 0 ? "success" : "neutral"}
                  dot
                  className="rounded-full px-3 py-1"
                >
                  <span className="tabular-nums">{totals.totalVacant}</span> vacant{" "}
                  {totals.totalVacant === 1 ? "unit" : "units"}
                </Badge>
              )}
              <Link to="/properties">
                <Button variant="secondary" size="md" className="h-9 rounded-xl">
                  <span>View All Properties</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Card key={idx} className="overflow-hidden rounded-2xl">
                  <Skeleton className="h-56 w-full rounded-none border-0" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-12 w-full" />
                    <div className="flex justify-between pt-2">
                      <Skeleton className="h-9 w-32 rounded-xl" />
                      <Skeleton className="h-9 w-32 rounded-xl" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
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
          ) : visibleListings.length === 0 ? (
            <Card className="rounded-2xl">
              <EmptyState
                icon={<Building2 className="h-4 w-4" />}
                title={
                  hasActiveFilters
                    ? "No properties match your filters"
                    : "No published listings yet"
                }
                description={
                  hasActiveFilters
                    ? "Try adjusting your city, monthly budget, capacity, or quick tab filter."
                    : "Available properties and vacant rooms published by the property manager will appear here."
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
            <div className="grid grid-cols-2 gap-6">
              {visibleListings.map((property) => (
                <PublicPropertyCard
                  key={property.id}
                  property={property}
                  onScheduleVisit={setVisitProperty}
                />
              ))}
            </div>
          )}
        </section>

        {/* Desktop 3-Column Vacant Rooms Showcase */}
        <div className="hidden lg:block">
          <FeaturedUnitsSection rooms={featuredRooms} loading={loading} />
        </div>

        {/* Shared Across Mobile & Desktop: Live Metrics Strip */}
        <PublicStatsStrip totals={totals} loading={loading} />

        {/* Step-by-Step Leasing Process */}
        <LeasingStepsSection />

        {/* About AriRent */}
        <PublicAboutSection />

        {/* Contact Management & Viewing Quick-Booker */}
        <PublicContactSection
          contact={primaryContact}
          properties={listings}
          onScheduleVisit={setVisitProperty}
        />
      </div>

      {/* Mobile Filter Sheet — Applying jumps straight into /properties compact list */}
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
        onApply={() =>
          navigate(
            buildPropertiesCatalogUrl({
              q: searchInput,
              mode: quickMode,
              city,
              maxRent,
              capacity,
            })
          )
        }
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
