import { useState } from "react";
import {
  Zap,
  Droplets,
  Plus,
  Settings as SettingsIcon,
  Search,
  Check,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import {
  useUtilities,
  AddReadingModal,
  SetRatesModal,
  ReadingsHistoryTable,
  WaterView,
} from "@/components/features/utilities";

export default function AdminUtilities() {
  const {
    tenants,
    tenantsLoading,
    properties,
    propertiesLoading,
    readings,
    readingsLoading,
    settings,
    elecRate,
    waterRate,
    activeTab,
    setActiveTab,
    propertyFilter,
    setPropertyFilter,
    tenantFilter,
    setTenantFilter,
    searchQuery,
    setSearchQuery,
    isAddModalOpen,
    setIsAddModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    selectedProofUrl,
    setSelectedProofUrl,
    notice,
    setNotice,
    error,
    setError,
    deletingId,
    getLatestReading,
    handleDeleteReading,
    handleUpdateSettings,
    loadReadings,
    reloadAll,
  } = useUtilities();

  return (
    <div className="space-y-6">
      {/* Page Header matching mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-fg">Utilities</h1>
          </div>
          <p className="text-xs text-muted mt-1">
            Manage utility readings, rates and usage for each property.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs font-semibold"
            onClick={() => setIsSettingsModalOpen(true)}
          >
            <SettingsIcon className="h-4 w-4 text-muted" />
            <span>Set Rates</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="gap-2 text-xs font-semibold shadow-sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Reading</span>
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-xs font-semibold text-danger-fg animate-in fade-in">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setError("")}>
            Dismiss
          </Button>
        </div>
      )}

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-success-border bg-success-bg px-4 py-3 text-xs font-semibold text-success-fg animate-in fade-in">
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            {notice}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setNotice("")}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Tabs navigation: Electricity | Water | Other Utilities */}
      <div className="border-b border-border">
        <nav className="flex space-x-8 -mb-px" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("electricity")}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-xs transition-colors ${
              activeTab === "electricity"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted hover:text-fg hover:border-border"
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>Electricity</span>
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === "electricity"
                  ? "bg-primary/10 text-primary"
                  : "bg-subtle text-muted"
              }`}
            >
              kWh
            </span>
          </button>

          <button
            onClick={() => setActiveTab("water")}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-xs transition-colors ${
              activeTab === "water"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted hover:text-fg hover:border-border"
            }`}
          >
            <Droplets className="h-4 w-4" />
            <span>Water</span>
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === "water"
                  ? "bg-primary/10 text-primary"
                  : "bg-subtle text-muted"
              }`}
            >
              Flat Rate
            </span>
          </button>
        </nav>
      </div>

      {/* Filter Bar */}
      <Card className="p-3.5 border-border bg-card/60 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          {/* Property Filter */}
          <div>
            <Select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="all">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Tenant Filter */}
          <div>
            <Select
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="all">All Tenants</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.room ? `(${t.room})` : ""}
                </option>
              ))}
            </Select>
          </div>

          {/* Search Input */}
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
              <Input
                placeholder="Search tenant or unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
          </div>

          {/* Reset / Refresh */}
          <div className="flex items-center justify-end gap-2">
            {(propertyFilter !== "all" || tenantFilter !== "all" || searchQuery.trim()) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs text-muted hover:text-fg"
                onClick={() => {
                  setPropertyFilter("all");
                  setTenantFilter("all");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs text-muted hover:text-fg"
              onClick={reloadAll}
              title="Refresh readings"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Tab Content */}
      {activeTab === "electricity" && (
        <ReadingsHistoryTable
          readings={readings}
          loading={readingsLoading}
          defaultElecRate={elecRate}
          onDelete={handleDeleteReading}
          deletingId={deletingId}
          onViewProof={(url) => setSelectedProofUrl(url)}
        />
      )}

      {activeTab === "water" && (
        <WaterView
          tenants={tenants}
          properties={properties}
          loading={tenantsLoading}
          waterRate={waterRate}
          onOpenSetRates={() => setIsSettingsModalOpen(true)}
          propertyFilter={propertyFilter}
          tenantFilter={tenantFilter}
          searchQuery={searchQuery}
        />
      )}

      {/* Add Reading Modal */}
      <AddReadingModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        tenants={tenants}
        properties={properties}
        elecRate={elecRate}
        getLatestReading={getLatestReading}
        onSuccess={() => {
          setNotice("Meter reading recorded and posted to bill successfully.");
          loadReadings();
        }}
      />

      {/* Set Rates Modal */}
      <SetRatesModal
        open={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSave={handleUpdateSettings}
      />

      {/* Proof Photo Modal */}
      {selectedProofUrl && (
        <Modal
          open={Boolean(selectedProofUrl)}
          onClose={() => setSelectedProofUrl(null)}
          title="Meter Reading Proof"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-border bg-subtle">
              <img
                src={selectedProofUrl}
                alt="Meter Reading Proof"
                className="w-full max-h-[70vh] object-contain"
              />
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setSelectedProofUrl(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}