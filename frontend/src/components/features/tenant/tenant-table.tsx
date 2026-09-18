import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TenantAvatar } from "./tenant-avatar";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Tenant } from "@/lib/types";

interface TenantTableProps {
  residents: Tenant[];
  loading: boolean;
  isSearching: boolean;
  onSelectTenant: (tenant: Tenant) => void;
  onCreateBill?: (tenant: Tenant) => void;
}

export function TenantTable({
  residents,
  loading,
  isSearching,
  onSelectTenant,
  onCreateBill,
}: TenantTableProps) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="table-scroll-wrap">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resident</TableHead>
              <TableHead>Unit & Building</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Rent Due / Lease</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            className={`transition-opacity duration-150 ${
              isSearching ? "opacity-60" : "opacity-100"
            }`}
          >
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-28 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-16 ml-auto rounded-lg" />
                  </TableCell>
                </TableRow>
              ))
            ) : residents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    title="No residents found"
                    description="Try adjusting your search or approving a pending application."
                  />
                </TableCell>
              </TableRow>
            ) : (
              residents.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <TenantAvatar name={t.name} />
                      <p className="font-bold text-fg">{t.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-fg-soft">Room {t.room}</p>
                    <p className="text-xs text-muted">{t.property_name}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted">
                    <p>{t.phone}</p>
                    <p className="text-faint">{t.email}</p>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-fg-soft whitespace-nowrap">
                    <p className="font-semibold text-accent">Due: Every {t.billing_day || 1}th</p>
                    <p className="text-[11px] text-muted">Ends: {formatDate(t.lease_end)}</p>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {t.balance > 0 ? (
                      <span className="font-bold text-warning-fg">
                        {formatCurrency(t.balance)}
                      </span>
                    ) : (
                      <span className="font-semibold text-success-fg">₱0.00</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {t.status === "active" ? (
                      <Badge variant="success" dot>
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="neutral" dot>
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {t.status === "active" && onCreateBill && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCreateBill(t)}
                          className="text-xs text-accent hover:bg-accent hover:text-white"
                        >
                          Bill
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectTenant(t)}
                        className="text-muted hover:text-fg"
                      >
                        Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
