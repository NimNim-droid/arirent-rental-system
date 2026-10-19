import { describe, it, expect, beforeEach, vi } from "vitest";
import { clientCache } from "../cache";

describe("ClientCache Service", () => {
  beforeEach(() => {
    clientCache.clear();
    vi.restoreAllMocks();
  });

  it("stores and retrieves cached items before expiration", () => {
    clientCache.set("user:123", { name: "Alice" });
    const cached = clientCache.get<{ name: string }>("user:123");
    expect(cached).toEqual({ name: "Alice" });
  });

  it("returns null for non-existent cache keys", () => {
    expect(clientCache.get("non_existent")).toBeNull();
  });

  it("expires entries when TTL passes", () => {
    const now = 1000000;
    vi.spyOn(Date, "now").mockReturnValue(now);

    // Set item with 1000ms TTL
    clientCache.set("tempKey", "temporary data", 1000);
    expect(clientCache.get("tempKey")).toBe("temporary data");

    // Advance time past expiration
    vi.spyOn(Date, "now").mockReturnValue(now + 1001);
    expect(clientCache.get("tempKey")).toBeNull();
  });

  it("remember() fetches only on cache miss and reuses cached result", async () => {
    const fetcher = vi.fn().mockResolvedValue({ id: 1, role: "admin" });

    // First call: executes fetcher
    const firstCall = await clientCache.remember("admin_profile", fetcher);
    expect(firstCall).toEqual({ id: 1, role: "admin" });
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Second call: retrieves from cache without calling fetcher
    const secondCall = await clientCache.remember("admin_profile", fetcher);
    expect(secondCall).toEqual({ id: 1, role: "admin" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("invalidate() removes keys matching a prefix case-insensitively", () => {
    clientCache.set("bills:all", [1, 2, 3]);
    clientCache.set("bills:tenant:5", [1]);
    clientCache.set("tenants:all", ["Alice", "Bob"]);

    clientCache.invalidate("bills");

    expect(clientCache.get("bills:all")).toBeNull();
    expect(clientCache.get("bills:tenant:5")).toBeNull();
    // Non-matching keys remain intact
    expect(clientCache.get("tenants:all")).toEqual(["Alice", "Bob"]);
  });

  it("clear() purges all entries from store", () => {
    clientCache.set("key1", "val1");
    clientCache.set("key2", "val2");

    clientCache.clear();

    expect(clientCache.get("key1")).toBeNull();
    expect(clientCache.get("key2")).toBeNull();
  });
});
