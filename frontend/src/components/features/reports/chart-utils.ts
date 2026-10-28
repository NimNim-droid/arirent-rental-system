/**
 * Round a chart axis maximum up to a readable number of divisions.
 */
export function niceCeiling(value: number, divisions = 4): number {
  // Keep a sensible peso scale when a period has no revenue yet.
  const safeValue = Number.isFinite(value) ? Math.max(value, 1000) : 1000;
  const rough = safeValue / divisions;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const normalized = rough / magnitude;
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5];
  const step = steps.find((candidate) => candidate >= normalized) ?? 10;

  return step * magnitude * divisions;
}

export function formatAxisMoney(value: number): string {
  return `₱ ${Math.round(value).toLocaleString("en-PH")}`;
}

export function formatWholeMoney(value: number): string {
  return `₱${Math.round(value).toLocaleString("en-PH")}`;
}
