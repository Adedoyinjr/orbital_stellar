import { describe, it, expect } from "vitest";
import { LruCache } from "../src/LruCache.js";

describe("LruCache", () => {
  describe("constructor", () => {
    it("creates a cache with the given max size", () => {
      const cache = new LruCache<string, number>(3);
      expect(cache.size).toBe(0);
    });
  });

  describe("set and get", () => {
    it("sets a key and retrieves its value", () => {
      const cache = new LruCache<string, number>(3);
      cache.set("a", 1);
      expect(cache.get("a")).toBe(1);
    });

    it("returns undefined for a missing key", () => {
      const cache = new LruCache<string, number>(3);
      expect(cache.get("missing")).toBeUndefined();
    });

    it("updating an existing key returns the new value", () => {
      const cache = new LruCache<string, number>(3);
      cache.set("a", 1);
      cache.set("a", 2);
      expect(cache.get("a")).toBe(2);
    });

    it("supports string keys and object values", () => {
      const cache = new LruCache<string, { n: number }>(3);
      cache.set("x", { n: 42 });
      expect(cache.get("x")).toEqual({ n: 42 });
    });

    it("supports number keys", () => {
      const cache = new LruCache<number, string>(3);
      cache.set(1, "one");
      expect(cache.get(1)).toBe("one");
    });
  });

  describe("has", () => {
    it("returns true for a key that exists", () => {
      const cache = new LruCache<string, number>(3);
      cache.set("a", 1);
      expect(cache.has("a")).toBe(true);
    });

    it("returns false for a key that does not exist", () => {
      const cache = new LruCache<string, number>(3);
      expect(cache.has("missing")).toBe(false);
    });

    it("returns false after a key is deleted", () => {
      const cache = new LruCache<string, number>(3);
      cache.set("a", 1);
      cache.delete("a");
      expect(cache.has("a")).toBe(false);
    });
  });

  describe("delete", () => {
    it("returns true when deleting an existing key", () => {
      const cache = new LruCache<string, number>(3);
      cache.set("a", 1);
      expect(cache.delete("a")).toBe(true);
    });

    it("returns false when deleting a missing key", () => {
      const cache = new LruCache<string, number>(3);
      expect(cache.delete("missing")).toBe(false);
    });

    it("removes the key so get returns undefined", () => {
      const cache = new LruCache<string, number>(3);
      cache.set("a", 1);
      cache.delete("a");
      expect(cache.get("a")).toBeUndefined();
      expect(cache.size).toBe(0);
    });
  });

  describe("clear", () => {
    it("empties the cache", () => {
      const cache = new LruCache<string, number>(3);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.has("a")).toBe(false);
      expect(cache.has("b")).toBe(false);
    });

    it("allows re-adding entries after clear", () => {
      const cache = new LruCache<string, number>(3);
      cache.set("a", 1);
      cache.clear();
      cache.set("a", 10);
      expect(cache.get("a")).toBe(10);
    });
  });

  describe("size", () => {
    it("returns the number of entries", () => {
      const cache = new LruCache<string, number>(3);
      expect(cache.size).toBe(0);
      cache.set("a", 1);
      expect(cache.size).toBe(1);
      cache.set("b", 2);
      expect(cache.size).toBe(2);
    });

    it("decrements when a key is deleted", () => {
      const cache = new LruCache<string, number>(3);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.delete("a");
      expect(cache.size).toBe(1);
    });
  });

  describe("capacity and eviction", () => {
    it("holds up to capacity entries without eviction", () => {
      const cache = new LruCache<string, number>(2);
      cache.set("a", 1);
      cache.set("b", 2);
      expect(cache.size).toBe(2);
      expect(cache.get("a")).toBe(1);
      expect(cache.get("b")).toBe(2);
    });

    it("evicts the least recently used entry when over capacity", () => {
      const cache = new LruCache<string, number>(2);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);
      expect(cache.size).toBe(2);
      expect(cache.get("a")).toBeUndefined(); // "a" was LRU, evicted
      expect(cache.get("b")).toBe(2);
      expect(cache.get("c")).toBe(3);
    });

    it("evicts only the oldest entry when over capacity by one", () => {
      const cache = new LruCache<string, number>(3);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);
      cache.set("d", 4);
      expect(cache.size).toBe(3);
      expect(cache.get("a")).toBeUndefined();
      expect(cache.get("b")).toBe(2);
      expect(cache.get("c")).toBe(3);
      expect(cache.get("d")).toBe(4);
    });

    it("updating an existing key does not evict", () => {
      const cache = new LruCache<string, number>(2);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("a", 10);
      expect(cache.size).toBe(2);
      expect(cache.get("a")).toBe(10);
      expect(cache.get("b")).toBe(2);
    });

    it("get() refreshes recency, changing eviction order", () => {
      const cache = new LruCache<string, number>(2);
      cache.set("a", 1);
      cache.set("b", 2);
      // "a" is LRU; accessing "a" makes it MRU, so "b" becomes LRU
      cache.get("a");
      cache.set("c", 3);
      expect(cache.get("a")).toBe(1); // "a" survived because it was refreshed
      expect(cache.get("b")).toBeUndefined(); // "b" was evicted instead
      expect(cache.get("c")).toBe(3);
    });

    it("set() on an existing key refreshes recency", () => {
      const cache = new LruCache<string, number>(2);
      cache.set("a", 1);
      cache.set("b", 2);
      // Re-setting "a" makes it MRU; "b" is LRU
      cache.set("a", 10);
      cache.set("c", 3);
      expect(cache.get("a")).toBe(10); // "a" survived
      expect(cache.get("b")).toBeUndefined(); // "b" evicted
      expect(cache.get("c")).toBe(3);
    });

    it("eviction order after multiple recency refreshes", () => {
      const cache = new LruCache<string, number>(3);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);
      cache.get("a"); // a is now MRU
      cache.get("b"); // b is now MRU, c is LRU
      cache.set("d", 4); // evicts "c"
      expect(cache.get("c")).toBeUndefined();
      expect(cache.get("a")).toBe(1);
      expect(cache.get("b")).toBe(2);
      expect(cache.get("d")).toBe(4);
    });
  });

  describe("edge cases", () => {
    it("works with capacity of 1", () => {
      const cache = new LruCache<string, number>(1);
      cache.set("a", 1);
      expect(cache.size).toBe(1);
      expect(cache.get("a")).toBe(1);
      cache.set("b", 2);
      expect(cache.size).toBe(1);
      expect(cache.get("a")).toBeUndefined(); // evicted
      expect(cache.get("b")).toBe(2);
    });

    it("getting a missing key does not change size", () => {
      const cache = new LruCache<string, number>(3);
      cache.set("a", 1);
      cache.get("missing");
      expect(cache.size).toBe(1);
      expect(cache.get("a")).toBe(1); // recency not affected by missing-key get
    });

    it("deleting a missing key returns false and does not change size", () => {
      const cache = new LruCache<string, number>(3);
      cache.set("a", 1);
      expect(cache.delete("missing")).toBe(false);
      expect(cache.size).toBe(1);
    });

    it("delete on empty cache returns false", () => {
      const cache = new LruCache<string, number>(3);
      expect(cache.delete("a")).toBe(false);
      expect(cache.size).toBe(0);
    });

    it("has on empty cache returns false", () => {
      const cache = new LruCache<string, number>(3);
      expect(cache.has("a")).toBe(false);
    });

    it("size on empty cache returns 0", () => {
      const cache = new LruCache<string, number>(3);
      expect(cache.size).toBe(0);
    });

    it("clear on empty cache is a no-op", () => {
      const cache = new LruCache<string, number>(3);
      expect(() => cache.clear()).not.toThrow();
      expect(cache.size).toBe(0);
    });
  });
});
