import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, RotateCw, X, UserPlus, Building, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AlertBanner } from "@/components/ui/alert-banner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useTenants,
  TenantTable,
  TenantDetailModal,
  EditTenantModal,
  AddTenantModal,
} from "@/components/features/tenant";
import { propertiesService } from "@/lib/services/properties";
import type { Tenant, Property } from "@/lib/types";

type StatusTab = "all" | "active" | "pending_approval" | "inactive";

export default function AdminTenants() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [selectedStatusTab, setSelectedStatusTab] = useState<StatusTab>("all");
  const [properties, setProperties] = useState<Property[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Modals state
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const {
    tenants,
    searchTerm,
    setSearchTerm,
    selectedTenant,
    setSelectedTenant,
    loading,
    isSearching,
    error,
    busyId,
    loadTenants,
    handleApprove,
    handleVacate,
    handleDelete,
  } = useTenants();

  const loadProperties = useCallback(async () => {
    try {
      const data = await propertiesService.getProperties();
      setProperties(data);
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Filter tenants by property, status tab, and search term
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      // 1. Property Filter
      if (selectedPropertyId !== "all" && String(t.property_id) !== String(selectedPropertyId)) {
        return false;
      }
      // 2. Status Tab Filter
      if (selectedStatusTab !== "all" && t.status !== selectedStatusTab) {
        return false;
      }
      return true;
    });
  }, [tenants, selectedPropertyId, selectedStatusTab]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const list = selectedPropertyId === "all"
      ? tenants
      : tenants.filter((t) => String(t.property_id) === String(selectedPropertyId));

    return {
      all: list.length,
      active: list.filter((t) => t.status === "active").length,
      pending: list.filter((t) => t.status === "pending_approval").length,
      inactive: list.filter((t) => t.status === "inactive").length,
    };
  }, [tenants, selectedPropertyId]);

  const handleRefresh = () => {
    loadTenants(searchTerm || undefined);
    loadProperties();
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSelectedPropertyId("all");
    setSelectedStatusTab("all");
  };

  return (
    <div className="space-y-6">
      {/* Top Header matching reference screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">
            Tenant Directory
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-fg">
            Tenant Management
          </h1>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="shadow-xs self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          Add New Tenant
        </Button>
      </div>

      {error && (
        <AlertBanner
          variant="danger"
          message={error}
          onRetry={handleRefresh}
        />
      )}

      {successMessage && (
        <AlertBanner
          variant="success"
          message={successMessage}
          onClose={() => setSuccessMessage("")}
        />
      )}

      {/* Main Table Card */}
      <div className="space-y-3">
        {/* Toolbar: Search input, Property selector, Clear, Refresh */}
        <div className="rounded-2xl border border-edge bg-card p-3 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
              <Input
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9.5 text-xs bg-inset"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-fg p-1 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Property Selector & Refresh */}
            <div className="flex items-center gap-2">
              <div className="min-w-[190px]">
                <Select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="h-9.5 text-xs bg-inset"
                >
                  <option value="all">All Properties ({tenants.length})</option>
                  {properties.map((p) => {
                    const count = tenants.filter((t) => String(t.property_id) === String(p.id)).length;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} ({count})
                      </option>
                    );
                  })}
                </Select>
              </div>

              {/* Clear filters button */}
              {(searchTerm || selectedPropertyId !== "all" || selectedStatusTab !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="h-9 px-2.5 text-xs text-muted hover:text-fg"
                  title="Clear all filters"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}

              {/* Refresh button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                loading={loading}
                className="h-9 px-2.5 text-xs"
                title="Reload list"
              >
                {!loading && <RotateCw className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          {/* Status Tabs Bar */}
          <div className="flex items-center gap-1.5 border-t border-edge/60 pt-2.5 overflow-x-auto">
            {(
              [
                { id: "all", label: "All Tenants", count: tabCounts.all },
                { id: "active", label: "Active", count: tabCounts.active },
                { id: "pending_approval", label: "Pending", count: tabCounts.pending },
                { id: "inactive", label: "Inactive", count: tabCounts.inactive },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatusTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedStatusTab === tab.id
                    ? "bg-accent/15 text-accent border border-accent/20"
                    : "text-muted hover:text-fg hover:bg-card/60"
                }`}
              >
                <span>{tab.label}</span>
                <span className="rounded-full bg-inset px-1.5 py-0.2 text-[10px] tabular-nums font-mono opacity-80">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tenant Table matching Screenshot 2 */}
        <TenantTable
          residents={filteredTenants}
          loading={loading}
          isSearching={isSearching}
          busyId={busyId}
          onSelectTenant={setSelectedTenant}
          onEditTenant={setEditingTenant}
          onDeleteTenant={(t) => setDeletingTenant(t)}
          onApproveTenant={async (t) => {
            await handleApprove(t);
            setSuccessMessage(`Tenant reservation for ${t.name} approved.`);
          }}
        />

        {/* Footer showing count */}
        <div className="flex items-center justify-between text-xs text-muted px-1">
          <p>
            Showing {filteredTenants.length} of {tenants.length} tenant{tenants.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Tenant Details Modal (Screenshot 3 style) */}
      <TenantDetailModal
        tenant={selectedTenant}
        isBusy={busyId === selectedTenant?.id}
        onVacate={async (t) => {
          await handleVacate(t);
          setSuccessMessage(`Lease ended for ${t.name}. Room ${t.room} is now vacant.`);
        }}
        onDelete={async (t) => {
          await handleDelete(t);
          setSuccessMessage(`Resident record for ${t.name} deleted.`);
        }}
        onClose={() => setSelectedTenant(null)}
      />

      {/* Edit Tenant Info Modal (Screenshot 1 style) */}
      <EditTenantModal
        tenant={editingTenant}
        open={Boolean(editingTenant)}
        onClose={() => setEditingTenant(null)}
        onSuccess={() => {
          setSuccessMessage(`Tenant info updated successfully.`);
          handleRefresh();
        }}
      />

      {/* Add New Tenant Modal */}
      <AddTenantModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setSuccessMessage(`New tenant added successfully. Awaiting room approval.`);
          handleRefresh();
        }}
      />

      {/* Custom Confirmation Dialog for Delete (Replaces browser "localhost says" alert) */}
      <ConfirmDialog
        open={Boolean(deletingTenant)}
        onClose={() => {
          if (!isDeleting) setDeletingTenant(null);
        }}
        onConfirm={async () => {
          if (!deletingTenant) return;
          setIsDeleting(true);
          try {
            await handleDelete(deletingTenant);
            setSuccessMessage(`Tenant record for ${deletingTenant.name} removed.`);
            setDeletingTenant(null);
          } finally {
            setIsDeleting(false);
          }
        }}
        title="Delete Resident Record"
        confirmText="Delete Resident"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
        description={
          deletingTenant ? (
            <span>
              Are you sure you want to delete resident{" "}
              <strong className="text-fg font-semibold">"{deletingTenant.name}"</strong> (Room {deletingTenant.room})?
              This will release their room assignment and remove their record from the active tenant directory.
            </span>
          ) : null
        }
      />
    </div>
  );
}