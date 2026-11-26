import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  DoorOpen,
  MapPin,
  Maximize2,
  ScrollText,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ContactLandlordCard,
  ListingMediaPlaceholder,
  PhotoGallery,
  ScheduleVisitModal,
  usePublicPropertyDetail,
} from "@/components/features/listings";
import { formatCurrency } from "@/lib/formatters";

export default function PublicPropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    property,
    loading,
    error,
    unitFilter,
    setUnitFilter,
    visitOpen,
    setVisitOpen,
    selectedRoomForVisit,
    galleryPhotos,
    displayedRooms,
    openVisitForRoom,
  } = usePublicPropertyDetail(id);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-80 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <Card>
          <EmptyState
            title="Property Listing Unavailable"
            description={error || "This property may no longer be listed publicly."}
            action={
              <Link to="/">
                <Button variant="secondary" size="sm">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Available Properties
                </Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  const vacantRooms = property.rooms.filter((r) => r.is_available);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-3 text-xs text-muted">
        <div className="flex items-center gap-1.5 min-w-0">
          <Link to="/" className="hover:text-fg transition-colors inline-flex items-center gap-1 shrink-0">
            <ArrowLeft className="h-3.5 w-3.5" />
            All Properties
          </Link>
          <span>/</span>
          <span className="truncate">{property.city}</span>
          <span>/</span>
          <span className="font-medium text-fg truncate">{property.name}</span>
        </div>

        <Badge variant={vacantRooms.length > 0 ? "success" : "neutral"} dot>
          {vacantRooms.length} of {property.listed_rooms_count} vacant
        </Badge>
      </div>

      {/* Building Title */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg">
            {property.name}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="h-4 w-4 shrink-0 text-faint" />
            <span>
              {property.address}, {property.city}
            </span>
          </p>
        </div>

        {property.starting_rent != null && (
          <div className="sm:text-right">
            <p className="text-xs text-muted">Monthly rent from</p>
            <p className="text-xl font-bold text-fg tabular-nums">
              {formatCurrency(property.starting_rent)}
              <span className="text-xs font-normal text-muted"> / month</span>
            </p>
          </div>
        )}
      </div>

      {/* Photo Gallery */}
      <PhotoGallery photos={galleryPhotos} title={property.name} kind="property" />

      {/* Main Two-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          {/* Building Overview */}
          {(property.description || property.amenities.length > 0) && (
            <Card className="p-5 sm:p-6 space-y-5">
              {property.description && (
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold text-fg">About This Property</h2>
                  <p className="text-sm text-fg-soft leading-relaxed whitespace-pre-line">
                    {property.description}
                  </p>
                </div>
              )}

              {property.amenities.length > 0 && (
                <div className="space-y-2.5 border-t border-edge pt-4 first:border-t-0 first:pt-0">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Building Amenities &amp; Facilities
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {property.amenities.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 text-xs text-fg-soft"
                      >
                        <Check className="h-3.5 w-3.5 text-success-fg shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Units Inventory Section */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-fg">Units in {property.name}</h2>
                <p className="text-xs text-muted">
                  Inspect unit specifications, photos, and move-in requirements before applying
                </p>
              </div>

              {property.rooms.length > vacantRooms.length && vacantRooms.length > 0 && (
                <div className="inline-flex rounded-md border border-edge bg-card p-0.5 self-start">
                  <button
                    type="button"
                    onClick={() => setUnitFilter("available")}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      unitFilter === "available"
                        ? "bg-hover text-fg"
                        : "text-muted hover:text-fg"
                    }`}
                  >
                    Vacant ({vacantRooms.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitFilter("all")}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      unitFilter === "all"
                        ? "bg-hover text-fg"
                        : "text-muted hover:text-fg"
                    }`}
                  >
                    All Listed ({property.rooms.length})
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {displayedRooms.map((room) => (
                <Card
                  key={room.id}
                  className="overflow-hidden hover:border-edge-strong transition-colors"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Room Thumbnail */}
                    <Link
                      to={`/rooms/${room.id}`}
                      className="sm:w-48 h-40 sm:h-auto shrink-0 overflow-hidden bg-inset border-b sm:border-b-0 sm:border-r border-edge"
                    >
                      {room.cover_photo_url ? (
                        <img
                          src={room.cover_photo_url}
                          alt={`Room ${room.room_number}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ListingMediaPlaceholder
                          kind="room"
                          label={`Room ${room.room_number}`}
                          className="h-full w-full min-h-[140px]"
                        />
                      )}
                    </Link>

                    {/* Room Content */}
                    <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 gap-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/rooms/${room.id}`}
                                className="text-base font-semibold text-fg hover:text-accent transition-colors"
                              >
                                Room {room.room_number}
                              </Link>
                              {room.is_available ? (
                                <Badge variant="success" dot>
                                  Vacant
                                </Badge>
                              ) : room.status === "reserved" ? (
                                <Badge variant="warning">Reserved</Badge>
                              ) : (
                                <Badge variant="neutral">Currently Leased</Badge>
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                              <span className="inline-flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                Up to {room.capacity} {room.capacity === 1 ? "person" : "persons"}
                              </span>
                              {room.floor_area != null && (
                                <span className="inline-flex items-center gap-1 tabular-nums">
                                  <Maximize2 className="h-3.5 w-3.5" />
                                  {room.floor_area} sqm
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 tabular-nums">
                                <DoorOpen className="h-3.5 w-3.5" />
                                {room.advance_months} mo advance &middot; {room.deposit_months} mo deposit
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-base font-bold text-fg tabular-nums">
                              {formatCurrency(room.rent)}
                            </p>
                            <p className="text-[11px] text-muted">per month</p>
                          </div>
                        </div>

                        {room.description && (
                          <p className="text-xs text-fg-soft leading-relaxed line-clamp-2">
                            {room.description}
                          </p>
                        )}

                        {room.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {room.amenities.slice(0, 5).map((item) => (
                              <span
                                key={item}
                                className="rounded border border-edge bg-inset px-2 py-0.5 text-[11px] text-fg-soft"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-edge pt-3">
                        <Link to={`/rooms/${room.id}`}>
                          <Button variant="ghost" size="sm">
                            Unit Details
                          </Button>
                        </Link>

                        {room.is_available && (
                          <>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => openVisitForRoom(room)}
                            >
                              <Calendar className="h-3.5 w-3.5" />
                              Schedule Visit
                            </Button>
                            <Link to={`/register?room=${room.id}`}>
                              <Button size="sm" variant="primary">
                                Apply for Unit
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* House Rules */}
          {property.house_rules && (
            <Card className="p-5 sm:p-6 space-y-2.5">
              <div className="flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-muted" />
                <h2 className="text-sm font-semibold text-fg">House Rules &amp; Policies</h2>
              </div>
              <p className="text-xs sm:text-sm text-fg-soft leading-relaxed whitespace-pre-line">
                {property.house_rules}
              </p>
            </Card>
          )}
        </div>

        {/* Sticky Right Column: Contact & Schedule Visit */}
        <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          <ContactLandlordCard
            property={property}
            onScheduleVisit={() => openVisitForRoom(null)}
          />
        </aside>
      </div>

      <ScheduleVisitModal
        open={visitOpen}
        onClose={() => setVisitOpen(false)}
        property={property}
        selectedRoom={selectedRoomForVisit}
        availableRooms={vacantRooms}
      />
    </div>
  );
}
