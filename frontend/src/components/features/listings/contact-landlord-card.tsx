import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Calendar,
  Check,
  Copy,
  Mail,
  MessageCircle,
  Phone,
  Smartphone,
  UserCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ContactLandlordCardProps {
  property: {
    id: string;
    name: string;
    contact_name?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
    messenger_url?: string | null;
  };
  applyRoom?: {
    id: string;
    room_number: string;
    is_available: boolean;
  } | null;
  onScheduleVisit: () => void;
}

function normalizeExternalUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function ContactLandlordCard({
  property,
  applyRoom = null,
  onScheduleVisit,
}: ContactLandlordCardProps) {
  const [copied, setCopied] = useState(false);

  const dialPhone = property.contact_phone?.replace(/[^0-9+]/g, "") || null;
  const messengerHref = normalizeExternalUrl(property.messenger_url);
  const contactPerson = property.contact_name || "Property Management Office";

  const copyPhone = async () => {
    if (!property.contact_phone) return;
    try {
      await navigator.clipboard.writeText(property.contact_phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <Card className="p-5 space-y-4">
      {/* Leasing contact identity */}
      <div className="flex items-start justify-between gap-3 border-b border-edge pb-3.5">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Leasing Contact
          </p>
          <p className="mt-0.5 text-sm font-semibold text-fg truncate">{contactPerson}</p>
          <p className="text-xs text-muted truncate">{property.name}</p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-edge bg-inset text-muted">
          <UserCheck className="h-4 w-4" />
        </div>
      </div>

      {/* Primary workflow actions */}
      <div className="space-y-2">
        <Button
          type="button"
          variant={applyRoom?.is_available ? "secondary" : "primary"}
          size="lg"
          onClick={onScheduleVisit}
          className="w-full justify-center font-semibold"
        >
          <Calendar className="h-4 w-4" />
          Schedule an In-Person Visit
        </Button>

        {applyRoom && (
          applyRoom.is_available ? (
            <Link to={`/register?room=${applyRoom.id}`} className="block">
              <Button size="lg" variant="primary" className="w-full justify-center font-semibold">
                Apply for Room {applyRoom.room_number}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button size="lg" variant="secondary" disabled className="w-full justify-center">
              Room {applyRoom.room_number} Not Currently Vacant
            </Button>
          )
        )}
      </div>

      {/* Direct communication channels */}
      {(dialPhone || messengerHref || property.contact_email) && (
        <div className="space-y-2 pt-1">
          <p className="text-[11px] font-medium text-muted">
            Or contact the landlord directly:
          </p>

          {dialPhone && (
            <div className="flex items-center gap-1.5">
              <a
                href={`tel:${dialPhone}`}
                className="flex flex-1 items-center justify-center gap-1.5 h-8 rounded-md border border-edge bg-inset px-2.5 text-xs font-medium text-fg hover:border-edge-strong hover:bg-hover transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-accent" />
                <span className="tabular-nums">{property.contact_phone}</span>
              </a>
              <a
                href={`sms:${dialPhone}`}
                title="Send SMS"
                className="flex h-8 items-center justify-center gap-1 rounded-md border border-edge bg-inset px-2.5 text-xs font-medium text-fg-soft hover:border-edge-strong hover:bg-hover transition-colors"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>SMS</span>
              </a>
              <button
                type="button"
                onClick={copyPhone}
                title="Copy phone number"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-edge bg-inset text-muted hover:text-fg hover:bg-hover cursor-pointer transition-colors"
                aria-label="Copy phone number"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-success-fg" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}

          {messengerHref && (
            <a
              href={messengerHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-edge bg-inset px-3 text-xs font-medium text-fg hover:border-edge-strong hover:bg-hover transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5 text-accent" />
              Message on Messenger
            </a>
          )}

          {property.contact_email && (
            <a
              href={`mailto:${property.contact_email}`}
              className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-edge bg-inset px-3 text-xs font-medium text-fg-soft hover:border-edge-strong hover:bg-hover transition-colors truncate"
            >
              <Mail className="h-3.5 w-3.5 shrink-0 text-muted" />
              <span className="truncate">{property.contact_email}</span>
            </a>
          )}
        </div>
      )}

      <div className="border-t border-edge pt-3 text-[11px] text-muted leading-relaxed">
        We recommend visiting the property first. Submitting an application creates your tenant
        account and reserves the room pending landlord approval.
      </div>
    </Card>
  );
}
