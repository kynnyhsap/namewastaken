import { describe, test, expect } from "bun:test";
import { Effect } from "effect";
import { instagram } from "./instagram";

// Integration tests - make real HTTP requests
// Run with: bun test src/providers/instagram/instagram.e2e.ts

describe.skip("Instagram provider (e2e)", () => {
  const KNOWN_TAKEN = "nike";
  const LIKELY_AVAILABLE = "xyzabc123456789test";

  test("detects taken username", async () => {
    const result = await Effect.runPromise(instagram.check(KNOWN_TAKEN));
    expect(result).toBe(true);
  }, 10000);

  test("detects available username", async () => {
    const result = await Effect.runPromise(instagram.check(LIKELY_AVAILABLE));
    expect(result).toBe(false);
  }, 10000);
});
