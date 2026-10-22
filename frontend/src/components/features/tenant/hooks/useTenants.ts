import { useCallback, useEffect, useState } from "react";
import { tenantsService } from "@/lib/services/tenants";
import { getErrorMessage } from "@/lib/errors";
import type { Tenant } from "@/lib/types";

export function useTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

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
    const isInitial = searchTerm === "" && loading;
    const t = setTimeout(() => {
      loadTenants(searchTerm || undefined, !isInitial);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const pendingApplicants = tenants.filter((t) => t.status === "pending_approval");
  const residents = tenants.filter((t) => t.status !== "pending_approval");

  const runAction = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    setError("");
    try {
      await fn();
      await loadTenants(searchTerm || undefined);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update the tenant."));
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = (app: Tenant) =>
    runAction(app.id, () => tenantsService.approveTenant(app.id));

  const handleReject = (app: Tenant) =>
    runAction(app.id, () => tenantsService.rejectTenant(app.id));

  const handleVacate = (tenant: Tenant) => {
    void runAction(tenant.id, () => tenantsService.vacateTenant(tenant.id)).then(() => {
      setSelectedTenant(null);
    });
  };

  const handleDelete = (tenant: Tenant) => {
    void runAction(tenant.id, () => tenantsService.deleteTenant(tenant.id)).then(() => {
      setSelectedTenant(null);
    });
  };

  return {
    tenants,
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
    handleApprove,
    handleReject,
    handleVacate,
    handleDelete,
  };
}
