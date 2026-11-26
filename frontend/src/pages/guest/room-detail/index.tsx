import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
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
  PhotoGallery,
  ScheduleVisitModal,
  usePublicRoomDetail,
} from "@/components/features/listings";
import { formatCurrency } from "@/lib/formatters";

export default function PublicRoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { room, loading, error, visitOpen, setVisitOpen, combinedPhotos } =
    usePublicRoomDetail(id);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-80 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (error || !room || !room.property) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <Card>
          <EmptyState
            title="Unit Listing Not Found"
            description={error || "This unit may no longer be listed publicly."}
            action={
              <Link to="/">
                <Button variant="secondary" size="sm">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Browse Available Units
                </Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  const building = room.property;
  const advanceTotal = room.rent * room.advance_months;
  const depositTotal = room.rent * room.deposit_months;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-3 text-xs text-muted">
        <div className="flex items-center gap-1.5 min-w-0">
          <Link to="/" className="hover:text-fg transition-colors shrink-0">
            Listings
          </Link>
          <span>/</span>
          <Link
            to={`/properties/${building.id}`}
            className="hover:text-fg transition-colors truncate"
          >
            {building.name}
          </Link>
          <span>/</span>
          <span className="font-medium text-fg shrink-0">Room {room.room_number}</span>
        </div>

        {room.is_available ? (
          <Badge variant="success" dot>
            Vacant &amp; Open for Application
          </Badge>
        ) : room.status === "reserved" ? (
          <Badge variant="warning">Reserved Pending Approval</Badge>
        ) : (
          <Badge variant="neutral">Currently Occupied</Badge>
        )}
      </div>

      {/* Title & Rate Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg">
            Room {room.room_number} &mdash; {building.name}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="h-4 w-4 shrink-0 text-faint" />
            <span>
              {building.address}, {building.city}
            </span>
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-2xl font-bold text-fg tabular-nums">
            {formatCurrency(room.rent)}
            <span className="text-xs font-normal text-muted"> / month</span>
          </p>
          <p className="text-xs text-muted tabular-nums">
            {room.advance_months} mo advance + {room.deposit_months} mo deposit
          </p>
        </div>
      </div>

      {/* Gallery */}
      <PhotoGallery
        photos={combinedPhotos}
        title={`Room ${room.room_number} — ${building.name}`}
        kind="room"
      />

      {/* Two-Column Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Specs Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3.5">
              <p className="text-[11px] text-muted">Unit Number</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-fg">
                <DoorOpen className="h-4 w-4 text-muted" />
                Room {room.room_number}
              </p>
            </Card>
            <Card className="p-3.5">
              <p className="text-[11px] text-muted">Max Occupancy</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-fg tabular-nums">
                <Users className="h-4 w-4 text-muted" />
                {room.capacity} {room.capacity === 1 ? "Person" : "Persons"}
              </p>
            </Card>
            <Card className="p-3.5">
              <p className="text-[11px] text-muted">Floor Area</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-fg tabular-nums">
                <Maximize2 className="h-4 w-4 text-muted" />
                {room.floor_area != null ? `${room.floor_area} sqm` : "Standard studio"}
              </p>
            </Card>
            <Card className="p-3.5">
              <p className="text-[11px] text-muted">Availability</p>
              <p className="mt-1 text-sm font-semibold text-fg">
                {room.is_available
                  ? "Ready for viewing"
                  : room.status === "reserved"
                  ? "Application pending"
                  : "Occupied"}
              </p>
            </Card>
          </div>

          {/* Unit Description & Amenities */}
          <Card className="p-5 sm:p-6 space-y-5">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-fg">Unit Description</h2>
              <p className="text-sm text-fg-soft leading-relaxed whitespace-pre-line">
                {room.description ||
                  `Standard residential unit inside ${building.name}. Schedule a viewing with the property manager to inspect the room layout, ventilation, and sub-meter setup in person.`}
              </p>
            </div>

            {room.amenities.length > 0 && (
              <div className="space-y-2.5 border-t border-edge pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Room Inclusions &amp; Features
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {room.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 text-xs text-fg-soft">
                      <Check className="h-3.5 w-3.5 text-success-fg shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {building.amenities.length > 0 && (
              <div className="space-y-2.5 border-t border-edge pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Shared Building Facilities
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {building.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 text-xs text-fg-soft">
                      <Check className="h-3.5 w-3.5 text-muted shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Transparent Move-In Cost Summary */}
          <Card className="p-5 sm:p-6 space-y-3.5">
            <div>
              <h2 className="text-sm font-semibold text-fg">Estimated Move-In Terms</h2>
              <p className="text-xs text-muted mt-0.5">
                Payable only after the landlord approves your application
              </p>
            </div>

            <div className="divide-y divide-edge rounded-lg border border-edge bg-inset text-xs">
              <div className="flex items-center justify-between px-3.5 py-2.5">
                <span className="text-fg-soft">Monthly Base Rent</span>
                <span className="font-medium text-fg tabular-nums">
                  {formatCurrency(room.rent)}
                </span>
              </div>
              <div className="flex items-center justify-between px-3.5 py-2.5">
                <span className="text-fg-soft">
                  Advance Rent ({room.advance_months}{" "}
                  {room.advance_months === 1 ? "month" : "months"})
                </span>
                <span className="font-medium text-fg tabular-nums">
                  {formatCurrency(advanceTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between px-3.5 py-2.5">
                <span className="text-fg-soft">
                  Security Deposit ({room.deposit_months}{" "}
                  {room.deposit_months === 1 ? "month" : "months"})
                </span>
                <span className="font-medium text-fg tabular-nums">
                  {formatCurrency(depositTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between px-3.5 py-3 bg-card font-semibold text-fg">
                <span>Estimated Initial Move-In Total</span>
                <span className="text-sm tabular-nums">{formatCurrency(room.move_in_total)}</span>
              </div>
            </div>

            <p className="text-[11px] text-muted leading-relaxed">
              Electricity and water charges are billed monthly based on actual sub-meter readings and
              building utility rates once your lease starts.
            </p>
          </Card>

          {/* House Rules */}
          {building.house_rules && (
            <Card className="p-5 sm:p-6 space-y-2.5">
              <div className="flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-muted" />
                <h2 className="text-sm font-semibold text-fg">Building House Rules</h2>
              </div>
              <p className="text-xs sm:text-sm text-fg-soft leading-relaxed whitespace-pre-line">
                {building.house_rules}
              </p>
            </Card>
          )}

          {/* Other Vacant Units in Same Building */}
          {building.other_available_rooms.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-fg">
                  Other Vacant Units in {building.name}
                </h2>
                <Link
                  to={`/properties/${building.id}`}
                  className="text-xs font-medium text-accent hover:text-accent-strong"
                >
                  View building &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {building.other_available_rooms.slice(0, 4).map((sibling) => (
                  <Link key={sibling.id} to={`/rooms/${sibling.id}`}>
                    <Card className="p-3.5 flex items-center justify-between gap-3 hover:border-edge-strong transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-fg">
                          Room {sibling.room_number}
                        </p>
                        <p className="text-xs text-muted">
                          Up to {sibling.capacity}{" "}
                          {sibling.capacity === 1 ? "person" : "persons"}
                          {sibling.floor_area != null ? ` · ${sibling.floor_area} sqm` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-fg tabular-nums">
                          {formatCurrency(sibling.rent)}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Right Column */}
        <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          <ContactLandlordCard
            property={building}
            applyRoom={{
              id: room.id,
              room_number: room.room_number,
              is_available: room.is_available,
            }}
            onScheduleVisit={() => setVisitOpen(true)}
          />
        </aside>
      </div>

      <ScheduleVisitModal
        open={visitOpen}
        onClose={() => setVisitOpen(false)}
        property={building}
        selectedRoom={{
          id: room.id,
          room_number: room.room_number,
          rent: room.rent,
        }}
      />
    </div>
  );
}
