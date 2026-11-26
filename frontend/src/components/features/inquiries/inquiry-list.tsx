import { Link } from "react-router";
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  DoorOpen,
  Mail,
  Phone,
  Smartphone,
  Trash2,
  UserCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonRows } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { INQUIRY_STATUS_META } from "./inquiry-constants";
import type { Inquiry, InquiryStatus } from "@/lib/types";

interface InquiryListProps {
  inquiries: Inquiry[];
  loading: boolean;
  onOpenManageModal: (inquiry: Inquiry, defaultNextStatus?: InquiryStatus) => void;
  onQuickStatus: (inquiry: Inquiry, status: InquiryStatus) => void;
  onDelete: (inquiry: Inquiry) => void;
}

export function InquiryList({
  inquiries,
  loading,
  onOpenManageModal,
  onQuickStatus,
  onDelete,
}: InquiryListProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <SkeletonRows rows={5} />
      </Card>
    );
  }

  if (inquiries.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<CalendarClock className="h-4 w-4" />}
          title="No viewing inquiries in this view"
          description="When prospective tenants request an in-person room viewing on your public listing page, their contact details and preferred dates appear here."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {inquiries.map((inq) => {
        const meta = INQUIRY_STATUS_META[inq.status] || INQUIRY_STATUS_META.new;
        const dialPhone = inq.phone.replace(/[^0-9+]/g, "");

        return (
          <Card key={inq.id} className="p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-fg">{inq.name}</h3>
                  <Badge variant={meta.variant} dot={inq.status === "new"}>
                    {meta.label}
                  </Badge>
                  {inq.created_at && (
                    <span className="text-xs text-muted">
                      Requested {formatDate(inq.created_at)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-fg-soft">
                  <span className="font-medium text-fg">
                    {inq.property?.name ?? `Property #${inq.property_id}`}
                  </span>
                  {inq.room ? (
                    <span className="inline-flex items-center gap-1 rounded border border-edge bg-inset px-2 py-0.5 tabular-nums">
                      <DoorOpen className="h-3 w-3 text-muted" />
                      Room {inq.room.room_number} ({formatCurrency(inq.room.rent)}/mo &middot;{" "}
                      {inq.room.status})
                    </span>
                  ) : (
                    <span className="text-muted">Any available unit</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {dialPhone && (
                  <>
                    <a
                      href={`tel:${dialPhone}`}
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-edge bg-inset px-2.5 text-xs font-medium text-fg hover:border-edge-strong hover:bg-hover transition-colors"
                    >
                      <Phone className="h-3 w-3 text-accent" />
                      <span className="tabular-nums">{inq.phone}</span>
                    </a>
                    <a
                      href={`sms:${dialPhone}`}
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-edge bg-inset px-2 text-xs font-medium text-fg-soft hover:bg-hover transition-colors"
                    >
                      <Smartphone className="h-3 w-3" />
                      SMS
                    </a>
                  </>
                )}
                {inq.email && (
                  <a
                    href={`mailto:${inq.email}`}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-edge bg-inset px-2 text-xs text-fg-soft hover:bg-hover transition-colors"
                    title={inq.email}
                  >
                    <Mail className="h-3 w-3" />
                    Email
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-edge bg-inset p-3 text-xs">
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted">Viewing Schedule</p>
                {inq.scheduled_at ? (
                  <p className="font-semibold text-fg flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-accent" />
                    Confirmed:{" "}
                    {new Date(inq.scheduled_at).toLocaleString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                ) : inq.preferred_date ? (
                  <p className="text-fg">
                    Preferred: <strong>{formatDate(inq.preferred_date)}</strong>
                    {inq.preferred_time ? ` (${inq.preferred_time})` : ""}
                  </p>
                ) : (
                  <p className="text-muted">No specific date selected</p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted">Visitor Message / Notes</p>
                <p className="text-fg-soft leading-relaxed">
                  {inq.message || "No additional message."}
                </p>
              </div>
            </div>

            {inq.admin_notes && (
              <p className="text-xs text-muted">
                <strong className="text-fg-soft">Manager note:</strong> {inq.admin_notes}
              </p>
            )}

            {inq.tenant && (
              <div className="flex items-center justify-between rounded-md border border-success-border bg-success-bg/60 px-3 py-2 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-success-fg">
                  <UserCheck className="h-3.5 w-3.5" />
                  Submitted tenant application for Room {inq.tenant.room} ({inq.tenant.status})
                </span>
                <Link to="/admin/tenants" className="font-semibold text-success-fg hover:underline">
                  Review in Tenants &rarr;
                </Link>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-edge pt-2.5">
              <span className="text-[11px] text-muted">
                {inq.status === "visited"
                  ? "Visitor inspected the property — when they apply online, this automatically converts."
                  : inq.status === "new"
                  ? "Call or text the visitor to confirm their inspection time."
                  : ""}
              </span>

              <div className="flex flex-wrap items-center gap-1.5">
                {inq.status === "new" && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onOpenManageModal(inq, "scheduled")}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Confirm Schedule
                  </Button>
                )}

                {(inq.status === "new" || inq.status === "scheduled") && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onQuickStatus(inq, "visited")}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark Visited
                  </Button>
                )}

                <Button size="sm" variant="ghost" onClick={() => onOpenManageModal(inq)}>
                  Edit / Notes
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted hover:text-danger-fg"
                  onClick={() => onDelete(inq)}
                  title="Delete inquiry"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
