import { describe, test, expect } from "bun:test";

import { Effect } from "effect";

import { facebook } from "./facebook";

// Integration tests - make real HTTP requests
// Run with: bun test src/providers/facebook/facebook.e2e.ts

describe.skip("Facebook provider (e2e)", () => {
  const KNOWN_TAKEN = "zuck";
  const LIKELY_AVAILABLE = "xyzabc123456789test";

  test("detects taken username", async () => {
    const result = await Effect.runPromise(facebook.check(KNOWN_TAKEN));
    expect(result).toBe(true);
  }, 10000);

  test("detects available username", async () => {
    const result = await Effect.runPromise(facebook.check(LIKELY_AVAILABLE));
    expect(result).toBe(false);
  }, 10000);
});
