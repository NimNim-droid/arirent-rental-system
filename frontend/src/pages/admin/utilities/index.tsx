import { useState, useMemo } from "react";
import {
  Zap,
  Droplets,
  Plus,
  Settings as SettingsIcon,
  RotateCw,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
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

  const [page, setPage] = useState<number>(1);

  // Filter tenants list dynamically based on selected property (cascading filter)
  const visibleTenants = useMemo(() => {
    if (!propertyFilter || propertyFilter === "all") return tenants;
    return tenants.filter((t) => {
      const pId = t.property_id || "";
      const pName = (t.property?.name || "").toLowerCase();
      return pId === propertyFilter || pName.includes(propertyFilter.toLowerCase());
    });
  }, [tenants, propertyFilter]);

  const handlePropertyFilterChange = (propId: string) => {
    setPropertyFilter(propId);
    setPage(1);

    // If currently selected tenant does not live in the selected property, reset tenant filter
    if (tenantFilter && tenantFilter !== "all" && propId && propId !== "all") {
      const isTenantInProp = tenants.some((t) => {
        if (String(t.id) !== String(tenantFilter)) return false;
        const pId = t.property_id || "";
        const pName = (t.property?.name || "").toLowerCase();
        return pId === propId || pName.includes(propId.toLowerCase());
      });
      if (!isTenantInProp) {
        setTenantFilter("all");
      }
    }
  };

  const resetFilters = () => {
    setPropertyFilter("all");
    setTenantFilter("all");
    setSearchQuery("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header matching AriRent standard */}
      <PageHeader
        title="Utilities"
        subtitle="Manage utility readings, rates and usage for each property."
        action={
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
              size="sm"
              className="gap-2 text-xs font-semibold shadow-sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>+ Add Reading</span>
            </Button>
          </div>
        }
      />

      {/* Notifications */}
      {error && <AlertBanner variant="danger" message={error} />}
      {notice && <AlertBanner variant="success" message={notice} />}

      {/* Tab navigation: Electricity (kWh) | Water (Flat Rate) */}
      <div className="flex items-center gap-1 p-1 bg-inset border border-edge rounded-md w-fit">
        <button
          type="button"
          onClick={() => {
            setActiveTab("electricity");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
            activeTab === "electricity"
              ? "bg-card text-fg shadow-soft border border-edge"
              : "text-muted hover:text-fg"
          }`}
        >
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span>Electricity</span>
          <span
            className={`px-1 py-0.5 rounded text-[10px] tabular-nums ${
              activeTab === "electricity"
                ? "bg-accent-soft text-accent"
                : "bg-card text-muted"
            }`}
          >
            kWh
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("water");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
            activeTab === "water"
              ? "bg-card text-fg shadow-soft border border-edge"
              : "text-muted hover:text-fg"
          }`}
        >
          <Droplets className="h-3.5 w-3.5 text-cyan-500" />
          <span>Water</span>
          <span
            className={`px-1 py-0.5 rounded text-[10px] tabular-nums ${
              activeTab === "water"
                ? "bg-accent-soft text-accent"
                : "bg-card text-muted"
            }`}
          >
            Flat Rate
          </span>
        </button>
      </div>

      {/* Unified Single-Line Filter Toolbar matching Invoices */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 bg-card p-3 rounded-lg border border-edge">
        {/* Left: Prominent Search Box */}
        <div className="flex-1 min-w-[200px] max-w-full lg:max-w-xs">
          <SearchInput
            type="text"
            placeholder="Search tenant or unit..."
            label="Search utilities"
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
              setPage(1);
            }}
          />
        </div>

        {/* Right: Inline Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Property Filter */}
          <div className="w-[140px] sm:w-auto">
            <Select
              value={propertyFilter}
              onChange={(e) => handlePropertyFilterChange(e.target.value)}
              className="text-xs h-9 min-w-[130px]"
            >
              <option value="all">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Tenant Filter (Cascading based on propertyFilter) */}
          <div className="w-[140px] sm:w-auto">
            <Select
              value={tenantFilter}
              onChange={(e) => {
                setTenantFilter(e.target.value);
                setPage(1);
              }}
              disabled={visibleTenants.length === 0}
              className="text-xs h-9 min-w-[130px]"
            >
              <option value="all">
                {visibleTenants.length === 0
                  ? "No Tenants in Property"
                  : propertyFilter !== "all"
                  ? `All Residents (${visibleTenants.length})`
                  : "All Tenants"}
              </option>
              {visibleTenants.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.name} {t.room ? `(${t.room})` : ""}
                </option>
              ))}
            </Select>
          </div>

          {/* Clear / Reset Filter Button */}
          {(propertyFilter !== "all" || tenantFilter !== "all" || searchQuery.trim()) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-9 px-2.5 text-xs text-muted hover:text-fg gap-1"
              title="Reset all filters"
            >
              <RotateCw className="h-3 w-3" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={reloadAll}
            className="h-9 px-2.5 text-xs text-muted hover:text-fg gap-1.5"
            title="Refresh readings"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "electricity" && (
        <ReadingsHistoryTable
          readings={readings}
          loading={readingsLoading}
          defaultElecRate={elecRate}
          onDelete={handleDeleteReading}
          deletingId={deletingId}
          onViewProof={(url) => setSelectedProofUrl(url)}
          page={page}
          onPageChange={setPage}
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
          page={page}
          onPageChange={setPage}
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
            <div className="rounded-xl overflow-hidden border border-edge bg-inset/40">
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