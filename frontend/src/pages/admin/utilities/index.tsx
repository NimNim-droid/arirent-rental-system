import { Check, AlertTriangle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import {
  useUtilities,
  MeterReadingForm,
  SettingsForm,
  ReadingsHistoryTable,
} from "@/components/features/utilities";

export default function AdminUtilities() {
  const {
    tenants,
    tenantsLoading,
    readings,
    readingsLoading,
    settings,
    settingsLoading,
    prevReading,
    setPrevReading,
    currReading,
    setCurrReading,
    selectedResident,
    setSelectedResident,
    savingReading,
    savingSettings,
    notice,
    error,
    usageKwh,
    computedAmount,
    setSettings,
    handleSaveReading,
    handleSaveSettings,
    reloadAll,
  } = useUtilities();

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
          <Button variant="ghost" size="sm" onClick={reloadAll}>
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

      {/* Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MeterReadingForm
          tenants={tenants}
          tenantsLoading={tenantsLoading}
          selectedResident={selectedResident}
          prevReading={prevReading}
          currReading={currReading}
          usageKwh={usageKwh}
          computedAmount={computedAmount}
          savingReading={savingReading}
          onResidentChange={setSelectedResident}
          onPrevReadingChange={setPrevReading}
          onCurrReadingChange={setCurrReading}
          onSubmit={handleSaveReading}
        />

        <SettingsForm
          settings={settings}
          settingsLoading={settingsLoading}
          savingSettings={savingSettings}
          onSettingsChange={(updated) => setSettings(updated)}
          onSubmit={handleSaveSettings}
        />
      </div>

      {/* Recent Readings Table */}
      <ReadingsHistoryTable
        readings={readings}
        loading={readingsLoading}
      />
    </div>
  );
}