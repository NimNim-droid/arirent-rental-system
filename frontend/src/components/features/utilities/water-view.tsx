import { Droplets, Settings, CheckCircle2, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import type { Tenant, Property } from "@/lib/types";

interface WaterViewProps {
  tenants: Tenant[];
  properties: Property[];
  loading: boolean;
  waterRate: number;
  onOpenSetRates: () => void;
  propertyFilter: string;
  tenantFilter: string;
  searchQuery: string;
}

export function WaterView({
  tenants,
  loading,
  waterRate,
  onOpenSetRates,
  propertyFilter,
  tenantFilter,
  searchQuery,
}: WaterViewProps) {
  const filteredTenants = tenants.filter((t) => {
    if (propertyFilter !== "all") {
      const pId = t.property_id || "";
      const pName = (t.property?.name || "").toLowerCase();
      if (pId !== propertyFilter && !pName.includes(propertyFilter.toLowerCase())) {
        return false;
      }
    }

    if (tenantFilter !== "all" && String(t.id) !== String(tenantFilter)) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (t.name || "").toLowerCase();
      const room = (t.room || "").toLowerCase();
      const prop = (t.property?.name || "").toLowerCase();
      if (!name.includes(q) && !room.includes(q) && !prop.includes(q)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Banner / Stat Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 md:col-span-2 border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-primary text-white shrink-0 mt-0.5">
              <Droplets className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-fg">Fixed Flat Water Rate</h3>
                <Badge variant="success" className="text-[11px] font-medium">Active Policy</Badge>
              </div>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Water is currently billed as a flat monthly charge. Every active resident is automatically billed this amount each month.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-2 border-primary/30 text-primary hover:bg-primary/10"
            onClick={onOpenSetRates}
          >
            <Settings className="h-4 w-4" />
            Change Rate
          </Button>
        </Card>

        <Card className="p-5 flex flex-col justify-center">
          <p className="text-xs font-semibold text-fg-soft uppercase tracking-wider">
            Current Rate per Tenant
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-fg">{formatCurrency(waterRate)}</span>
            <span className="text-xs text-muted">/ month</span>
          </div>
          <p className="text-[11px] text-muted mt-1">
            Auto-included on the monthly billing & invoice.
          </p>
        </Card>
      </div>

      {/* Info Notice */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-subtle text-xs text-muted">
        <Info className="h-4 w-4 text-primary shrink-0" />
        <span>
          If a unit or property transitions to physical water meters in the future, you will be able to switch to cubic meter ($m^3$) sub-meter tracking right here.
        </span>
      </div>

      {/* Active Tenants Flat Water Schedule Table */}
      <Card className="p-0 overflow-hidden border border-border">
        <div className="p-4 border-b border-border bg-subtle/30 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-fg">Monthly Water Schedule</h4>
            <p className="text-xs text-muted mt-0.5">
              Active tenants scheduled for flat water billing this period
            </p>
          </div>
          <Badge variant="default" className="text-xs">
            {filteredTenants.length} Active Unit{filteredTenants.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="table-scroll-wrap overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-subtle/50">
                <TableHead className="font-semibold text-xs">Property</TableHead>
                <TableHead className="font-semibold text-xs">Unit / Room</TableHead>
                <TableHead className="font-semibold text-xs">Tenant</TableHead>
                <TableHead className="font-semibold text-xs">Billing Type</TableHead>
                <TableHead className="font-semibold text-xs text-right">Monthly Water Fee</TableHead>
                <TableHead className="font-semibold text-xs text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></TableCell>
                    </TableRow>
                  ))
                : filteredTenants.map((t) => (
                    <TableRow key={t.id} className="hover:bg-subtle/40 transition-colors">
                      <TableCell className="text-xs text-fg-soft font-medium">
                        {t.property?.name || "Standard Rental"}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-fg">
                        {t.room ? (t.room.toLowerCase().startsWith("unit") ? t.room : `Unit ${t.room}`) : "—"}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-fg">
                        {t.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted">
                        Flat Rate per Month
                      </TableCell>
                      <TableCell className="text-xs font-bold text-fg text-right font-mono">
                        {formatCurrency(waterRate)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="success" className="gap-1 px-2 py-0.5 text-[11px] font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          Included in Bill
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
