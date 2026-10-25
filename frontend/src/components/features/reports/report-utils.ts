/** Convert a "YYYY-MM" key into a short label such as "Oct 2026". */
export function formatMonthLabel(ym: string): string {
  try {
    const [year, month] = ym.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return ym;
  }
}

/** Short clock time such as "6:05 PM". */
export function formatClockTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
