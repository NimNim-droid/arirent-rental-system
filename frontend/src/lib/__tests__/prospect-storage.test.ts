import { describe, expect, it, beforeEach } from "vitest";
import {
  clearProspectDraft,
  loadProspectDraft,
  saveProspectDraft,
} from "@/components/features/listings/prospect-storage";

describe("prospect-storage", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, "sessionStorage", {
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
        removeItem: (k: string) => store.delete(k),
      },
      configurable: true,
    });
  });

  it("saves, loads, and clears prospect inquiry drafts cleanly", () => {
    expect(loadProspectDraft()).toBeNull();

    saveProspectDraft({
      inquiry_id: "42",
      property_id: "1",
      room_id: "5",
      name: "Maria Santos",
      phone: "0917-555-0199",
      email: "maria@example.com",
    });

    expect(loadProspectDraft()).toEqual({
      inquiry_id: "42",
      property_id: "1",
      room_id: "5",
      name: "Maria Santos",
      phone: "0917-555-0199",
      email: "maria@example.com",
    });

    clearProspectDraft();
    expect(loadProspectDraft()).toBeNull();
  });
});
