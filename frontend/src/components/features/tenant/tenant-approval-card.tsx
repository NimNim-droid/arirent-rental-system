import { UserCheck, UserX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/formatters";
import type { Tenant } from "@/lib/types";

interface TenantApprovalCardProps {
  applicant: Tenant;
  isBusy: boolean;
  onApprove: (applicant: Tenant) => void;
  onReject: (applicant: Tenant) => void;
}

export function TenantApprovalCard({
  applicant,
  isBusy,
  onApprove,
  onReject,
}: TenantApprovalCardProps) {
  return (
    <Card className="p-5 border-warning-border bg-warning-bg/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-fg">{applicant.name}</h3>
          <p className="text-xs text-muted mt-0.5">
            Applied: {formatDate(applicant.created_at)}
          </p>
          <div className="mt-3 space-y-1 text-xs text-muted">
            <p>
              <strong className="text-fg-soft">Room Requested:</strong> Room{" "}
              {applicant.room} ({applicant.property_name})
            </p>
            <p className="truncate">
              <strong className="text-fg-soft">Contact:</strong> {applicant.phone}{" "}
              • {applicant.email}
            </p>
          </div>
        </div>
        <Badge variant="warning" dot>
          Awaiting Approval
        </Badge>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-warning-border/40 pt-3">
        <Button
          size="sm"
          className="flex-1"
          loading={isBusy}
          onClick={() => onApprove(applicant)}
        >
          {!isBusy && (
            <>
              <UserCheck className="h-4 w-4" />
              Approve
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          loading={isBusy}
          onClick={() => onReject(applicant)}
          className="text-danger-fg hover:bg-danger-bg hover:border-danger-border hover:text-danger-fg"
        >
          {!isBusy && (
            <>
              <UserX className="h-4 w-4" />
              Decline
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
