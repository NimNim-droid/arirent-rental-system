import { type FormEvent } from "react";
import { Check, Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Room } from "@/lib/types";

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

export interface RoomListingFormData {
  rent: string;
  capacity: string;
  floor_area: string;
  advance_months: string;
  deposit_months: string;
  description: string;
  amenities: string[];
  is_listed: boolean;
}

interface EditRoomListingModalProps {
  room: Room | null;
  formData: RoomListingFormData;
  onChange: (next: RoomListingFormData) => void;
  customAmenity: string;
  onCustomAmenityChange: (value: string) => void;
  saving: boolean;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
}

export function EditRoomListingModal({
  room,
  formData,
  onChange,
  customAmenity,
  onCustomAmenityChange,
  saving,
  onSubmit,
  onClose,
}: EditRoomListingModalProps) {
  if (!room) return null;

  const toggleAmenity = (item: string) => {
    const next = formData.amenities.includes(item)
      ? formData.amenities.filter((x) => x !== item)
      : [...formData.amenities, item];
    onChange({ ...formData, amenities: next });
  };

  const addCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (trimmed && !formData.amenities.includes(trimmed)) {
      onChange({ ...formData, amenities: [...formData.amenities, trimmed] });
    }
    onCustomAmenityChange("");
  };

  return (
    <Modal
      open={Boolean(room)}
      onClose={onClose}
      title={`Room ${room.room_number} — Listing Details`}
      maxWidth="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="room-listing-form" loading={saving}>
            Save Unit Listing
          </Button>
        </>
      }
    >
      <form id="room-listing-form" onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          <Input
            id="editRoomRent"
            label="Monthly Rent (₱)"
            type="number"
            min="0"
            step="50"
            value={formData.rent}
            onChange={(e) => onChange({ ...formData, rent: e.target.value })}
            required
          />
          <Input
            id="editRoomCapacity"
            label="Max Occupants"
            type="number"
            min="1"
            max="20"
            value={formData.capacity}
            onChange={(e) => onChange({ ...formData, capacity: e.target.value })}
            required
          />
          <Input
            id="editRoomArea"
            label="Floor Area (sqm)"
            type="number"
            min="1"
            step="0.5"
            placeholder="e.g. 20"
            value={formData.floor_area}
            onChange={(e) => onChange({ ...formData, floor_area: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <Input
            id="editAdvanceMonths"
            label="Advance Rent (Months)"
            type="number"
            min="0"
            max="12"
            value={formData.advance_months}
            onChange={(e) => onChange({ ...formData, advance_months: e.target.value })}
          />
          <Input
            id="editDepositMonths"
            label="Security Deposit (Months)"
            type="number"
            min="0"
            max="12"
            value={formData.deposit_months}
            onChange={(e) => onChange({ ...formData, deposit_months: e.target.value })}
          />
        </div>

        <Textarea
          id="editRoomDesc"
          label="Room Description"
          rows={3}
          placeholder="Describe ventilation, bathroom setup, furnishing, floor level..."
          value={formData.description}
          onChange={(e) => onChange({ ...formData, description: e.target.value })}
        />

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted">
            Room Inclusions (Tap to select)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(new Set([...COMMON_ROOM_AMENITIES, ...formData.amenities])).map((item) => {
              const active = formData.amenities.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleAmenity(item)}
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
              id="customRoomAmenity"
              placeholder="Add custom inclusion..."
              value={customAmenity}
              onChange={(e) => onCustomAmenityChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomAmenity();
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={addCustomAmenity}>
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </div>

        <label className="flex items-center gap-2.5 rounded-lg border border-edge bg-inset p-3 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_listed}
            onChange={(e) => onChange({ ...formData, is_listed: e.target.checked })}
            className="h-4 w-4 rounded border-edge text-accent focus:ring-accent"
          />
          <div>
            <span className="font-semibold text-fg">
              Show this unit on the public listing catalog
            </span>
            <p className="text-muted">
              When checked, prospective tenants can view and apply for this unit whenever it is
              vacant.
            </p>
          </div>
        </label>
      </form>
    </Modal>
  );
}
