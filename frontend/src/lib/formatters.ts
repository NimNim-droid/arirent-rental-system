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
 * Guarantees correct calendar day for YYYY-MM-DD dates regardless of user timezone.
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

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
 * Returns a YYYY-MM-DD string representing the local calendar date.
 */
export function formatLocalDateString(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}


/**
 * Formats a datetime string (e.g. "2025-04-21 10:24:00") into "Apr 21, 2025, 10:24 AM".
 * The time is shown as stored on the server (no timezone conversion).
 */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (!match) return value;
  const [, year, month, day, hour, minute] = match;
  const d = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  return d.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Formats the time portion of a datetime string (e.g. "2025-04-21 10:24:00") into "10:24 AM".
 * The time is shown as stored on the server (no timezone conversion).
 */
export function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (!match) return "—";
  const [, year, month, day, hour, minute] = match;
  const d = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  return d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
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

/**
 * Formats an invoice ID into an official document number (e.g. INV-2026-001).
 */
export function formatInvoiceNumber(id: number | string, dateString?: string | null): string {
  const num = String(id).padStart(3, "0");
  let year = new Date().getFullYear();
  if (dateString) {
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
      year = parsed.getFullYear();
    }
  }
  return `INV-${year}-${num}`;
}
