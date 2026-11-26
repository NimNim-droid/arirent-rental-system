import type { BadgeProps } from "@/components/ui/badge";
import type { InquiryStatus } from "@/lib/types";

export const INQUIRY_STATUS_META: Record<
  InquiryStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  new: { label: "New Request", variant: "warning" },
  scheduled: { label: "Visit Scheduled", variant: "info" },
  visited: { label: "Visited Property", variant: "success" },
  converted: { label: "Applied as Tenant", variant: "success" },
  cancelled: { label: "Closed / Cancelled", variant: "neutral" },
};

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: INQUIRY_STATUS_META.new.label,
  scheduled: INQUIRY_STATUS_META.scheduled.label,
  visited: INQUIRY_STATUS_META.visited.label,
  converted: INQUIRY_STATUS_META.converted.label,
  cancelled: INQUIRY_STATUS_META.cancelled.label,
};

export const INQUIRY_TABS: Array<{ key: string; label: string }> = [
  { key: "open", label: "Open Follow-ups" },
  { key: "new", label: "New" },
  { key: "scheduled", label: "Scheduled" },
  { key: "visited", label: "Visited" },
  { key: "converted", label: "Converted" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
];
