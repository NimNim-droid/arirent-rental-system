import { useState } from "react";
import { Zap, Droplets, QrCode, Save, Check } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Electricity Meter Reading Form */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Record Electric Meter Reading</h2>
              <p className="text-xs text-slate-500">Calculate kWh consumption per tenant</p>
            </div>
          </div>

          <form onSubmit={handleSaveReading} className="space-y-4">
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
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Usage</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">{usageKwh} kWh</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Total Cost</p>
                <p className="text-lg font-black text-sky-600 mt-0.5">₱{computedAmount.toFixed(2)}</p>
              </div>
            </div>

            <Button type="submit" className="w-full">
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
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Payment & Rates Configuration</h2>
              <p className="text-xs text-slate-500">Global billing rates and GCash account details</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
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
                  <Check className="h-4 w-4 text-emerald-600" /> Settings Updated!
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
