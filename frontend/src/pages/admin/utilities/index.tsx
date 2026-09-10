import { useState } from "react";
import type { CSSProperties } from "react";
import { Zap, QrCode, Save, Check } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SectionHeader } from "@/components/common/section-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function AdminUtilities() {
  const [elecRate, setElecRate] = useState(15.0);
  const [prevReading, setPrevReading] = useState(1200);
  const [currReading, setCurrReading] = useState(1350);
  const [readingSaved, setReadingSaved] = useState(false);

  // Auto calculation
  const usageKwh = Math.max(0, currReading - prevReading);
  const computedAmount = usageKwh * elecRate;

  // Settings
  const [settings, setSettings] = useState({
    elecRate: 15.0,
    waterRate: 500.0,
    gcashName: "ARIRENT PROPERTY MANAGEMENT",
    gcashNumber: "0917-888-9999",
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleSaveReading = (e: React.FormEvent) => {
    e.preventDefault();
    setReadingSaved(true);
    setTimeout(() => setReadingSaved(false), 3000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Utilities & Rates"
        subtitle="Record monthly electricity meters and manage rate configurations"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Electricity Meter Reading Form */}
        <Card className="p-6 animate-fade-in-up stagger" style={{ "--i": 0 } as CSSProperties}>
          <SectionHeader
            icon={<Zap className="h-5 w-5 text-warning-fg" />}
            title="Record Electric Meter Reading"
            subtitle="Calculate kWh consumption per tenant"
          />

          <form onSubmit={handleSaveReading} className="mt-5 space-y-4">
            <Select id="tenant" label="Select Resident">
              <option value="1">Maria Santos — Room 101</option>
              <option value="2">Carlos Reyes — Room 204</option>
              <option value="3">Elena Gomez — Room 302</option>
            </Select>

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="prevReading"
                label="Previous (kWh)"
                type="number"
                value={prevReading}
                onChange={(e) => setPrevReading(Number(e.target.value))}
                required
              />
              <Input
                id="currReading"
                label="Current (kWh)"
                type="number"
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

            <Button type="submit" className="w-full" disabled={usageKwh <= 0}>
              {readingSaved ? (
                <>
                  <Check className="h-4 w-4" /> Reading Recorded!
                </>
              ) : (
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

          <form onSubmit={handleSaveSettings} className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="elecRate"
                label="Electricity Rate (₱/kWh)"
                type="number"
                step="0.1"
                value={settings.elecRate}
                onChange={(e) => setSettings({ ...settings, elecRate: Number(e.target.value) })}
                required
              />
              <Input
                id="waterRate"
                label="Default Water (₱/mo)"
                type="number"
                value={settings.waterRate}
                onChange={(e) => setSettings({ ...settings, waterRate: Number(e.target.value) })}
                required
              />
            </div>

            <Input
              id="gcashName"
              label="GCash Account Name"
              value={settings.gcashName}
              onChange={(e) => setSettings({ ...settings, gcashName: e.target.value })}
              required
            />

            <Input
              id="gcashNumber"
              label="GCash Mobile Number"
              value={settings.gcashNumber}
              onChange={(e) => setSettings({ ...settings, gcashNumber: e.target.value })}
              required
            />

            <Button type="submit" variant="secondary" className="w-full">
              {settingsSaved ? (
                <>
                  <Check className="h-4 w-4 text-success-fg" /> Settings Updated!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Configuration
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}