import { useCallback, useEffect, useState } from "react";
import { tenantsService } from "@/lib/services/tenants";
import { utilitiesService } from "@/lib/services/utilities";
import { settingsService } from "@/lib/services/settings";
import { getErrorMessage } from "@/lib/errors";
import { formatLocalDateString } from "@/lib/formatters";
import type { Settings, Tenant, UtilityReading } from "@/lib/types";

function todayISO() {
  return formatLocalDateString();
}

export function useUtilities() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);

  const [readings, setReadings] = useState<UtilityReading[]>([]);
  const [readingsLoading, setReadingsLoading] = useState(true);

  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const [prevReading, setPrevReading] = useState<number>(0);
  const [currReading, setCurrReading] = useState<number>(0);
  const [selectedResident, setSelectedResident] = useState("");
  const [savingReading, setSavingReading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadTenants = useCallback(async () => {
    setTenantsLoading(true);
    try {
      const res = await tenantsService.getTenants({ status: "active", per_page: 200 });
      setTenants(res.data);
      setSelectedResident((prev) => prev || res.data[0]?.id || "");
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
    loadTenants();
    loadReadings();
    loadSettings();
  }, [loadTenants, loadReadings, loadSettings]);

  // Prefill previous reading from selected tenant's latest reading
  useEffect(() => {
    if (!selectedResident) return;
    const latest = readings
      .filter((r) => r.tenant_id === selectedResident)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    setPrevReading(latest ? latest.curr_reading : 0);
  }, [selectedResident, readings]);

  const elecRate = settings?.elec_rate ?? 0;
  const usageKwh = Math.max(0, currReading - prevReading);
  const computedAmount = usageKwh * elecRate;

  const handleSaveReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident) return;
    setSavingReading(true);
    setNotice("");
    setError("");
    try {
      await utilitiesService.createReading({
        tenant_id: selectedResident,
        prev_reading: prevReading,
        curr_reading: currReading,
        date: todayISO(),
      });
      setCurrReading(0);
      setNotice("Meter reading recorded successfully.");
      const updated = await utilitiesService.getReadings();
      setReadings(updated);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save the meter reading."));
    } finally {
      setSavingReading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    setNotice("");
    setError("");
    try {
      const updated = await settingsService.updateSettings({
        elec_rate: settings.elec_rate,
        water_rate: settings.water_rate,
        gcash_name: settings.gcash_name,
        gcash_number: settings.gcash_number,
      });
      setSettings(updated);
      setNotice("Configuration saved successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save configuration."));
    } finally {
      setSavingSettings(false);
    }
  };

  const reloadAll = () => {
    loadTenants();
    loadReadings();
    loadSettings();
  };

  return {
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
    elecRate,
    setSettings,
    handleSaveReading,
    handleSaveSettings,
    reloadAll,
  };
}
