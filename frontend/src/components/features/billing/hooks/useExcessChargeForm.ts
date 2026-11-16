import { useState, useEffect, type FormEvent } from "react";
import { excessChargesService } from "@/lib/services/excess-charges";
import { getErrorMessage } from "@/lib/errors";
import { formatLocalDateString } from "@/lib/formatters";
import type { Tenant } from "@/lib/types";

interface UseExcessChargeFormProps {
  open: boolean;
  tenants: Tenant[];
  onClose: () => void;
  onSuccess: () => void;
}

export function useExcessChargeForm({
  open,
  tenants,
  onClose,
  onSuccess,
}: UseExcessChargeFormProps) {
  const [tenantId, setTenantId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [chargeDate, setChargeDate] = useState<string>(formatLocalDateString());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (
        tenants.length > 0 &&
        (!tenantId || !tenants.some((t) => String(t.id) === String(tenantId)))
      ) {
        setTenantId(String(tenants[0].id));
      }
      setError(null);
    }
  }, [open, tenants, tenantId]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAmount("");
    setChargeDate(formatLocalDateString());
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const selectedTenant = tenantId || (tenants[0] ? String(tenants[0].id) : "");
    if (!selectedTenant) {
      setError("Please select an active tenant.");
      return;
    }

    if (!title.trim()) {
      setError("Please provide a title for the charge.");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }

    setLoading(true);
    try {
      await excessChargesService.createCharge({
        tenant_id: selectedTenant,
        title: title.trim(),
        description: description.trim() || undefined,
        amount: numAmount,
        charge_date: chargeDate,
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create incidental charge."));
    } finally {
      setLoading(false);
    }
  };

  return {
    tenantId,
    setTenantId,
    title,
    setTitle,
    description,
    setDescription,
    amount,
    setAmount,
    chargeDate,
    setChargeDate,
    loading,
    error,
    handleClose,
    handleSubmit,
  };
}

