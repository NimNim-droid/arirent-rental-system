import { useNavigate, Link } from "react-router";
import { CalendarDays, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import type { TenantDashboardData } from "@/lib/types";

interface TenantBalanceCardProps {
  stats: TenantDashboardData | null;
  loading: boolean;
  hasBalance: boolean;
}

export function TenantBalanceCard({
  stats,
  loading,
  hasBalance,
}: TenantBalanceCardProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="p-6 border-edge bg-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-3.5 w-72" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl shrink-0" />
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card
      className={`p-6 animate-fade-in ${
        hasBalance
          ? "border-warning-border bg-warning-bg/25"
          : "border-success-border/60 bg-success-bg/20"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={hasBalance ? "warning" : "success"} dot>
              {hasBalance ? "Payment Due" : "Account Up to Date"}
            </Badge>
            {stats.due_date && hasBalance && (
              <span className="text-xs font-medium text-warning-fg flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Due by {stats.due_date}
              </span>
            )}
          </div>
          <div className="mt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Outstanding Balance
            </p>
            <p className="text-3xl font-extrabold text-fg tabular-nums mt-0.5">
              {formatCurrency(stats.outstanding_balance ?? 0)}
            </p>
          </div>
          <p className="text-xs text-muted">
            {hasBalance
              ? "Includes room rent, recorded electricity usage, and water service."
              : "No pending payments. Your next invoice will be generated at the end of the billing period."}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {hasBalance ? (
            <Button
              onClick={() => navigate("/tenant/billing")}
              className="w-full sm:w-auto"
            >
              Pay via GCash <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Link to="/tenant/billing">
              <Button variant="secondary" size="sm">
                Billing History
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
