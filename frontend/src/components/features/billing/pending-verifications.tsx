import { ShieldCheck } from "lucide-react";
import { SectionHeader } from "@/components/common/section-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentVerificationCard } from "./payment-verification-card";
import type { Bill } from "@/lib/types";

interface PendingVerificationsProps {
  payments: Bill[];
  loading: boolean;
  busyId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
}

export function PendingVerifications({
  payments,
  loading,
  busyId,
  onApprove,
  onReject,
}: PendingVerificationsProps) {
  return (
    <div className="space-y-4">
      <SectionHeader
        dot
        dotClassName="text-accent"
        icon={<ShieldCheck className="h-5 w-5" />}
        title={`Pending GCash Payment Verifications (${payments.length})`}
        subtitle="Payment receipts that need to be confirmed"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-edge bg-card p-5 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-8 w-full rounded-xl" />
          </div>
          <div className="rounded-2xl border border-edge bg-card p-5 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-8 w-full rounded-xl" />
          </div>
        </div>
      ) : payments.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            title="No payments to verify"
            description="All submitted GCash payments have been reviewed."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {payments.map((payment) => (
            <PaymentVerificationCard
              key={payment.id}
              payment={payment}
              isBusy={busyId === payment.id}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
