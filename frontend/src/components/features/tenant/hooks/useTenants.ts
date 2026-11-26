import { useCallback, useEffect, useState } from "react";
import { tenantsService } from "@/lib/services/tenants";
import { propertiesService } from "@/lib/services/properties";
import { getErrorMessage } from "@/lib/errors";
import type { Property, Tenant } from "@/lib/types";

export function useTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadProperties = useCallback(async () => {
    try {
      const data = await propertiesService.getProperties();
      setProperties(data);
    } catch {
      // Non-blocking
    }
  }, []);

  const loadTenants = useCallback(async (search?: string, isSearchCall = false) => {
    if (isSearchCall) {
      setIsSearching(true);
    } else {
      setLoading(true);
    }
    setError("");
    try {
      const res = await tenantsService.getTenants({ search, per_page: 200 });
      setTenants(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load tenants."));
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    void loadProperties();
  }, [loadProperties]);

  useEffect(() => {
    const isInitial = searchTerm === "" && loading;
    const t = setTimeout(() => {
      loadTenants(searchTerm || undefined, !isInitial);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const pendingApplicants = tenants.filter((t) => t.status === "pending_approval");
  const residents = tenants.filter((t) => t.status !== "pending_approval");

  const runAction = async (id: string, fn: () => Promise<void>): Promise<boolean> => {
    setBusyId(id);
    setError("");
    try {
      await fn();
      await loadTenants(searchTerm || undefined);
      return true;
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update the tenant."));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = (app: Tenant) =>
    runAction(app.id, () => tenantsService.approveTenant(app.id));

  const handleReject = (app: Tenant) =>
    runAction(app.id, () => tenantsService.rejectTenant(app.id));

  const handleVacate = (tenant: Tenant) =>
    runAction(tenant.id, () => tenantsService.vacateTenant(tenant.id)).then((ok) => {
      setSelectedTenant(null);
      return ok;
    });

  const handleDelete = (tenant: Tenant) =>
    runAction(tenant.id, () => tenantsService.deleteTenant(tenant.id)).then((ok) => {
      setSelectedTenant(null);
      return ok;
    });

  const refreshAll = useCallback(() => {
    void loadTenants(searchTerm || undefined);
    void loadProperties();
  }, [loadTenants, loadProperties, searchTerm]);

  return {
    tenants,
    properties,
    pendingApplicants,
    residents,
    searchTerm,
    setSearchTerm,
    selectedTenant,
    setSelectedTenant,
    loading,
    isSearching,
    error,
    busyId,
    loadTenants,
    loadProperties,
    refreshAll,
    handleApprove,
    handleReject,
    handleVacate,
    handleDelete,
  };
}
