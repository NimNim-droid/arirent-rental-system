import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { dashboardService } from "@/lib/services/dashboard";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage } from "@/lib/errors";
import type { TenantDashboardData } from "@/lib/types";

export function useTenantDashboard() {
  const navigate = useNavigate();
  const { user, initializing } = useAuth();
  const [stats, setStats] = useState<TenantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await dashboardService.getTenantDashboard();
      setStats(res);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load your dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initializing) {
      if (!user) {
        navigate("/login");
        return;
      }
      loadData();
    }
  }, [user, initializing, loadData, navigate]);

  const unit = stats?.unit;
  const elec = stats?.electricity;
  const hasBalance = (stats?.outstanding_balance ?? 0) > 0;

  return {
    user,
    stats,
    unit,
    elec,
    hasBalance,
    loading,
    error,
    loadData,
  };
}
