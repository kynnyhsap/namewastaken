import { describe, test, expect, mock, afterEach } from "bun:test";
import { Effect } from "effect";
import { checkSingle, checkAll, checkProviders } from "./check";

describe("Check orchestration", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("checkSingle", () => {
    test("returns result for taken username", async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve(new Response(`"desc":"@testuser`))
      );

      const result = await Effect.runPromise(checkSingle("tiktok", "testuser"));
      expect(result).toEqual({
        provider: "tiktok",
        taken: true,
      });
    });

    test("returns result for available username", async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve(new Response("Not found"))
      );

      const result = await Effect.runPromise(checkSingle("tiktok", "testuser"));
      expect(result).toEqual({
        provider: "tiktok",
        taken: false,
      });
    });

    test("returns error result on network failure", async () => {
      globalThis.fetch = mock(() =>
        Promise.reject(new Error("Network error"))
      );

      const result = await Effect.runPromise(checkSingle("tiktok", "testuser"));
      expect(result.provider).toBe("tiktok");
      expect(result.taken).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("checkAll", () => {
    test("checks all providers concurrently", async () => {
      const fetchCalls: string[] = [];
      globalThis.fetch = mock((url: string) => {
        fetchCalls.push(url);
        return Promise.resolve(new Response("Not found", { status: 404 }));
      });

      const result = await Effect.runPromise(checkAll("testuser"));

      expect(result.username).toBe("testuser");
      expect(result.results).toHaveLength(5);
      expect(result.results.map((r) => r.provider).sort()).toEqual([
        "instagram",
        "threads",
        "tiktok",
        "x",
        "youtube",
      ]);

      // All fetches should have been called
      expect(fetchCalls).toHaveLength(5);
    });

    test("handles mixed results", async () => {
      globalThis.fetch = mock((url: string) => {
        if (url.includes("tiktok")) {
          return Promise.resolve(new Response(`"desc":"@testuser`));
        }
        if (url.includes("instagram")) {
          return Promise.resolve(new Response(`{"username":"testuser"}`));
        }
        return Promise.resolve(new Response("Not found", { status: 404 }));
      });

      const result = await Effect.runPromise(checkAll("testuser"));

      const tiktokResult = result.results.find((r) => r.provider === "tiktok");
      const instagramResult = result.results.find(
        (r) => r.provider === "instagram"
      );
      const youtubeResult = result.results.find(
        (r) => r.provider === "youtube"
      );

      expect(tiktokResult?.taken).toBe(true);
      expect(instagramResult?.taken).toBe(true);
      expect(youtubeResult?.taken).toBe(false);
    });
  });

  describe("checkProviders", () => {
    test("checks only specified providers", async () => {
      const fetchCalls: string[] = [];
      globalThis.fetch = mock((url: string) => {
        fetchCalls.push(url);
        return Promise.resolve(new Response("Not found", { status: 404 }));
      });

      const result = await Effect.runPromise(
        checkProviders(["tiktok", "instagram"], "testuser")
      );

      expect(result.username).toBe("testuser");
      expect(result.results).toHaveLength(2);
      expect(result.results.map((r) => r.provider).sort()).toEqual([
        "instagram",
        "tiktok",
      ]);

      // Only 2 fetches should have been made
      expect(fetchCalls).toHaveLength(2);
    });
  });
});
