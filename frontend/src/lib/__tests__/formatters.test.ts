import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatLocalDateString,
  formatUsage,
  formatFileSize,
} from "../formatters";

describe("Formatters Library", () => {
  describe("formatCurrency", () => {
    it("formats standard amounts into Philippine Peso currency", () => {
      expect(formatCurrency(12000)).toBe("₱12,000.00");
      expect(formatCurrency(1250.5)).toBe("₱1,250.50");
    });

    it("handles zero, null, and undefined safely", () => {
      expect(formatCurrency(0)).toBe("₱0.00");
      expect(formatCurrency(null)).toBe("₱0.00");
      expect(formatCurrency(undefined)).toBe("₱0.00");
    });
  });

  describe("formatDate", () => {
    it("formats YYYY-MM-DD date strings without timezone day-shift", () => {
      const formatted = formatDate("2026-10-15");
      expect(formatted).toContain("Oct");
      expect(formatted).toContain("15");
      expect(formatted).toContain("2026");
    });

    it("formats ISO timestamps with date and year", () => {
      const formatted = formatDate("2026-05-20T10:30:00Z");
      expect(formatted).toContain("May");
      expect(formatted).toContain("2026");
    });

    it("handles null, empty, and invalid dates gracefully", () => {
      expect(formatDate(null)).toBe("—");
      expect(formatDate(undefined)).toBe("—");
      expect(formatDate("")).toBe("—");
      expect(formatDate("invalid-date-string")).toBe("invalid-date-string");
    });
  });

  describe("formatLocalDateString", () => {
    it("returns formatted YYYY-MM-DD string", () => {
      const testDate = new Date(2026, 9, 15); // Month is 0-indexed: 9 = October
      expect(formatLocalDateString(testDate)).toBe("2026-10-15");
    });
  });

  describe("formatUsage", () => {
    it("formats kWh usage correctly", () => {
      expect(formatUsage(60)).toBe("60.0 kWh");
      expect(formatUsage(125.75)).toBe("125.75 kWh");
      expect(formatUsage(0)).toBe("0.0 kWh");
      expect(formatUsage(null)).toBe("0.0 kWh");
    });
  });

  describe("formatFileSize", () => {
    it("formats bytes into KB and MB", () => {
      expect(formatFileSize(512)).toBe("1 KB");
      expect(formatFileSize(2048)).toBe("2 KB");
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe("2.50 MB");
      expect(formatFileSize("Already Formatted")).toBe("Already Formatted");
      expect(formatFileSize(undefined)).toBe("—");
    });
  });
});
