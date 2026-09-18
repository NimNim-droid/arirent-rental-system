import { Zap, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/common/section-header";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import type { Tenant } from "@/lib/types";

interface MeterReadingFormProps {
  tenants: Tenant[];
  tenantsLoading: boolean;
  selectedResident: string;
  prevReading: number;
  currReading: number;
  usageKwh: number;
  computedAmount: number;
  savingReading: boolean;
  onResidentChange: (id: string) => void;
  onPrevReadingChange: (val: number) => void;
  onCurrReadingChange: (val: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function MeterReadingForm({
  tenants,
  tenantsLoading,
  selectedResident,
  prevReading,
  currReading,
  usageKwh,
  computedAmount,
  savingReading,
  onResidentChange,
  onPrevReadingChange,
  onCurrReadingChange,
  onSubmit,
}: MeterReadingFormProps) {
  return (
    <Card className="p-6">
      <SectionHeader
        icon={<Zap className="h-5 w-5 text-warning-fg" />}
        title="Record Electric Meter Reading"
        subtitle="Calculate kWh consumption per tenant"
      />

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Select
          id="tenant"
          label="Select Resident"
          value={selectedResident || ""}
          onChange={(e) => onResidentChange(e.target.value)}
          required
          disabled={tenantsLoading}
        >
          {tenantsLoading ? (
            <option value="" disabled>
              Loading active residents...
            </option>
          ) : tenants.length === 0 ? (
            <option value="" disabled>
              No active residents found
            </option>
          ) : (
            <>
              <option value="" disabled>
                Select a resident...
              </option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — Room {t.room}
                </option>
              ))}
            </>
          )}
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="prevReading"
            label="Previous (kWh)"
            type="number"
            min={0}
            value={prevReading}
            onChange={(e) => onPrevReadingChange(Number(e.target.value))}
            required
          />
          <Input
            id="currReading"
            label="Current (kWh)"
            type="number"
            min={0}
            value={currReading}
            onChange={(e) => onCurrReadingChange(Number(e.target.value))}
            required
          />
        </div>

        {/* Computed Calculation Box */}
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-edge bg-inset p-4 text-center">
          <div>
            <p className="text-[11px] text-muted font-bold uppercase tracking-wider">
              Usage
            </p>
            <p className="mt-0.5 text-lg font-extrabold text-fg tabular-nums">
              {usageKwh} kWh
            </p>
          </div>
          <div className="border-l border-edge">
            <p className="text-[11px] text-muted font-bold uppercase tracking-wider">
              Total Cost
            </p>
            <p className="mt-0.5 text-lg font-extrabold text-accent tabular-nums">
              {formatCurrency(computedAmount)}
            </p>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={
            !selectedResident || tenantsLoading || currReading <= prevReading
          }
          loading={savingReading}
        >
          {!savingReading && (
            <>
              <Save className="h-4 w-4" /> Save Meter Reading
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
