import { QrCode, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/common/section-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Settings } from "@/lib/types";

interface SettingsFormProps {
  settings: Settings | null;
  settingsLoading: boolean;
  savingSettings: boolean;
  onSettingsChange: (updated: Settings) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SettingsForm({
  settings,
  settingsLoading,
  savingSettings,
  onSettingsChange,
  onSubmit,
}: SettingsFormProps) {
  return (
    <Card className="p-6">
      <SectionHeader
        icon={<QrCode className="h-5 w-5" />}
        title="Payment & Rates Configuration"
        subtitle="Global billing rates and GCash account details"
      />

      {settingsLoading ? (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ) : settings ? (
        <form
          onSubmit={onSubmit}
          className="mt-5 space-y-4 animate-fade-in"
        >
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="elecRate"
              label="Electricity Rate (₱/kWh)"
              type="number"
              step="0.1"
              value={settings.elec_rate}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  elec_rate: Number(e.target.value),
                })
              }
              required
            />
            <Input
              id="waterRate"
              label="Default Water (₱/mo)"
              type="number"
              value={settings.water_rate}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  water_rate: Number(e.target.value),
                })
              }
              required
            />
          </div>

          <Input
            id="gcashName"
            label="GCash Account Name"
            value={settings.gcash_name}
            onChange={(e) =>
              onSettingsChange({
                ...settings,
                gcash_name: e.target.value,
              })
            }
            required
          />

          <Input
            id="gcashNumber"
            label="GCash Mobile Number"
            value={settings.gcash_number}
            onChange={(e) =>
              onSettingsChange({
                ...settings,
                gcash_number: e.target.value,
              })
            }
            required
          />

          <Button
            type="submit"
            variant="secondary"
            className="w-full"
            loading={savingSettings}
          >
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
  );
}
