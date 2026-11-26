import { Link } from "react-router";
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  DoorOpen,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ListingMediaPlaceholder,
  ScheduleVisitModal,
  usePublicListings,
} from "@/components/features/listings";
import { formatCurrency } from "@/lib/formatters";

const BUDGET_OPTIONS = [
  { label: "Any monthly budget", value: "" },
  { label: "Up to ₱6,000 / mo", value: "6000" },
  { label: "Up to ₱9,000 / mo", value: "9000" },
  { label: "Up to ₱12,000 / mo", value: "12000" },
  { label: "Up to ₱15,000 / mo", value: "15000" },
  { label: "Up to ₱20,000 / mo", value: "20000" },
];

const CAPACITY_OPTIONS = [
  { label: "Any capacity", value: "" },
  { label: "Solo (1+ person)", value: "1" },
  { label: "2+ occupants", value: "2" },
  { label: "3+ occupants", value: "3" },
];

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
      {/* Top Editorial Intro & Filter Panel */}
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

        {/* Search & Filter Bar */}
        <Card className="p-3.5 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-2 lg:col-span-5">
              <Input
                id="listingSearch"
                label="Search Building or Location"
                placeholder="Building name, street, or city..."
                icon={<Search className="h-3.5 w-3.5" />}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <div className="lg:col-span-3">
              <Select
                id="listingCity"
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                <option value="all">All locations</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            <div className="lg:col-span-2">
              <Select
                id="listingBudget"
                label="Monthly Budget"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
              >
                {BUDGET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="lg:col-span-2">
              <Select
                id="listingCapacity"
                label="Occupants"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              >
                {CAPACITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-between border-t border-edge pt-2.5 text-xs">
              <span className="inline-flex items-center gap-1.5 text-muted">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Showing filtered results ({listings.length})
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 font-medium text-accent hover:text-accent-strong cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            </div>
          )}
        </Card>
      </section>

      {/* Listings Grid */}
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
            {listings.map((property) => {
              const vacantRooms = property.rooms.filter((r) => r.is_available);

              return (
                <Card
                  key={property.id}
                  className="flex flex-col overflow-hidden hover:border-edge-strong transition-colors"
                >
                  {/* Cover Media */}
                  <Link
                    to={`/properties/${property.id}`}
                    className="group relative block h-52 w-full overflow-hidden bg-inset border-b border-edge"
                  >
                    {property.cover_photo_url ? (
                      <img
                        src={property.cover_photo_url}
                        alt={property.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <ListingMediaPlaceholder
                        kind="property"
                        label="Click to view units & building details"
                        className="h-full w-full"
                      />
                    )}

                    <div className="absolute left-3 top-3 flex items-center gap-1.5">
                      {property.available_rooms_count > 0 ? (
                        <Badge variant="success" dot className="shadow-soft bg-card/95 backdrop-blur">
                          {property.available_rooms_count} vacant{" "}
                          {property.available_rooms_count === 1 ? "unit" : "units"}
                        </Badge>
                      ) : (
                        <Badge variant="neutral" className="shadow-soft bg-card/95 backdrop-blur">
                          All listed units leased
                        </Badge>
                      )}
                    </div>
                  </Link>

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            to={`/properties/${property.id}`}
                            className="text-base font-semibold text-fg hover:text-accent transition-colors line-clamp-1"
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

                        {property.starting_rent != null && (
                          <div className="text-right shrink-0">
                            <p className="text-[11px] text-muted">Starts at</p>
                            <p className="text-sm font-bold text-fg tabular-nums">
                              {formatCurrency(property.starting_rent)}
                              <span className="text-xs font-normal text-muted">/mo</span>
                            </p>
                          </div>
                        )}
                      </div>

                      {property.description && (
                        <p className="text-xs text-fg-soft leading-relaxed line-clamp-2">
                          {property.description}
                        </p>
                      )}

                      {property.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {property.amenities.slice(0, 4).map((amenity) => (
                            <span
                              key={amenity}
                              className="inline-flex items-center rounded border border-edge bg-inset px-2 py-0.5 text-[11px] text-fg-soft"
                            >
                              {amenity}
                            </span>
                          ))}
                          {property.amenities.length > 4 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-[11px] text-muted">
                              +{property.amenities.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Quick preview of available units inside this building */}
                      {vacantRooms.length > 0 && (
                        <div className="rounded-lg border border-edge bg-inset p-2.5 space-y-1.5">
                          <p className="text-[11px] font-medium text-muted">
                            Vacant units ready for viewing:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {vacantRooms.slice(0, 3).map((room) => (
                              <Link
                                key={room.id}
                                to={`/rooms/${room.id}`}
                                className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-card px-2.5 py-1 text-xs font-medium text-fg hover:border-accent hover:text-accent transition-colors"
                              >
                                <DoorOpen className="h-3 w-3 text-muted" />
                                <span>Room {room.room_number}</span>
                                <span className="text-muted">&middot;</span>
                                <span className="tabular-nums font-semibold">
                                  {formatCurrency(room.rent)}
                                </span>
                                <span className="inline-flex items-center gap-0.5 text-[11px] text-muted">
                                  <Users className="h-3 w-3" />
                                  {room.capacity}
                                </span>
                              </Link>
                            ))}
                            {vacantRooms.length > 3 && (
                              <Link
                                to={`/properties/${property.id}`}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-accent hover:underline"
                              >
                                +{vacantRooms.length - 3} more
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 border-t border-edge pt-3.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setVisitProperty(property)}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Schedule Visit
                      </Button>

                      <Link to={`/properties/${property.id}`}>
                        <Button size="sm" variant="primary">
                          View Units ({property.listed_rooms_count})
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Clear 4-Step Leasing Guide */}
      <section id="how-leasing-works" className="pt-4 border-t border-edge space-y-4">
        <div>
          <h2 className="text-base font-semibold text-fg">How Leasing Works</h2>
          <p className="text-xs text-muted mt-0.5">
            Transparent step-by-step process from room inspection to moving in
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: "01",
              title: "Browse Verified Units",
              body: "Check room photos, monthly rent, capacity, inclusions, and required advance/deposit.",
            },
            {
              step: "02",
              title: "Contact & Visit in Person",
              body: "Call, message, or book a viewing schedule to inspect the building and unit with the landlord.",
            },
            {
              step: "03",
              title: "Apply & Reserve Your Room",
              body: "Once satisfied with the unit, submit an online application to create your account and hold the room.",
            },
            {
              step: "04",
              title: "Landlord Approval & Portal",
              body: "After approval, sign in to your resident portal to view utility readings, statements, and pay online.",
            },
          ].map((item) => (
            <Card key={item.step} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-accent tabular-nums">
                  STEP {item.step}
                </span>
                <CheckCircle2 className="h-3.5 w-3.5 text-faint" />
              </div>
              <h3 className="text-sm font-semibold text-fg">{item.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

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
