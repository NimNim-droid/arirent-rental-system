import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  Clock,
  Copy,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { sanitizePhoneHref, type PrimaryLandlordContact } from "./listing-helpers";
import type { PublicProperty } from "@/lib/types";

interface PublicContactSectionProps {
  contact: PrimaryLandlordContact | null;
  properties: PublicProperty[];
  onScheduleVisit: (property: PublicProperty) => void;
}

export function PublicContactSection({
  contact,
  properties,
  onScheduleVisit,
}: PublicContactSectionProps) {
  const [copied, setCopied] = useState(false);
  const dialPhone = sanitizePhoneHref(contact?.contactPhone);

  const handleCopyPhone = async () => {
    if (!contact?.contactPhone) return;
    try {
      await navigator.clipboard.writeText(contact.contactPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <section id="contact" aria-label="Contact leasing office" className="scroll-mt-20 space-y-6">
      <div className="space-y-2 max-w-xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-fg">
          Talk to the leasing office
        </h2>
        <p className="text-sm sm:text-base text-muted">
          Call or message us, or pick a building below to request a viewing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Direct Contact Card */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-edge bg-card p-5 sm:p-6 shadow-card space-y-5">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-edge pb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Leasing Desk
                </p>
                <p className="mt-0.5 text-base font-bold text-fg">
                  {contact?.contactName || "AriRent Property Management"}
                </p>
                {contact && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-faint" />
                    <span>
                      {contact.address}, {contact.city}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent border border-accent-border/60">
                <Phone className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-2.5">
              {dialPhone && contact?.contactPhone && (
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${dialPhone}`}
                    className="flex flex-1 items-center gap-2.5 rounded-xl border border-edge bg-inset px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-fg hover:border-accent hover:text-accent transition-colors"
                  >
                    <Phone className="h-4 w-4 text-accent shrink-0" />
                    <span className="tabular-nums">{contact.contactPhone}</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    aria-label="Copy phone number"
                    title="Copy phone number"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-edge bg-inset text-muted hover:text-fg hover:bg-hover cursor-pointer transition-colors"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-success-fg" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}

              {contact?.contactEmail && (
                <a
                  href={`mailto:${contact.contactEmail}`}
                  className="flex items-center gap-2.5 rounded-xl border border-edge bg-inset px-3.5 py-2.5 text-xs sm:text-sm font-medium text-fg-soft hover:border-accent hover:text-fg transition-colors"
                >
                  <Mail className="h-4 w-4 text-accent shrink-0" />
                  <span className="truncate">{contact.contactEmail}</span>
                </a>
              )}

              {contact?.messengerUrl && (
                <a
                  href={contact.messengerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl border border-edge bg-inset px-3.5 py-2.5 text-xs sm:text-sm font-medium text-fg-soft hover:border-accent hover:text-fg transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-accent shrink-0" />
                  <span>Message on Messenger</span>
                </a>
              )}

              {!dialPhone && !contact?.contactEmail && !contact?.messengerUrl && (
                <p className="rounded-xl border border-edge bg-inset p-3.5 text-xs text-muted leading-relaxed">
                  Select a listed property to book an in-person viewing window and receive direct
                  confirmation from the building manager.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-edge bg-inset/70 px-3.5 py-3 text-xs text-muted">
            <Clock className="h-4 w-4 shrink-0 text-accent" />
            <span>
              In-person unit viewings available <strong className="text-fg">9:00 AM – 7:00 PM</strong>{" "}
              by appointment.
            </span>
          </div>
        </div>

        {/* Building Viewing Quick-Booker */}
        <div className="lg:col-span-7 rounded-2xl border border-edge bg-card p-5 sm:p-6 shadow-card flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-fg">Schedule a Building Viewing</h3>
            <p className="text-xs text-muted">
              Choose a building to request a viewing appointment—no account required.
            </p>
          </div>

          {properties.length > 0 ? (
            <div className="divide-y divide-edge rounded-xl border border-edge bg-inset/40">
              {properties.slice(0, 4).map((property) => (
                <div
                  key={property.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card border border-edge text-accent">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/properties/${property.id}`}
                        className="text-sm font-bold text-fg hover:text-accent transition-colors truncate block"
                      >
                        {property.name}
                      </Link>
                      <p className="text-xs text-muted truncate">
                        {property.city} &middot;{" "}
                        {property.available_rooms_count > 0
                          ? `${property.available_rooms_count} vacant`
                          : "Waitlist / inquiry"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="md"
                      variant="outline"
                      onClick={() => onScheduleVisit(property)}
                      className="h-9 rounded-xl w-full sm:w-auto font-semibold bg-accent-soft/60 hover:bg-accent hover:text-white"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Book Visit</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-edge bg-inset/50 p-5 text-xs text-muted">
              Published buildings will appear here for one-tap viewing requests.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-muted">
            <span>Already inspected a unit and ready to reserve?</span>
            <Link
              to="/register"
              className="inline-flex items-center gap-1 font-semibold text-accent hover:text-accent-strong"
            >
              <span>Submit Rental Application</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
