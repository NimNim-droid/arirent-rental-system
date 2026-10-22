import { useCallback, useEffect, useState, useMemo } from "react";
import { tenantsService } from "@/lib/services/tenants";
import { utilitiesService } from "@/lib/services/utilities";
import { settingsService } from "@/lib/services/settings";
import { propertiesService } from "@/lib/services/properties";
import { getErrorMessage } from "@/lib/errors";
import { formatLocalDateString } from "@/lib/formatters";
import type { Settings, Tenant, UtilityReading, Property } from "@/lib/types";

export function useUtilities() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);

  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

  const [readings, setReadings] = useState<UtilityReading[]>([]);
  const [readingsLoading, setReadingsLoading] = useState(true);

  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Filter states
  const [activeTab, setActiveTab] = useState<"electricity" | "water">("electricity");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  // Notification & error
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProperties = useCallback(async () => {
    setPropertiesLoading(true);
    try {
      const res = await propertiesService.getProperties();
      setProperties(res);
    } catch {
      // Non-blocking
    } finally {
      setPropertiesLoading(false);
    }
  }, []);

  const loadTenants = useCallback(async () => {
    setTenantsLoading(true);
    try {
      const res = await tenantsService.getTenants({ status: "active", per_page: 250 });
      setTenants(res.data);
    } catch {
      // Non-blocking
    } finally {
      setTenantsLoading(false);
    }
  }, []);

  const loadReadings = useCallback(async () => {
    setReadingsLoading(true);
    try {
      const res = await utilitiesService.getReadings();
      setReadings(res);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load meter readings."));
    } finally {
      setReadingsLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await settingsService.getSettings();
      setSettings(res);
    } catch {
      // Non-blocking
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
    loadTenants();
    loadReadings();
    loadSettings();
  }, [loadProperties, loadTenants, loadReadings, loadSettings]);

  const elecRate = settings?.elec_rate ?? 12.5;
  const waterRate = settings?.water_rate ?? 200.0;

  // Filtered readings
  const filteredReadings = useMemo(() => {
    return readings.filter((r) => {
      // Match utility type if present on reading
      if (r.type && r.type !== activeTab) {
        return false;
      }

      // Filter by property
      if (propertyFilter !== "all") {
        const tenant = tenants.find((t) => String(t.id) === String(r.tenant_id));
        const propId = tenant?.property_id || "";
        const propName = (tenant?.property?.name || r.property_name || "").toLowerCase();
        if (propId !== propertyFilter && !propName.includes(propertyFilter.toLowerCase())) {
          return false;
        }
      }

      // Filter by tenant
      if (tenantFilter !== "all" && String(r.tenant_id) !== String(tenantFilter)) {
        return false;
      }

      // Search query (tenant name or room)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const tName = (r.tenant_name || "").toLowerCase();
        const room = (r.room || "").toLowerCase();
        const prop = (r.property_name || "").toLowerCase();
        if (!tName.includes(q) && !room.includes(q) && !prop.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [readings, activeTab, propertyFilter, tenantFilter, searchQuery, tenants]);

  // Helper to get latest reading for a tenant
  const getLatestReading = useCallback(
    (tenantId: string) => {
      if (!tenantId) return 0;
      const sorted = readings
        .filter((r) => String(r.tenant_id) === String(tenantId))
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      return sorted[0]?.curr_reading ?? 0;
    },
    [readings]
  );

  const handleDeleteReading = async (id: string) => {
    setDeletingId(id);
    setError("");
    setNotice("");
    try {
      await utilitiesService.deleteReading(id);
      setNotice("Utility reading deleted successfully.");
      await loadReadings();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete utility reading."));
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateSettings = async (updated: Partial<Settings>) => {
    try {
      const res = await settingsService.updateSettings(updated);
      setSettings(res);
      setNotice("Utility rates updated successfully.");
      setIsSettingsModalOpen(false);
      return true;
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update rates."));
      return false;
    }
  };

  const reloadAll = () => {
    loadProperties();
    loadTenants();
    loadReadings();
    loadSettings();
  };

  return {
    tenants,
    tenantsLoading,
    properties,
    propertiesLoading,
    readings: filteredReadings,
    allReadingsCount: readings.length,
    readingsLoading,
    settings,
    settingsLoading,
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
  };
}
