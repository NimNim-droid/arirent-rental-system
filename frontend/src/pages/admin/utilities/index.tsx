import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  Zap,
  QrCode,
  Save,
  Check,
  RefreshCw,
  AlertTriangle,
  History,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SectionHeader } from "@/components/common/section-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkeletonRows } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { tenantsService } from "@/lib/services/tenants";
import { utilitiesService } from "@/lib/services/utilities";
import { settingsService } from "@/lib/services/settings";
import { getErrorMessage } from "@/lib/errors";
import type { Settings, Tenant, UtilityReading } from "@/lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminUtilities() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [readings, setReadings] = useState<UtilityReading[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  const [prevReading, setPrevReading] = useState<number>(0);
  const [currReading, setCurrReading] = useState<number>(0);
  const [selectedResident, setSelectedResident] = useState("");
  const [savingReading, setSavingReading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [tenantsRes, readingsRes, settingsRes] = await Promise.all([
        tenantsService.getTenants({ status: "active", per_page: 200 }),
        utilitiesService.getReadings(),
        settingsService.getSettings(),
      ]);
      setTenants(tenantsRes.data);
      setReadings(readingsRes);
      setSettings(settingsRes);
      setSelectedResident((prev) => prev || tenantsRes.data[0]?.id || "");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load utilities data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Prefill previous reading from the selected tenant's latest meter reading.
  useEffect(() => {
    if (!selectedResident) return;
    const latest = readings
      .filter((r) => r.tenant_id === selectedResident)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    setPrevReading(latest ? latest.curr_reading : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResident]);

  const elecRate = settings?.elec_rate ?? 0;
  const usageKwh = Math.max(0, currReading - prevReading);
  const computedAmount = usageKwh * elecRate;

  const handleSaveReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident) return;
    setSavingReading(true);
    setNotice("");
    setError("");
    try {
      await utilitiesService.createReading({
        tenant_id: selectedResident,
        prev_reading: prevReading,
        curr_reading: currReading,
        date: todayISO(),
      });
      setCurrReading(0);
      setNotice("Meter reading recorded successfully.");
      const updated = await utilitiesService.getReadings();
      setReadings(updated);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save the meter reading."));
    } finally {
      setSavingReading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    setNotice("");
    setError("");
    try {
      const updated = await settingsService.updateSettings({
        elec_rate: settings.elec_rate,
        water_rate: settings.water_rate,
        gcash_name: settings.gcash_name,
        gcash_number: settings.gcash_number,
      });
      setSettings(updated);
      setNotice("Configuration saved successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save configuration."));
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Utilities & Rates"
        subtitle="Record monthly electricity meters and manage rate configurations"
      />

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-xs font-semibold text-danger-fg">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </span>
          <Button variant="ghost" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-success-border bg-success-bg px-4 py-3 text-xs font-semibold text-success-fg">
          <Check className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <SkeletonRows rows={5} />
          </Card>
          <Card className="p-6">
            <SkeletonRows rows={5} />
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Electricity Meter Reading Form */}
          <Card className="p-6 animate-fade-in-up stagger" style={{ "--i": 0 } as CSSProperties}>
            <SectionHeader
              icon={<Zap className="h-5 w-5 text-warning-fg" />}
              title="Record Electric Meter Reading"
              subtitle="Calculate kWh consumption per tenant"
            />

            <form onSubmit={handleSaveReading} className="mt-5 space-y-4">
              <Select
                id="tenant"
                label="Select Resident"
                value={selectedResident || ""}
                onChange={(e) => setSelectedResident(e.target.value)}
                required
              >
                <option value="" disabled>
                  {tenants.length === 0 ? "No active residents" : "Select a resident..."}
                </option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — Room {t.room}
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="prevReading"
                  label="Previous (kWh)"
                  type="number"
                  min={0}
                  value={prevReading}
                  onChange={(e) => setPrevReading(Number(e.target.value))}
                  required
                />
                <Input
                  id="currReading"
                  label="Current (kWh)"
                  type="number"
                  min={0}
                  value={currReading}
                  onChange={(e) => setCurrReading(Number(e.target.value))}
                  required
                />
              </div>

              {/* Computed Calculation Box */}
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-edge bg-inset p-4 text-center">
                <div>
                  <p className="text-[11px] text-muted font-bold uppercase tracking-wider">Usage</p>
                  <p className="mt-0.5 text-lg font-extrabold text-fg tabular-nums">{usageKwh} kWh</p>
                </div>
                <div className="border-l border-edge">
                  <p className="text-[11px] text-muted font-bold uppercase tracking-wider">Total Cost</p>
                  <p className="mt-0.5 text-lg font-extrabold text-accent tabular-nums">
                    ₱{computedAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={usageKwh < 0 || !selectedResident}
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

          {/* Global Rates & GCash Settings */}
          <Card className="p-6 animate-fade-in-up stagger" style={{ "--i": 1 } as CSSProperties}>
            <SectionHeader
              icon={<QrCode className="h-5 w-5" />}
              title="Payment & Rates Configuration"
              subtitle="Global billing rates and GCash account details"
            />

            {settings ? (
              <form onSubmit={handleSaveSettings} className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="elecRate"
                    label="Electricity Rate (₱/kWh)"
                    type="number"
                    step="0.1"
                    value={settings.elec_rate}
                    onChange={(e) =>
                      setSettings({ ...settings, elec_rate: Number(e.target.value) })
                    }
                    required
                  />
                  <Input
                    id="waterRate"
                    label="Default Water (₱/mo)"
                    type="number"
                    value={settings.water_rate}
                    onChange={(e) =>
                      setSettings({ ...settings, water_rate: Number(e.target.value) })
                    }
                    required
                  />
                </div>

                <Input
                  id="gcashName"
                  label="GCash Account Name"
                  value={settings.gcash_name}
                  onChange={(e) =>
                    setSettings({ ...settings, gcash_name: e.target.value })
                  }
                  required
                />

                <Input
                  id="gcashNumber"
                  label="GCash Mobile Number"
                  value={settings.gcash_number}
                  onChange={(e) =>
                    setSettings({ ...settings, gcash_number: e.target.value })
                  }
                  required
                />

                <Button type="submit" variant="secondary" className="w-full" loading={savingSettings}>
                  {!savingSettings && (
                    <>
                      <Save className="h-4 w-4" /> Save Configuration
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="mt-5 text-xs text-muted">
                Rate configuration is unavailable right now.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Recent Readings */}
      <div className="space-y-4">
        <SectionHeader
          icon={<History className="h-5 w-5" />}
          title={`Recent Meter Readings (${readings.length})`}
          subtitle="Latest recorded electricity readings per tenant"
        />
        <Card className="p-0 overflow-hidden">
          {readings.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-fg-soft">No readings recorded yet</p>
              <p className="mt-1 text-xs text-muted">
                Record a meter reading above and it will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resident</TableHead>
                    <TableHead className="text-right">Previous</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">Usage</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((r, i) => (
                    <TableRow key={r.id} index={i}>
                      <TableCell>
                        <p className="font-semibold text-fg-soft">{r.tenant_name}</p>
                        <p className="text-xs text-muted">Room {r.room}</p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.prev_reading}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.curr_reading}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="neutral">{r.usage_kwh} kWh</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-fg tabular-nums">
                        ₱{r.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted whitespace-nowrap">
                        {r.date}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}