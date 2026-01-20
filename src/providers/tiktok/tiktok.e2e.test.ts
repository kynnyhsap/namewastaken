import { describe, test, expect } from "bun:test";

import { Effect } from "effect";

import { tiktok } from "./tiktok";

// Integration tests - make real HTTP requests
// Run with: bun test:e2e

describe("TikTok provider (e2e)", () => {
  const KNOWN_TAKEN = "mrbeast";
  const LIKELY_AVAILABLE = "xyzabc123456789test";

  test("detects taken username", async () => {
    const result = await Effect.runPromise(tiktok.check(KNOWN_TAKEN));
    expect(result).toBe(true);
  }, 15000);

  test("detects available username", async () => {
    const result = await Effect.runPromise(tiktok.check(LIKELY_AVAILABLE));
    expect(result).toBe(false);
  }, 15000);
});
