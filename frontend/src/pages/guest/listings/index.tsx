import { Building2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LeasingStepsSection,
  PublicListingFilters,
  PublicPropertyCard,
  ScheduleVisitModal,
  usePublicListings,
} from "@/components/features/listings";

export default function PublicListingsPage() {
  const {
    listings,
    cities,
    loading,
    error,
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
    visitProperty,
    setVisitProperty,
  } = usePublicListings();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 space-y-10">
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div className="space-y-1.5 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Available Residential Properties
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg">
              Inspect verified units, schedule a visit, and apply online
            </h1>
            <p className="text-sm text-muted leading-relaxed">
              Browse landlord-managed buildings with transparent monthly rates and move-in terms.
              Contact the property manager to view a room in person before creating an account.
            </p>
          </div>

          {!loading && !error && (
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={totals.totalVacant > 0 ? "success" : "neutral"} dot>
                <span className="tabular-nums">{totals.totalVacant}</span> vacant{" "}
                {totals.totalVacant === 1 ? "unit" : "units"}
              </Badge>
              <Badge variant="neutral">
                <span className="tabular-nums">{totals.totalBuildings}</span>{" "}
                {totals.totalBuildings === 1 ? "building" : "buildings"}
              </Badge>
            </div>
          )}
        </div>

        <PublicListingFilters
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
          resultCount={listings.length}
          onClearFilters={clearFilters}
        />
      </section>

      <section aria-label="Property catalog">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx} className="overflow-hidden">
                <Skeleton className="h-52 w-full rounded-none border-0" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-12 w-full" />
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-8 w-28" />
                    <Skeleton className="h-8 w-28" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="p-8 text-center space-y-3">
            <p className="text-sm font-medium text-danger-fg">{error}</p>
            <div>
              <Button variant="secondary" size="sm" onClick={fetchListings}>
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </Button>
            </div>
          </Card>
        ) : listings.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Building2 className="h-4 w-4" />}
              title={
                hasActiveFilters
                  ? "No properties match your filters"
                  : "No published listings yet"
              }
              description={
                hasActiveFilters
                  ? "Try broadening your monthly budget, city, or occupancy filter."
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
            {listings.map((property) => (
              <PublicPropertyCard
                key={property.id}
                property={property}
                onScheduleVisit={setVisitProperty}
              />
            ))}
          </div>
        )}
      </section>

      <LeasingStepsSection />

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
