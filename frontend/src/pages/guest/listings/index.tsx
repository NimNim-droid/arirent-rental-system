import { Building2, RefreshCw } from "lucide-react";
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
  PublicHeroSection,
  PublicListingFilters,
  PublicPropertyCard,
  PublicStatsStrip,
  ScheduleVisitModal,
  usePublicListings,
} from "@/components/features/listings";

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export default function PublicListingsPage() {
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
      {/* 1. Architectural Hero Banner */}
      <PublicHeroSection
        totalBuildings={totals.totalBuildings}
        totalVacant={totals.totalVacant}
        loading={loading}
        onExploreClick={() => scrollToSection("properties")}
      />

      {/* 2. Floating Elevated Search & Filter Dock */}
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

      {/* Main Content Container */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 sm:pt-16 space-y-16 sm:space-y-20">
        {/* 3. Managed Properties Grid */}
        <section id="properties" aria-label="Managed properties" className="scroll-mt-20 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
                Browse by Property
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-fg">
                Explore Managed <span className="text-accent">Buildings</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted">
                Inspect verified locations, amenities, and open units directly managed by AriRent.
              </p>
            </div>

            {!loading && !error && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Badge
                  variant={totals.totalVacant > 0 ? "success" : "neutral"}
                  dot
                  className="rounded-full px-3 py-1"
                >
                  <span className="tabular-nums">{totals.totalVacant}</span> vacant{" "}
                  {totals.totalVacant === 1 ? "unit" : "units"}
                </Badge>
                <Badge variant="neutral" className="rounded-full px-3 py-1">
                  <span className="tabular-nums">{visibleListings.length}</span>{" "}
                  {visibleListings.length === 1 ? "building" : "buildings"}
                </Badge>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* 4. Available Units Showcase (3-Column Grid) */}
        <FeaturedUnitsSection rooms={featuredRooms} loading={loading} />

        {/* 5. Royal Blue Live Metrics Banner */}
        <PublicStatsStrip totals={totals} loading={loading} />

        {/* 6. Step-by-Step Leasing Process */}
        <LeasingStepsSection />

        {/* 7. About AriRent */}
        <PublicAboutSection />

        {/* 8. Contact Management & Viewing Quick-Booker */}
        <PublicContactSection
          contact={primaryContact}
          properties={listings}
          onScheduleVisit={setVisitProperty}
        />
      </div>

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
