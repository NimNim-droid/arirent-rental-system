import { Eye, Edit2, Trash2, Check, User } from "lucide-react";
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
import type { Tenant } from "@/lib/types";

interface TenantTableProps {
  residents: Tenant[];
  loading: boolean;
  isSearching: boolean;
  onSelectTenant: (tenant: Tenant) => void;
  onEditTenant?: (tenant: Tenant) => void;
  onDeleteTenant?: (tenant: Tenant) => void;
  onApproveTenant?: (tenant: Tenant) => void;
  busyId?: string | null;
}

export function TenantTable({
  residents,
  loading,
  isSearching,
  onSelectTenant,
  onEditTenant,
  onDeleteTenant,
  onApproveTenant,
  busyId,
}: TenantTableProps) {
  return (
    <Card className="p-0 overflow-hidden border border-edge shadow-xs">
      <div className="table-scroll-wrap">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-edge/80 bg-inset/40">
              <TableHead className="py-3 px-4 text-xs font-bold text-fg-soft uppercase tracking-wider">
                Full Name
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-bold text-fg-soft uppercase tracking-wider">
                Property
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-bold text-fg-soft uppercase tracking-wider">
                Room
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-bold text-fg-soft uppercase tracking-wider">
                Phone
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-bold text-fg-soft uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="py-3 px-4 text-right text-xs font-bold text-fg-soft uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            className={`transition-opacity duration-150 ${
              isSearching ? "opacity-60" : "opacity-100"
            }`}
          >
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-b border-edge/40">
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <Skeleton className="h-8 w-24 ml-auto rounded-lg" />
                  </TableCell>
                </TableRow>
              ))
            ) : residents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    title="No tenants found"
                    description="No residents match your search filter or selected property."
                  />
                </TableCell>
              </TableRow>
            ) : (
              residents.map((t) => (
                <TableRow
                  key={t.id}
                  className="border-b border-edge/40 hover:bg-card/70 transition-colors"
                >
                  {/* Full Name */}
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-accent/15 border border-accent/25 text-accent flex items-center justify-center font-bold text-xs shrink-0">
                        {t.name ? t.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-fg text-sm truncate">{t.name}</p>
                        <p className="text-[11px] text-muted truncate">@{t.username}</p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Property */}
                  <TableCell className="px-4 py-3 text-xs text-muted font-medium">
                    {t.property_name || "—"}
                  </TableCell>

                  {/* Room */}
                  <TableCell className="px-4 py-3">
                    <span className="font-semibold text-fg text-xs">
                      Room {t.room}
                    </span>
                  </TableCell>

                  {/* Phone */}
                  <TableCell className="px-4 py-3 text-xs text-muted font-medium tabular-nums">
                    {t.phone || "—"}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="px-4 py-3">
                    <Badge
                      dot
                      variant={
                        t.status === "active"
                          ? "success"
                          : t.status === "pending_approval"
                          ? "warning"
                          : "neutral"
                      }
                    >
                      {t.status === "active"
                        ? "ACTIVE"
                        : t.status === "pending_approval"
                        ? "PENDING"
                        : "INACTIVE"}
                    </Badge>
                  </TableCell>

                  {/* Actions Column (Matching Screenshot 2: Check, Eye, Edit, Trash) */}
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Approve button for pending applicants */}
                      {t.status === "pending_approval" && onApproveTenant && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onApproveTenant(t)}
                          disabled={busyId === t.id}
                          className="h-8 w-8 p-0 text-success-fg hover:bg-success/15 hover:text-success-fg rounded-lg"
                          title="Approve Application"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}

                      {/* View Details */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectTenant(t)}
                        className="h-8 w-8 p-0 text-accent hover:bg-accent/10 hover:text-accent rounded-lg"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Edit Tenant Info */}
                      {onEditTenant && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditTenant(t)}
                          className="h-8 w-8 p-0 text-fg-soft hover:bg-card hover:text-fg rounded-lg"
                          title="Edit Tenant"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {/* Delete Tenant */}
                      {onDeleteTenant && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteTenant(t)}
                          disabled={busyId === t.id}
                          className="h-8 w-8 p-0 text-danger-fg hover:bg-danger/10 hover:text-danger-fg rounded-lg"
                          title="Delete Tenant Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
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
