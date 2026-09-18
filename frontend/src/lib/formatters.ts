/**
 * Currency, date, and general display formatters for AriRent.
 * Centralized to avoid duplicate formatting logic across components.
 */

/**
 * Formats a number as Philippine Peso currency (₱X,XXX.XX).
 */
export function formatCurrency(amount: number | null | undefined): string {
  const value = amount ?? 0;
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats a date string into a localized readable date.
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Formats kilowatt-hours usage.
 */
export function formatUsage(kwh: number | null | undefined): string {
  const value = kwh ?? 0;
  return `${value.toLocaleString("en-PH", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })} kWh`;
}

/**
 * Formats file size in bytes into human-readable KB or MB string.
 */
export function formatFileSize(value?: number | string): string {
  if (typeof value === "string") return value;
  if (typeof value !== "number") return "—";
  return value >= 1024 * 1024
    ? `${(value / (1024 * 1024)).toFixed(2)} MB`
    : `${Math.max(1, Math.round(value / 1024))} KB`;
}
