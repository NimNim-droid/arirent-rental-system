import { type FormEvent } from "react";
import { Check, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

export interface BuildingProfileFormData {
  name: string;
  city: string;
  address: string;
  description: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  messenger_url: string;
  house_rules: string;
  amenities: string[];
}

interface BuildingProfileFormProps {
  formData: BuildingProfileFormData;
  onChange: (next: BuildingProfileFormData) => void;
  customAmenity: string;
  onCustomAmenityChange: (value: string) => void;
  saving: boolean;
  onSubmit: (e: FormEvent) => void;
}

export function BuildingProfileForm({
  formData,
  onChange,
  customAmenity,
  onCustomAmenityChange,
  saving,
  onSubmit,
}: BuildingProfileFormProps) {
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
    <Card className="p-5 sm:p-6">
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-fg">
            2. Landlord Contact Details &amp; Building Information
          </h2>
          <p className="text-xs text-muted">
            Prospective tenants use these contact buttons to call, text, or message you before
            visiting.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            id="listingPropName"
            label="Building Name"
            value={formData.name}
            onChange={(e) => onChange({ ...formData, name: e.target.value })}
            required
          />
          <Input
            id="listingPropCity"
            label="City / Municipality"
            value={formData.city}
            onChange={(e) => onChange({ ...formData, city: e.target.value })}
            required
          />
          <Input
            id="listingPropAddress"
            label="Street Address"
            value={formData.address}
            onChange={(e) => onChange({ ...formData, address: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            id="contactName"
            label="Contact Person Name"
            placeholder="e.g. Maria Santos (Owner)"
            value={formData.contact_name}
            onChange={(e) => onChange({ ...formData, contact_name: e.target.value })}
          />
          <Input
            id="contactPhone"
            label="Mobile Number (Call & SMS)"
            placeholder="0917-123-4567"
            value={formData.contact_phone}
            onChange={(e) => onChange({ ...formData, contact_phone: e.target.value })}
          />
          <Input
            id="messengerUrl"
            label="Facebook Messenger Link"
            placeholder="https://m.me/yourpage"
            value={formData.messenger_url}
            onChange={(e) => onChange({ ...formData, messenger_url: e.target.value })}
          />
          <Input
            id="contactEmail"
            label="Leasing Email (Optional)"
            type="email"
            placeholder="leasing@example.com"
            value={formData.contact_email}
            onChange={(e) => onChange({ ...formData, contact_email: e.target.value })}
          />
        </div>

        <Textarea
          id="propDescription"
          label="Building Description"
          rows={3}
          placeholder="Describe nearby landmarks, transport access, security, and who the building is ideal for..."
          value={formData.description}
          onChange={(e) => onChange({ ...formData, description: e.target.value })}
        />

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted">
            Building Amenities (Tap to select)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(new Set([...COMMON_BUILDING_AMENITIES, ...formData.amenities])).map(
              (item) => {
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
              }
            )}
          </div>

          <div className="flex items-center gap-2 max-w-sm pt-1">
            <Input
              id="customBuildingAmenity"
              placeholder="Add custom amenity..."
              value={customAmenity}
              onChange={(e) => onCustomAmenityChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomAmenity();
                }
              }}
            />
            <Button type="button" variant="secondary" size="md" onClick={addCustomAmenity}>
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
          value={formData.house_rules}
          onChange={(e) => onChange({ ...formData, house_rules: e.target.value })}
        />

        <div className="flex justify-end border-t border-edge pt-4">
          <Button type="submit" loading={saving}>
            Save Building Profile
          </Button>
        </div>
      </form>
    </Card>
  );
}
