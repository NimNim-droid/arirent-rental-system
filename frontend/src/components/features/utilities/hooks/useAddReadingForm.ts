import { useState, useEffect, useMemo, type FormEvent } from "react";
import { utilitiesService } from "@/lib/services/utilities";
import { formatLocalDateString } from "@/lib/formatters";
import { getErrorMessage } from "@/lib/errors";
import type { Tenant } from "@/lib/types";

interface UseAddReadingFormProps {
  open: boolean;
  tenants: Tenant[];
  elecRate: number;
  getLatestReading: (tenantId: string) => number;
  onSuccess: () => void;
  onClose: () => void;
}

export function useAddReadingForm({
  open,
  tenants,
  elecRate,
  getLatestReading,
  onSuccess,
  onClose,
}: UseAddReadingFormProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [prevReading, setPrevReading] = useState<number>(0);
  const [currReading, setCurrReading] = useState<number | "">("");
  const [readingDate, setReadingDate] = useState<string>(formatLocalDateString());
  const [customRate, setCustomRate] = useState<number>(elecRate);
  const [meterPhoto, setMeterPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setCustomRate(elecRate);
  }, [elecRate]);

  const availableTenants = useMemo(
    () =>
      tenants.filter((t) => {
        if (selectedPropertyId === "all") return true;
        return String(t.property_id) === String(selectedPropertyId);
      }),
    [tenants, selectedPropertyId]
  );

  useEffect(() => {
    if (open && availableTenants.length > 0) {
      if (!selectedTenantId || !availableTenants.some((t) => t.id === selectedTenantId)) {
        const first = availableTenants[0];
        setSelectedTenantId(first.id);
        const lastReading = getLatestReading(first.id);
        setPrevReading(lastReading);
        setCurrReading("");
      }
    }
  }, [open, selectedPropertyId, availableTenants, selectedTenantId, getLatestReading]);

  useEffect(() => {
    if (!open) {
      setMeterPhoto(null);
      setFormError(null);
    }
  }, [open]);

  // Preview URL is created once per selected file and released on change/unmount.
  const meterPhotoPreview = useMemo(
    () => (meterPhoto ? URL.createObjectURL(meterPhoto) : null),
    [meterPhoto]
  );

  useEffect(() => {
    return () => {
      if (meterPhotoPreview) URL.revokeObjectURL(meterPhotoPreview);
    };
  }, [meterPhotoPreview]);

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    const last = getLatestReading(tenantId);
    setPrevReading(last);
    setCurrReading("");
    setFormError(null);
  };

  const currentNumber = typeof currReading === "number" ? currReading : 0;
  const usage = Math.max(0, currentNumber - prevReading);
  const totalAmount = usage * customRate;
  const isInvalidReading = currentNumber > 0 && currentNumber < prevReading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedTenantId) {
      setFormError("Please select a tenant.");
      return;
    }

    if (currReading === "" || isNaN(Number(currReading))) {
      setFormError("Please enter a valid current meter reading.");
      return;
    }

    if (currentNumber < prevReading) {
      setFormError("Current reading cannot be lower than the previous reading.");
      return;
    }

    setLoading(true);
    try {
      await utilitiesService.createReading({
        tenant_id: selectedTenantId,
        prev_reading: prevReading,
        curr_reading: currentNumber,
        date: readingDate,
        meter_photo: meterPhoto,
      });

      setMeterPhoto(null);
      onSuccess();
      onClose();
    } catch (err) {
      setFormError(getErrorMessage(err, "Failed to record meter reading."));
    } finally {
      setLoading(false);
    }
  };

  return {
    selectedPropertyId,
    setSelectedPropertyId,
    selectedTenantId,
    setSelectedTenantId,
    prevReading,
    setPrevReading,
    currReading,
    setCurrReading,
    readingDate,
    setReadingDate,
    customRate,
    meterPhoto,
    meterPhotoPreview,
    setMeterPhoto,
    loading,
    formError,
    setFormError,
    availableTenants,
    usage,
    totalAmount,
    isInvalidReading,
    handleTenantChange,
    handleSubmit,
  };
}

