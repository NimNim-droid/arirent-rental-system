import { ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/common/section-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonRows } from "@/components/ui/skeleton";
import type { MaintenanceTicket } from "@/lib/types";

interface TenantTicketListProps {
  tickets: MaintenanceTicket[];
  loading: boolean;
  onSelectTicket: (ticket: MaintenanceTicket) => void;
}

export function TenantTicketList({
  tickets,
  loading,
  onSelectTicket,
}: TenantTicketListProps) {
  const formatId = (t: MaintenanceTicket) =>
    /^\d+$/.test(t.id) ? `#${t.id}` : t.id;

  return (
    <Card className="p-6">
      <SectionHeader
        icon={<ClipboardList className="h-5 w-5" />}
        title="My Request History"
        subtitle="Track the status of your past requests"
      />

      <div className="mt-5 space-y-3">
        {loading ? (
          <SkeletonRows rows={4} />
        ) : tickets.length === 0 ? (
          <EmptyState
            title="No requests yet"
            description="Your submitted repair requests will show up here."
          />
        ) : (
          tickets.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTicket(t)}
              className="w-full rounded-xl border border-edge bg-inset p-4 text-left transition-colors duration-150 hover:border-edge-strong hover:bg-hover/40 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-accent">
                  {formatId(t)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted">{t.date}</span>
                  <Badge
                    dot
                    variant={
                      t.priority === "urgent"
                        ? "danger"
                        : t.status === "resolved"
                        ? "success"
                        : "warning"
                    }
                  >
                    {t.status === "pending"
                      ? "Pending"
                      : t.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
              <p className="mt-2 text-sm font-bold capitalize text-fg">{t.type}</p>
              <p className="mt-0.5 text-sm text-fg-soft line-clamp-2">
                {t.description}
              </p>
              <p className="mt-2 text-[11px] font-bold text-accent">
                View details &rarr;
              </p>
            </button>
          ))
        )}
      </div>
    </Card>
  );
}
