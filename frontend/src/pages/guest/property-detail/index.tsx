import { Link, useParams } from "react-router";
import { ArrowLeft, Check, MapPin, ScrollText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ContactLandlordCard,
  MobileListingActionBar,
  PhotoGallery,
  PublicUnitList,
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
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 pb-24 sm:pt-8 lg:pb-10 space-y-8">
      <div className="flex items-center justify-between gap-3 text-xs text-muted">
        <div className="flex items-center gap-1.5 min-w-0">
          <Link to="/" className="hover:text-accent transition-colors inline-flex items-center gap-1 shrink-0 font-medium">
            <ArrowLeft className="h-3.5 w-3.5" />
            All Properties
          </Link>
          <span>/</span>
          <span className="truncate">{property.city}</span>
          <span>/</span>
          <span className="font-semibold text-fg truncate">{property.name}</span>
        </div>

        <Badge
          variant={vacantRooms.length > 0 ? "success" : "neutral"}
          dot
          className="rounded-full px-2.5 py-0.5 shrink-0"
        >
          {vacantRooms.length} of {property.listed_rooms_count} vacant
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-fg">
            {property.name}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="h-4 w-4 shrink-0 text-accent" />
            <span>
              {property.address}, {property.city}
            </span>
          </p>
        </div>

        {property.starting_rent != null && (
          <div className="sm:text-right">
            <p className="text-xs font-medium text-muted">Monthly rent from</p>
            <p className="text-2xl font-extrabold text-accent tabular-nums">
              {formatCurrency(property.starting_rent)}
              <span className="text-xs font-medium text-muted"> / month</span>
            </p>
          </div>
        )}
      </div>

      <PhotoGallery photos={galleryPhotos} title={property.name} kind="property" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
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
                      <div key={item} className="flex items-center gap-2 text-xs text-fg-soft">
                        <Check className="h-3.5 w-3.5 text-success-fg shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          <PublicUnitList
            propertyName={property.name}
            allRoomsCount={property.rooms.length}
            vacantCount={vacantRooms.length}
            displayedRooms={displayedRooms}
            unitFilter={unitFilter}
            onUnitFilterChange={setUnitFilter}
            onScheduleVisit={(room) => openVisitForRoom(room)}
          />

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

        <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          <ContactLandlordCard
            property={property}
            onScheduleVisit={() => openVisitForRoom(null)}
          />
        </aside>
      </div>

      <MobileListingActionBar
        priceLabel="Starts at"
        priceAmount={property.starting_rent}
        onScheduleVisit={() => openVisitForRoom(null)}
        applyHref={vacantRooms[0] ? `/register?room=${vacantRooms[0].id}` : null}
        applyLabel="Apply"
      />

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
