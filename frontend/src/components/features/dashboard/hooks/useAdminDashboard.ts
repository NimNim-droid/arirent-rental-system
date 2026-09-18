import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { dashboardService } from "@/lib/services/dashboard";
import { propertiesService } from "@/lib/services/properties";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage } from "@/lib/errors";
import type { DashboardStats, Property } from "@/lib/types";

export function useAdminDashboard() {
  const navigate = useNavigate();
  const { user, initializing } = useAuth();
  const [selectedProperty, setSelectedProperty] = useState("all");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  const [properties, setProperties] = useState<Property[]>([]);
  const [propsLoading, setPropsLoading] = useState(true);

  const loadProperties = useCallback(async () => {
    setPropsLoading(true);
    try {
      const res = await propertiesService.getProperties();
      setProperties(res);
    } catch {
      // Non-critical
    } finally {
      setPropsLoading(false);
    }
  }, []);

  const loadStats = useCallback(async (propertyId?: string) => {
    setStatsLoading(true);
    setStatsError("");
    try {
      const res = await dashboardService.getAdminStats(
        propertyId && propertyId !== "all" ? { property_id: propertyId } : undefined
      );
      setStats(res);
    } catch (err) {
      setStatsError(getErrorMessage(err, "Unable to load dashboard data."));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initializing && user) {
      Promise.all([loadProperties(), loadStats(selectedProperty)]);
    } else if (!initializing && !user) {
      navigate("/login");
    }
  }, [user, initializing, selectedProperty, loadProperties, loadStats, navigate]);

  const visibleProperties =
    selectedProperty === "all"
      ? properties
      : properties.filter((p) => p.id === selectedProperty);

  const occupiedTotal = visibleProperties.reduce(
    (s, p) => s + (p.occupied_count ?? 0),
    0
  );
  const totalUnits = visibleProperties.reduce(
    (s, p) => s + (p.rooms_count ?? 0),
    0
  );
  const occupancyOverall =
    totalUnits === 0
      ? stats?.occupancy_rate ?? 0
      : Math.round((occupiedTotal / totalUnits) * 100);

  return {
    selectedProperty,
    setSelectedProperty,
    stats,
    statsLoading,
    statsError,
    properties,
    propsLoading,
    visibleProperties,
    occupiedTotal,
    totalUnits,
    occupancyOverall,
    loadStats,
    loadProperties,
  };
}
