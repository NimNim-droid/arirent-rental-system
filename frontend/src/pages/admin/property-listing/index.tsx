import { useRef } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  DoorOpen,
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  ImagePlus,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { PageShellSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ListingMediaPlaceholder,
  useAdminPropertyListing,
} from "@/components/features/listings";
import { formatCurrency } from "@/lib/formatters";

const COMMON_BUILDING_AMENITIES = [
  "24/7 CCTV",
  "Fiber WiFi Ready",
  "Sub-metered Electricity",
  "Own Water Sub-meter",
  "Lobby Guard",
  "Keycard Entry",
  "Laundry Area",
  "Study Lounge",
  "Motorcycle / Car Parking",
  "Pet Friendly",
];

const COMMON_ROOM_AMENITIES = [
  "Private CR",
  "Aircon Included",
  "Aircon Provision",
  "Kitchenette / Sink",
  "Water Heater",
  "Study Desk",
  "Built-in Wardrobe",
  "Bed Frame",
  "Balcony",
  "Fiber Port",
];

export default function AdminPropertyListingPage() {
  const { id } = useParams<{ id: string }>();
  const {
    property,
    loading,
    savingProfile,
    uploadingTarget,
    photoActionId,
    error,
    successMsg,
    profileForm,
    setProfileForm,
    customBuildingAmenity,
    setCustomBuildingAmenity,
    editingRoom,
    setEditingRoom,
    savingRoom,
    customRoomAmenity,
    setCustomRoomAmenity,
    roomForm,
    setRoomForm,
    handleSaveProfile,
    handleUploadPhotos,
    handleSetCover,
    handleDeletePhoto,
    handleToggleRoomListed,
    openRoomEditor,
    handleSaveRoom,
  } = useAdminPropertyListing(id);

  const buildingFileRef = useRef<HTMLInputElement>(null);
  const roomFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const toggleItem = (list: string[], item: string): string[] =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  if (loading) {
    return <PageShellSkeleton />;
  }

  if (!property) {
    return (
      <Card>
        <EmptyState
          title="Building Not Found"
          description={error || "Return to Properties & Units to select a valid building."}
          action={
            <Link to="/admin/properties">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Properties
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const buildingPhotos = property.photos ?? [];
  const rooms = property.rooms ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Link to="/admin/properties" className="inline-flex items-center gap-1 hover:text-fg">
          <ArrowLeft className="h-3.5 w-3.5" />
          Properties &amp; Units
        </Link>
        <span>/</span>
        <span className="text-fg font-medium">{property.name}</span>
      </div>

      <PageHeader
        title={`${property.name} — Public Listing`}
        subtitle="Upload building and room photos, set landlord contact details, and control which rooms appear publicly"
        action={
          <Link
            to={`/properties/${property.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" size="sm">
              <ExternalLink className="h-3.5 w-3.5" />
              Preview Public Page
            </Button>
          </Link>
        }
      />

      {successMsg && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md border border-success-border bg-success-bg px-3.5 py-2.5 text-xs font-medium text-success-fg"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-danger-border bg-danger-bg px-3.5 py-2.5 text-xs font-medium text-danger-fg">
          {error}
        </div>
      )}

      {/* 1. Building Photos */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-fg">1. Building Photos</h2>
            <p className="text-xs text-muted">
              Show the building exterior, hallway, gate, or shared facilities. The Cover photo appears first on the catalog.
            </p>
          </div>

          <div>
            <input
              ref={buildingFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                handleUploadPhotos(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              size="sm"
              loading={uploadingTarget === "building"}
              onClick={() => buildingFileRef.current?.click()}
            >
              <ImagePlus className="h-3.5 w-3.5" />
              Upload Building Photos
            </Button>
          </div>
        </div>

        {buildingPhotos.length === 0 ? (
          <ListingMediaPlaceholder
            kind="property"
            label="No building photos yet — click Upload Building Photos to add exterior or common-area photos"
            className="h-40 w-full rounded-lg border border-dashed border-edge-strong"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {buildingPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-lg border border-edge bg-inset"
              >
                <img
                  src={photo.url || ""}
                  alt="Building"
                  className="h-32 w-full object-cover"
                />
                {photo.is_cover && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-card/95 px-1.5 py-0.5 text-[10px] font-semibold text-fg border border-edge">
                    <Star className="h-2.5 w-2.5 text-brand-gold fill-current" />
                    Cover
                  </span>
                )}
                <div className="flex items-center justify-between gap-1 border-t border-edge bg-card px-2 py-1.5">
                  {!photo.is_cover ? (
                    <button
                      type="button"
                      disabled={photoActionId === photo.id}
                      onClick={() => handleSetCover(photo)}
                      className="text-[11px] font-medium text-accent hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Set as cover
                    </button>
                  ) : (
                    <span className="text-[11px] text-muted">Primary photo</span>
                  )}
                  <button
                    type="button"
                    disabled={photoActionId === photo.id}
                    onClick={() => handleDeletePhoto(photo)}
                    className="rounded p-1 text-muted hover:bg-danger-bg hover:text-danger-fg cursor-pointer disabled:opacity-50"
                    title="Delete photo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 2. Building Profile, Contact & House Rules */}
      <Card className="p-5 sm:p-6">
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-fg">
              2. Landlord Contact Details &amp; Building Information
            </h2>
            <p className="text-xs text-muted">
              Prospective tenants use these contact buttons to call, text, or message you before visiting.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              id="listingPropName"
              label="Building Name"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              required
            />
            <Input
              id="listingPropCity"
              label="City / Municipality"
              value={profileForm.city}
              onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
              required
            />
            <Input
              id="listingPropAddress"
              label="Street Address"
              value={profileForm.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              id="contactName"
              label="Contact Person Name"
              placeholder="e.g. Maria Santos (Owner)"
              value={profileForm.contact_name}
              onChange={(e) => setProfileForm({ ...profileForm, contact_name: e.target.value })}
            />
            <Input
              id="contactPhone"
              label="Mobile Number (Call & SMS)"
              placeholder="0917-123-4567"
              value={profileForm.contact_phone}
              onChange={(e) => setProfileForm({ ...profileForm, contact_phone: e.target.value })}
            />
            <Input
              id="messengerUrl"
              label="Facebook Messenger Link"
              placeholder="https://m.me/yourpage"
              value={profileForm.messenger_url}
              onChange={(e) => setProfileForm({ ...profileForm, messenger_url: e.target.value })}
            />
            <Input
              id="contactEmail"
              label="Leasing Email (Optional)"
              type="email"
              placeholder="leasing@example.com"
              value={profileForm.contact_email}
              onChange={(e) => setProfileForm({ ...profileForm, contact_email: e.target.value })}
            />
          </div>

          <Textarea
            id="propDescription"
            label="Building Description"
            rows={3}
            placeholder="Describe nearby landmarks, transport access, security, and who the building is ideal for..."
            value={profileForm.description}
            onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
          />

          {/* Tap-to-select Building Amenities */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-muted">
              Building Amenities (Tap to select)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(
                new Set([...COMMON_BUILDING_AMENITIES, ...profileForm.amenities])
              ).map((item) => {
                const active = profileForm.amenities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setProfileForm({
                        ...profileForm,
                        amenities: toggleItem(profileForm.amenities, item),
                      })
                    }
                    className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-edge bg-inset text-fg-soft hover:border-edge-strong"
                    }`}
                  >
                    {active && <Check className="h-3 w-3" />}
                    {item}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 max-w-sm pt-1">
              <Input
                id="customBuildingAmenity"
                placeholder="Add custom amenity..."
                value={customBuildingAmenity}
                onChange={(e) => setCustomBuildingAmenity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const trimmed = customBuildingAmenity.trim();
                    if (trimmed && !profileForm.amenities.includes(trimmed)) {
                      setProfileForm({
                        ...profileForm,
                        amenities: [...profileForm.amenities, trimmed],
                      });
                    }
                    setCustomBuildingAmenity("");
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => {
                  const trimmed = customBuildingAmenity.trim();
                  if (trimmed && !profileForm.amenities.includes(trimmed)) {
                    setProfileForm({
                      ...profileForm,
                      amenities: [...profileForm.amenities, trimmed],
                    });
                  }
                  setCustomBuildingAmenity("");
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          </div>

          <Textarea
            id="propHouseRules"
            label="House Rules (Curfew, Visitors, Pets, Smoking)"
            rows={3}
            placeholder="e.g. Visitors allowed until 10:00 PM. No smoking inside rooms."
            value={profileForm.house_rules}
            onChange={(e) => setProfileForm({ ...profileForm, house_rules: e.target.value })}
          />

          <div className="flex justify-end border-t border-edge pt-4">
            <Button type="submit" loading={savingProfile}>
              Save Building Profile
            </Button>
          </div>
        </form>
      </Card>

      {/* 3. Per-Room Listing & Photos */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-fg">
            3. Individual Units &amp; Room Photos ({rooms.length})
          </h2>
          <p className="text-xs text-muted">
            Vacant units with &ldquo;Listed&rdquo; enabled automatically appear for online viewing and applications. When a tenant vacates later, the unit automatically re-lists.
          </p>
        </div>

        {rooms.length === 0 ? (
          <EmptyState
            icon={<DoorOpen className="h-4 w-4" />}
            title="No units added to this building yet"
            description="Add rooms on the Properties & Units page first, then upload their photos and inclusions here."
            action={
              <Link to="/admin/properties">
                <Button size="sm">Go to Properties &amp; Units</Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-edge border-t border-edge">
            {rooms.map((room) => {
              const roomPhotos = room.photos ?? [];
              const isListed = room.is_listed !== false;

              return (
                <div key={room.id} className="py-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-fg">
                          Room {room.room_number}
                        </span>
                        <span className="text-sm font-bold text-fg tabular-nums">
                          {formatCurrency(room.rent)}/mo
                        </span>
                        <Badge
                          variant={
                            room.status === "vacant"
                              ? "success"
                              : room.status === "reserved"
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {room.status}
                        </Badge>
                        <Badge variant={isListed ? "info" : "neutral"}>
                          {isListed ? "Listed publicly" : "Hidden from public"}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted">
                        Capacity: {room.capacity ?? 1} &middot;{" "}
                        {room.floor_area != null ? `${room.floor_area} sqm · ` : ""}
                        {room.advance_months ?? 1} mo advance, {room.deposit_months ?? 1} mo deposit
                        {(room.amenities?.length ?? 0) > 0
                          ? ` · ${room.amenities!.join(", ")}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={(el) => {
                          roomFileRefs.current[room.id] = el;
                        }}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          handleUploadPhotos(e.target.files, room.id);
                          e.target.value = "";
                        }}
                      />

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        loading={uploadingTarget === `room-${room.id}`}
                        onClick={() => roomFileRefs.current[room.id]?.click()}
                      >
                        <ImagePlus className="h-3.5 w-3.5" />
                        Add Photos
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openRoomEditor(room)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit Inclusions
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRoomListed(room)}
                      >
                        {isListed ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            Publish
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {roomPhotos.length > 0 && (
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                      {roomPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md border border-edge bg-inset group"
                        >
                          <img
                            src={photo.url || ""}
                            alt={`Room ${room.room_number}`}
                            className="h-full w-full object-cover"
                          />
                          {photo.is_cover && (
                            <span className="absolute left-1 top-1 rounded bg-card/90 px-1 py-0.5 text-[9px] font-semibold text-fg">
                              Cover
                            </span>
                          )}
                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-slate-950/75 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            {!photo.is_cover ? (
                              <button
                                type="button"
                                onClick={() => handleSetCover(photo)}
                                className="hover:underline cursor-pointer"
                              >
                                Cover
                              </button>
                            ) : (
                              <span>Main</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeletePhoto(photo)}
                              className="text-rose-300 hover:text-rose-200 cursor-pointer"
                              title="Remove photo"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Edit Room Listing Modal */}
      {editingRoom && (
        <Modal
          open={Boolean(editingRoom)}
          onClose={() => setEditingRoom(null)}
          title={`Room ${editingRoom.room_number} — Listing Details`}
          maxWidth="lg"
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingRoom(null)}
                disabled={savingRoom}
              >
                Cancel
              </Button>
              <Button type="submit" form="room-listing-form" loading={savingRoom}>
                Save Unit Listing
              </Button>
            </>
          }
        >
          <form id="room-listing-form" onSubmit={handleSaveRoom} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              <Input
                id="editRoomRent"
                label="Monthly Rent (₱)"
                type="number"
                min="0"
                step="50"
                value={roomForm.rent}
                onChange={(e) => setRoomForm({ ...roomForm, rent: e.target.value })}
                required
              />
              <Input
                id="editRoomCapacity"
                label="Max Occupants"
                type="number"
                min="1"
                max="20"
                value={roomForm.capacity}
                onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                required
              />
              <Input
                id="editRoomArea"
                label="Floor Area (sqm)"
                type="number"
                min="1"
                step="0.5"
                placeholder="e.g. 20"
                value={roomForm.floor_area}
                onChange={(e) => setRoomForm({ ...roomForm, floor_area: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <Input
                id="editAdvanceMonths"
                label="Advance Rent (Months)"
                type="number"
                min="0"
                max="12"
                value={roomForm.advance_months}
                onChange={(e) => setRoomForm({ ...roomForm, advance_months: e.target.value })}
              />
              <Input
                id="editDepositMonths"
                label="Security Deposit (Months)"
                type="number"
                min="0"
                max="12"
                value={roomForm.deposit_months}
                onChange={(e) => setRoomForm({ ...roomForm, deposit_months: e.target.value })}
              />
            </div>

            <Textarea
              id="editRoomDesc"
              label="Room Description"
              rows={3}
              placeholder="Describe ventilation, bathroom setup, furnishing, floor level..."
              value={roomForm.description}
              onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
            />

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted">
                Room Inclusions (Tap to select)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set([...COMMON_ROOM_AMENITIES, ...roomForm.amenities])).map(
                  (item) => {
                    const active = roomForm.amenities.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setRoomForm({
                            ...roomForm,
                            amenities: toggleItem(roomForm.amenities, item),
                          })
                        }
                        className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                          active
                            ? "border-accent bg-accent-soft text-accent"
                            : "border-edge bg-inset text-fg-soft hover:border-edge-strong"
                        }`}
                      >
                        {active && <Check className="h-3 w-3" />}
                        {item}
                      </button>
                    );
                  }
                )}
              </div>

              <div className="flex items-center gap-2 max-w-sm pt-1">
                <Input
                  id="customRoomAmenity"
                  placeholder="Add custom inclusion..."
                  value={customRoomAmenity}
                  onChange={(e) => setCustomRoomAmenity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const trimmed = customRoomAmenity.trim();
                      if (trimmed && !roomForm.amenities.includes(trimmed)) {
                        setRoomForm({
                          ...roomForm,
                          amenities: [...roomForm.amenities, trimmed],
                        });
                      }
                      setCustomRoomAmenity("");
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const trimmed = customRoomAmenity.trim();
                    if (trimmed && !roomForm.amenities.includes(trimmed)) {
                      setRoomForm({
                        ...roomForm,
                        amenities: [...roomForm.amenities, trimmed],
                      });
                    }
                    setCustomRoomAmenity("");
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </div>

            <label className="flex items-center gap-2.5 rounded-lg border border-edge bg-inset p-3 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={roomForm.is_listed}
                onChange={(e) => setRoomForm({ ...roomForm, is_listed: e.target.checked })}
                className="h-4 w-4 rounded border-edge text-accent focus:ring-accent"
              />
              <div>
                <span className="font-semibold text-fg">
                  Show this unit on the public listing catalog
                </span>
                <p className="text-muted">
                  When checked, prospective tenants can view and apply for this unit whenever it is vacant.
                </p>
              </div>
            </label>
          </form>
        </Modal>
      )}
    </div>
  );
}
