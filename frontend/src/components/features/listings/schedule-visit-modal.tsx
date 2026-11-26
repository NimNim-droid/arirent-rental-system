import { useEffect, useState, type FormEvent } from "react";
import { Calendar, CheckCircle2, Phone } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { inquiriesService } from "@/lib/services/inquiries";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { loadProspectDraft, saveProspectDraft } from "./prospect-storage";
import type { Inquiry, PreferredVisitTime, PublicRoom } from "@/lib/types";

interface ScheduleVisitModalProps {
  open: boolean;
  onClose: () => void;
  property: {
    id: string;
    name: string;
    address: string;
    contact_phone?: string | null;
  };
  /** Pre-selected room when opened from a specific unit card or room page */
  selectedRoom?: {
    id: string;
    room_number: string;
    rent: number;
  } | null;
  /** Optional list of rooms in the property so the visitor can choose one */
  availableRooms?: PublicRoom[];
}

export function ScheduleVisitModal({
  open,
  onClose,
  property,
  selectedRoom = null,
  availableRooms = [],
}: ScheduleVisitModalProps) {
  const todayIso = new Date().toISOString().split("T")[0];

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState(selectedRoom?.id ?? "");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState<PreferredVisitTime | "">("afternoon");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedInquiry, setSubmittedInquiry] = useState<Inquiry | null>(null);

  useEffect(() => {
    if (!open) return;
    setSubmittedInquiry(null);
    setError("");
    setRoomId(selectedRoom?.id ?? "");

    const saved = loadProspectDraft();
    if (saved) {
      setName((prev) => prev || saved.name || "");
      setPhone((prev) => prev || saved.phone || "");
      setEmail((prev) => prev || saved.email || "");
    }
  }, [open, selectedRoom?.id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await inquiriesService.submitPublicInquiry({
        property_id: property.id,
        room_id: roomId || null,
        name,
        phone,
        email,
        preferred_date: preferredDate || undefined,
        preferred_time: preferredTime || undefined,
        message,
      });

      saveProspectDraft({
        inquiry_id: res.data.id,
        property_id: property.id,
        room_id: roomId || undefined,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
      });

      setSubmittedInquiry(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to send your viewing request. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  if (submittedInquiry) {
    const cleanPhone = property.contact_phone?.replace(/[^0-9+]/g, "");

    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Viewing Request Sent"
        footer={
          <Button onClick={onClose} className="w-full sm:w-auto">
            Done
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-success-border bg-success-bg p-3.5">
            <CheckCircle2 className="h-5 w-5 text-success-fg shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-fg">
              <p className="font-semibold text-success-fg">
                The property manager has received your inquiry.
              </p>
              <p className="mt-0.5 text-fg-soft">
                They will reach out to <strong>{submittedInquiry.phone}</strong> to confirm your
                inspection schedule for <strong>{property.name}</strong>.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-edge bg-inset p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted">Property</span>
              <span className="font-medium text-fg">{property.name}</span>
            </div>
            {submittedInquiry.room && (
              <div className="flex items-center justify-between">
                <span className="text-muted">Unit to Inspect</span>
                <span className="font-medium text-fg">
                  Room {submittedInquiry.room.room_number} ({formatCurrency(submittedInquiry.room.rent)}/mo)
                </span>
              </div>
            )}
            {submittedInquiry.preferred_date && (
              <div className="flex items-center justify-between">
                <span className="text-muted">Preferred Date</span>
                <span className="font-medium text-fg">
                  {formatDate(submittedInquiry.preferred_date)}
                  {submittedInquiry.preferred_time
                    ? ` (${submittedInquiry.preferred_time})`
                    : ""}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Note: Scheduling a visit does not lock or charge for the room. Once you inspect the unit
            in person and decide to rent it, click <strong className="text-fg">Apply for Unit</strong>{" "}
            to create your resident account and reserve the room.
          </p>

          {cleanPhone && (
            <div className="pt-1">
              <a
                href={`tel:${cleanPhone}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-strong"
              >
                <Phone className="h-3.5 w-3.5" />
                Need an immediate answer? Call {property.contact_phone}
              </a>
            </div>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule an In-Person Viewing"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="schedule-visit-form" loading={submitting}>
            <Calendar className="h-3.5 w-3.5" />
            Request Viewing
          </Button>
        </>
      }
    >
      <form id="schedule-visit-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-edge bg-inset px-3.5 py-2.5 text-xs">
          <p className="font-semibold text-fg">{property.name}</p>
          <p className="text-muted mt-0.5">{property.address}</p>
        </div>

        {error && (
          <div className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-xs font-medium text-danger-fg">
            {error}
          </div>
        )}

        {selectedRoom ? (
          <div className="flex items-center justify-between rounded-md border border-edge px-3 py-2 text-xs">
            <span className="text-muted">Selected Unit</span>
            <span className="font-semibold text-fg tabular-nums">
              Room {selectedRoom.room_number} &middot; {formatCurrency(selectedRoom.rent)}/mo
            </span>
          </div>
        ) : (
          availableRooms.length > 0 && (
            <Select
              id="visitRoom"
              label="Unit You Want to See (Optional)"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            >
              <option value="">Any available unit in this building</option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.room_number} — {formatCurrency(r.rent)}/mo
                  {r.is_available ? " (Vacant)" : ` (${r.status})`}
                </option>
              ))}
            </Select>
          )
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            id="visitorName"
            label="Your Full Name"
            placeholder="e.g. Maria Clara"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            id="visitorPhone"
            label="Mobile Number"
            placeholder="0917-123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <Input
          id="visitorEmail"
          label="Email Address (Optional)"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            id="visitDate"
            label="Preferred Visit Date"
            type="date"
            min={todayIso}
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
          />
          <Select
            id="visitTime"
            label="Preferred Time Window"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value as PreferredVisitTime | "")}
          >
            <option value="morning">Morning (9:00 AM – 12:00 PM)</option>
            <option value="afternoon">Afternoon (1:00 PM – 5:00 PM)</option>
            <option value="evening">Early Evening (5:00 PM – 7:00 PM)</option>
          </Select>
        </div>

        <Textarea
          id="visitMessage"
          label="Questions or Notes for the Landlord (Optional)"
          rows={3}
          placeholder="e.g. Target move-in date, number of occupants, parking inquiry..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <p className="text-[11px] text-muted leading-relaxed">
          No account is needed to request a viewing, and inquiring will not reserve or charge you for
          the room.
        </p>
      </form>
    </Modal>
  );
}
