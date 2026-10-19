import { useState, useEffect, useMemo, type FormEvent } from "react";
import { formatLocalDateString } from "@/lib/formatters";
import { billingService } from "@/lib/services/billing";
import { getErrorMessage } from "@/lib/errors";
import type { Tenant } from "@/lib/types";

interface UseCreateBillFormProps {
  tenants: Tenant[];
  initialTenantId?: string;
  isOpen: boolean;
  onSuccess: (message: string) => void;
  onClose: () => void;
}

export function useCreateBillForm({
  tenants,
  initialTenantId,
  isOpen,
  onSuccess,
  onClose,
}: UseCreateBillFormProps) {
  const activeTenants = useMemo(() => tenants.filter((t) => t.status === "active"), [tenants]);

  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [rent, setRent] = useState<number>(0);
  const [elecUsage, setElecUsage] = useState<string>("");
  const [elecRate, setElecRate] = useState<number>(12.5);
  const [water, setWater] = useState<number>(500);
  const [lateFee, setLateFee] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>("");
  const [billingDate, setBillingDate] = useState<string>(formatLocalDateString());
  const [notes, setNotes] = useState<string>("");

  // Sub-meter calculator state
  const [showMeterCalc, setShowMeterCalc] = useState<boolean>(false);
  const [prevReading, setPrevReading] = useState<string>("");
  const [currReading, setCurrReading] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Selected active tenant
  const selectedTenant = useMemo(
    () => activeTenants.find((t) => String(t.id) === String(selectedTenantId)),
    [activeTenants, selectedTenantId]
  );

  // Reset form when modal opens or initial tenant changes
  useEffect(() => {
    if (isOpen) {
      const targetId = initialTenantId || (activeTenants[0]?.id ? String(activeTenants[0].id) : "");
      setSelectedTenantId(targetId);
      setError("");
      setShowMeterCalc(false);
      setElecUsage("");
      setPrevReading("");
      setCurrReading("");
    }
  }, [isOpen, initialTenantId, activeTenants]);

  // When selected tenant changes, auto-populate rent, water, anniversary due date, and coverage notes
  useEffect(() => {
    if (!selectedTenant) return;

    // Room rent
    const roomRent = selectedTenant.room_rent ?? 0;
    setRent(roomRent);

    // Water rate
    const tenantWater = selectedTenant.water_rate > 0 ? selectedTenant.water_rate : 500;
    setWater(tenantWater);

    // Calculate anniversary due date
    const now = new Date();
    const billingDay = selectedTenant.billing_day || 1;
    const year = now.getFullYear();
    const month = now.getMonth();

    // If today is past the anniversary day by more than 5 days, target next month
    let targetYear = year;
    let targetMonth = month;
    if (now.getDate() > billingDay + 5) {
      targetMonth += 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
    }

    // Days in target month
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const safeDay = Math.min(billingDay, daysInMonth);
    const calculatedDueDate = new Date(targetYear, targetMonth, safeDay);
    const formattedDue = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
    setDueDate(formattedDue);

    // Coverage period notes
    const coverageEnd = new Date(targetYear, targetMonth + 1, safeDay - 1);
    const startStr = calculatedDueDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const endStr = coverageEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    setNotes(`Monthly rent (Coverage: ${startStr} - ${endStr})`);

    // Latest meter reading prefill
    if (selectedTenant.latest_reading !== undefined && selectedTenant.latest_reading > 0) {
      setPrevReading(String(selectedTenant.latest_reading));
    } else {
      setPrevReading("0");
    }
  }, [selectedTenant]);

  // Handle meter calculation if landlord enters prev and curr
  const handleMeterCalcChange = (prevStr: string, currStr: string) => {
    setPrevReading(prevStr);
    setCurrReading(currStr);
    const p = parseFloat(prevStr) || 0;
    const c = parseFloat(currStr) || 0;
    if (c >= p) {
      setElecUsage((c - p).toFixed(1));
    }
  };

  // Live electricity and total calculation
  const parsedUsage = parseFloat(elecUsage) || 0;
  const electricityAmount = Math.max(0, parsedUsage * elecRate);
  const totalAmount = rent + electricityAmount + water + lateFee;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) {
      setError("Please select a resident.");
      return;
    }
    if (!dueDate) {
      setError("Please provide a due date.");
      return;
    }
    if (rent < 0) {
      setError("Rent amount cannot be negative.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await billingService.createBill({
        tenant_id: selectedTenant.id,
        rent,
        electricity: electricityAmount,
        elec_usage: parsedUsage,
        water,
        late_fee: lateFee,
        date: billingDate,
        due_date: dueDate,
        notes,
        prev_reading: showMeterCalc ? parseFloat(prevReading) || 0 : undefined,
        curr_reading: showMeterCalc ? parseFloat(currReading) || 0 : undefined,
      });

      onSuccess(res.message || `Bill issued successfully for ${selectedTenant.name}.`);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create bill. Please check inputs."));
    } finally {
      setLoading(false);
    }
  };

  return {
    activeTenants,
    selectedTenant,
    selectedTenantId,
    setSelectedTenantId,
    rent,
    setRent,
    elecUsage,
    setElecUsage,
    elecRate,
    setElecRate,
    water,
    setWater,
    lateFee,
    setLateFee,
    dueDate,
    setDueDate,
    billingDate,
    setBillingDate,
    notes,
    setNotes,
    showMeterCalc,
    setShowMeterCalc,
    prevReading,
    currReading,
    handleMeterCalcChange,
    parsedUsage,
    electricityAmount,
    totalAmount,
    loading,
    error,
    handleSubmit,
  };
}
