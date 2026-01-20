import { describe, test, expect } from "bun:test";

import { Effect } from "effect";

import { x } from "./x";

// Integration tests - make real HTTP requests
// Run with: bun test:e2e
// NOTE: X.com serves JavaScript-rendered pages, detection may be unreliable

describe("X/Twitter provider (e2e)", () => {
  const KNOWN_TAKEN = "mrbeast";

  test("detects taken username", async () => {
    const result = await Effect.runPromise(x.check(KNOWN_TAKEN));
    // X returns JS-rendered pages, so detection is based on content heuristics
    expect(result).toBe(true);
  }, 15000);

  // Skip available username test - X.com's JS-rendered pages make this unreliable
  test.skip("detects available username", async () => {
    const result = await Effect.runPromise(x.check("xyzabc123456789test"));
    expect(result).toBe(false);
  }, 15000);
});
